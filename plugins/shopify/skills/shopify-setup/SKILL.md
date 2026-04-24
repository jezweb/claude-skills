---
name: shopify-setup
description: >
  Set up Shopify CLI auth and Admin API access for a store.
  Workflow: install CLI, authenticate, create custom app, store access token, verify.
  Use when connecting to a Shopify store, setting up API access, or troubleshooting
  auth issues with Shopify CLI or Admin API tokens.
compatibility: Designed for Claude Code (or similar products)
---

# Shopify Setup

Set up working Shopify CLI authentication and Admin API access for a store. Produces a verified API connection ready for product and content management.

## Workflow

### Step 1: Check Prerequisites

Verify the Shopify CLI is installed:

```bash
shopify version
```

If not installed:

```bash
npm install -g @shopify/cli
```

### Step 2: Authenticate with the Store

```bash
shopify auth login --store mystore.myshopify.com
```

This opens a browser for OAuth. The user must be a store owner or staff member with appropriate permissions.

After login, verify:

```bash
shopify store info
```

### Step 3: Create a Custom App for API Access

Custom apps provide stable Admin API access tokens (unlike CLI session tokens which expire).

**Check if an app already exists**: Ask the user if they have a custom app set up. If yes, skip to Step 4.

**If no custom app exists**, guide the user through creation via browser:

1. Navigate to `https://{store}.myshopify.com/admin/settings/apps/development`
2. Click **Create an app**
3. Name it (e.g. "Claude Code Integration")
4. Click **Configure Admin API scopes**
5. Enable these scopes (see `references/api-scopes.md` for details):
   - `read_products`, `write_products`
   - `read_content`, `write_content`
   - `read_product_listings`
   - `read_inventory`, `write_inventory`
   - `read_files`, `write_files`
6. Click **Save** then **Install app**
7. Copy the **Admin API access token** (shown only once)

Use browser automation (Chrome MCP or playwright-cli) if the user prefers assistance navigating the admin.

### Step 4: Store the Access Token

Store the token securely. Never commit it to git.

**For project use** — create `.dev.vars`:

```
SHOPIFY_STORE=mystore.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
```

Ensure `.dev.vars` is in `.gitignore`.

**For cross-project use** — store in your preferred secrets manager (environment variable, 1Password CLI, etc.).

### Step 5: Verify API Access

Test the connection with a simple GraphQL query:

```bash
curl -s https://{store}.myshopify.com/admin/api/2025-01/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: {token}" \
  -d '{"query": "{ shop { name primaryDomain { url } } }"}' | jq .
```

Expected response includes the shop name and domain. If you get a 401, the token is invalid or expired — recreate the app.

### Step 6: Save Store Config

Create a `shopify.config.json` in the project root for other skills to reference:

```json
{
  "store": "mystore.myshopify.com",
  "apiVersion": "2025-01",
  "tokenSource": ".dev.vars"
}
```

---

## Critical Patterns

### API Version

Always specify an explicit API version (e.g. `2025-01`). Using `unstable` in production will break without warning. Shopify retires API versions quarterly.

### Token Types

| Token | Format | Use |
|-------|--------|-----|
| Admin API access token | `shpat_*` | Custom apps — stable, long-lived |
| CLI session token | Short-lived | Shopify CLI commands only |
| Storefront API token | `shpca_*` | Public storefront queries |

This skill sets up **Admin API access tokens** — the right choice for product and content management.

### Rate Limits

Shopify uses a leaky bucket rate limiter:
- **REST**: 40 requests/second burst, 2/second sustained
- **GraphQL**: 1,000 cost points per second, max 2,000 points per query

For bulk operations, use the `bulkOperationRunQuery` mutation instead of looping.

---

## Reference Files

- `references/api-scopes.md` — Admin API scopes needed for product and content management
