---
name: stripe-payments
description: "Add Stripe payments to a web app — Checkout Sessions, Payment Intents, subscriptions, webhooks, customer portal, and pricing pages. Covers the decision of which Stripe API to use, produces working integration code, and handles webhook verification. No MCP server needed — uses Stripe npm package directly. Triggers: 'add payments', 'stripe', 'checkout', 'subscription', 'payment form', 'pricing page', 'billing', 'accept payments', 'stripe webhook', 'customer portal'."
compatibility: Designed for Claude Code (or similar products)
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Stripe Payments

Add Stripe payments to a web app. Covers the common patterns — one-time payments, subscriptions, webhooks, customer portal — with working code. No MCP server needed.

## Which Stripe API Do I Need?

| You want to... | Use | Complexity |
|----------------|-----|-----------|
| Accept a one-time payment | Checkout Sessions | Low — Stripe hosts the payment page |
| Embed a payment form in your UI | Payment Element + Payment Intents | Medium — you build the form, Stripe handles the card |
| Recurring billing / subscriptions | Checkout Sessions (subscription mode) | Low-Medium |
| Save a card for later | Setup Intents | Low |
| Marketplace / platform payments | Stripe Connect | High |
| Let customers manage billing | Customer Portal | Low — Stripe hosts it |

**Default recommendation**: Start with Checkout Sessions. It's the fastest path to accepting money. You can always add embedded forms later.

## Setup

### Install

```bash
npm install stripe @stripe/stripe-js
```

### API Keys

```bash
# Get keys from: https://dashboard.stripe.com/apikeys
# Test keys start with sk_test_ and pk_test_
# Live keys start with sk_live_ and pk_live_

# For Cloudflare Workers — store as secrets:
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# For local dev — .dev.vars:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Server-Side Client

```typescript
import Stripe from 'stripe';

// Cloudflare Workers
const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

// Node.js
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

## One-Time Payment (Checkout Sessions)

The fastest way to accept payment. Stripe hosts the entire checkout page.

### Create a Checkout Session (Server)

```typescript
app.post('/api/checkout', async (c) => {
  const { priceId, successUrl, cancelUrl } = await c.req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${new URL(c.req.url).origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${new URL(c.req.url).origin}/pricing`,
  });

  return c.json({ url: session.url });
});
```

### Redirect to Checkout (Client)

```typescript
async function handleCheckout(priceId: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  });
  const { url } = await res.json();
  window.location.href = url;
}
```

### Create Products and Prices

```bash
# Via Stripe CLI (recommended for setup)
stripe products create --name="Pro Plan" --description="Full access"
stripe prices create --product=prod_XXX --unit-amount=2900 --currency=aud --recurring[interval]=month

# Or via Dashboard: https://dashboard.stripe.com/products
```

**Hardcode price IDs** in your code (they don't change):
```typescript
const PRICES = {
  pro_monthly: 'price_1234567890',
  pro_yearly: 'price_0987654321',
} as const;
```

## Subscriptions

Same as one-time but with `mode: 'subscription'`:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: PRICES.pro_monthly, quantity: 1 }],
  success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/pricing`,
  // Link to existing customer if known:
  customer: customerId, // or customer_email: 'user@example.com'
});
```

### Check Subscription Status

```typescript
async function hasActiveSubscription(customerId: string): Promise<boolean> {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });
  return subs.data.length > 0;
}
```

## Webhooks

Stripe sends events to your server when things happen (payment succeeded, subscription cancelled, etc.). **You must verify the webhook signature.**

### Webhook Handler (Cloudflare Workers / Hono)

```typescript
app.post('/api/webhooks/stripe', async (c) => {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature')!;

  let event: Stripe.Event;
  try {
    // Use constructEventAsync for Workers (no Node crypto)
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return c.json({ error: 'Invalid signature' }, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Fulfill the order — update database, send email, grant access
      await handleCheckoutComplete(session);
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(sub);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(sub);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }
  }

  return c.json({ received: true });
});
```

### Register Webhook

```bash
# Local testing with Stripe CLI:
stripe listen --forward-to http://localhost:8787/api/webhooks/stripe

# Production — register via Dashboard:
# https://dashboard.stripe.com/webhooks
# URL: https://yourapp.com/api/webhooks/stripe
# Events: checkout.session.completed, customer.subscription.updated,
#          customer.subscription.deleted, invoice.payment_failed
```

### Cloudflare Workers Gotcha

`constructEvent` (synchronous) uses Node.js `crypto` which doesn't exist in Workers. Use `constructEventAsync` instead — it uses the Web Crypto API.

## Customer Portal

Let customers manage their own subscriptions (upgrade, downgrade, cancel, update payment method):

```typescript
app.post('/api/billing/portal', async (c) => {
  const { customerId } = await c.req.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${new URL(c.req.url).origin}/dashboard`,
  });

  return c.json({ url: session.url });
});
```

Configure the portal in Dashboard: https://dashboard.stripe.com/settings/billing/portal

## Pricing Page Pattern

Generate a pricing page that reads from Stripe products:

```typescript
// Server: fetch products and prices
app.get('/api/pricing', async (c) => {
  const prices = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
    type: 'recurring',
  });

  return c.json(prices.data.map(price => ({
    id: price.id,
    name: (price.product as Stripe.Product).name,
    description: (price.product as Stripe.Product).description,
    amount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
  })));
});
```

Or hardcode if you only have 2-3 plans — simpler and no API call on every page load.

## Stripe CLI (Local Development)

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listen for webhooks locally
stripe listen --forward-to http://localhost:8787/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

## Common Patterns

### Link Stripe Customer to Your User

```typescript
// On first checkout, create or find customer:
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,  // Creates new customer if none exists
  // OR
  customer: user.stripeCustomerId,  // Use existing
  metadata: { userId: user.id },  // Link back to your user
  // ...
});

// In webhook, save the customer ID:
case 'checkout.session.completed': {
  const session = event.data.object;
  await db.update(users)
    .set({ stripeCustomerId: session.customer as string })
    .where(eq(users.id, session.metadata.userId));
}
```

### Free Trial

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: PRICES.pro_monthly, quantity: 1 }],
  subscription_data: {
    trial_period_days: 14,
  },
  // ...
});
```

### Australian Dollars

```typescript
// Set currency when creating prices
const price = await stripe.prices.create({
  product: 'prod_XXX',
  unit_amount: 2900,  // $29.00 in cents
  currency: 'aud',
  recurring: { interval: 'month' },
});
```

## Gotchas

| Gotcha | Fix |
|--------|-----|
| `constructEvent` fails on Workers | Use `constructEventAsync` (Web Crypto API) |
| Webhook fires but handler not called | Check the endpoint URL matches exactly (trailing slash matters) |
| Test mode payments not appearing | Make sure you're using `sk_test_` key, not `sk_live_` |
| Price amounts are in cents | `2900` = $29.00. Always divide by 100 for display |
| Customer email doesn't match user | Use `customer` (existing ID) not `customer_email` for returning users |
| Subscription status stale | Don't cache — check via API or trust webhook events |
| Webhook retries | Stripe retries failed webhooks for up to 3 days. Return 200 quickly. |
| CORS on checkout redirect | Checkout URL is on stripe.com — use `window.location.href`, not fetch |
