# Third-Party Integrations: [Project Name]

**Primary Integrations**: [List main services - e.g., Clerk, Stripe, OpenAI]
**Webhooks**: [Number of webhook handlers]
**Last Updated**: [Date]

---

## Overview

This document describes all third-party service integrations including API setup, authentication, webhooks, and error handling.

**Integration Principles**:
- **Environment-based config** - API keys in env vars, never committed
- **Graceful degradation** - App works (reduced functionality) if service is down
- **Webhook verification** - Always verify webhook signatures
- **Rate limit awareness** - Respect provider rate limits
- **Error handling** - Catch and log integration failures

---

## Integrations

### Clerk (Authentication)

**Purpose**: User authentication and management
**Docs**: https://clerk.com/docs
**Dashboard**: https://dashboard.clerk.com

**Setup**:
```bash
npm install @clerk/clerk-react @clerk/backend
```

**Environment Variables**:
```env
# Frontend
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend (Wrangler secret)
CLERK_SECRET_KEY=sk_test_...
```

**Frontend Integration**:
```tsx
// src/main.tsx
import { ClerkProvider } from '@clerk/clerk-react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
)
```

**Backend Integration** (JWT verification):
```typescript
// src/middleware/auth.ts
import { verifyToken } from '@clerk/backend'

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const verified = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY
    })
    c.set('userId', verified.sub)
    c.set('email', verified.email)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
```

**Custom JWT Template** (configured in Clerk dashboard):
```json
{
  "email": "{{user.primary_email_address}}",
  "userId": "{{user.id}}",
  "firstName": "{{user.first_name}}",
  "lastName": "{{user.last_name}}"
}
```

**Webhooks**: See webhook section below

**Rate Limits**: 100 requests/second (Pro plan)

**Error Handling**:
- Token expired → Return 401, frontend refreshes token
- Service down → Return 503, show maintenance message

---

### [Integration Name - e.g., Stripe]

**Purpose**: [What this service provides - e.g., Payment processing]
**Docs**: [Documentation URL]
**Dashboard**: [Dashboard URL]

**Setup**:
```bash
npm install [package-name]
```

**Environment Variables**:
```env
[SERVICE]_API_KEY=...
[SERVICE]_WEBHOOK_SECRET=...
```

**API Client**:
```typescript
// src/lib/[service]-client.ts
import [ServiceSDK] from '[package-name]'

export function create[Service]Client(apiKey: string) {
  return new [ServiceSDK]({
    apiKey,
    // other config
  })
}
```

**Usage Example**:
```typescript
// In route handler
const client = create[Service]Client(c.env.[SERVICE]_API_KEY)
const result = await client.[method]({ params })
```

**Webhooks**: [Yes/No - see webhook section if yes]

**Rate Limits**: [Limits for this service]

**Error Handling**: [How to handle failures]

---

### OpenAI (AI Features) - Example

**Purpose**: AI-powered features (chat, completions, embeddings)
**Docs**: https://platform.openai.com/docs
**Dashboard**: https://platform.openai.com

**Setup**:
```bash
npm install openai
```

**Environment Variables**:
```env
OPENAI_API_KEY=sk-...
```

**API Client**:
```typescript
// src/lib/openai-client.ts
import OpenAI from 'openai'

export function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey })
}
```

**Usage**:
```typescript
const openai = createOpenAIClient(c.env.OPENAI_API_KEY)

const response = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
})

// Stream response to client
return new Response(response.body, {
  headers: { 'Content-Type': 'text/event-stream' }
})
```

**Rate Limits**:
- Free tier: 3 requests/minute
- Paid: 10,000 requests/minute

**Error Handling**:
```typescript
try {
  const response = await openai.chat.completions.create({ ... })
  return response
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429)
  } else {
    console.error('OpenAI error:', error)
    return c.json({ error: 'AI service unavailable' }, 503)
  }
}
```

---

## Webhooks

Webhooks are HTTP callbacks from third-party services to notify our app of events.

### Webhook: Clerk User Events

**Purpose**: Sync user data when Clerk users are created, updated, or deleted

**Endpoint**: `POST /api/webhooks/clerk`

**Events**:
- `user.created` - New user signed up
- `user.updated` - User profile changed
- `user.deleted` - User account deleted

**Payload Example**:
```json
{
  "type": "user.created",
  "data": {
    "id": "user_abc123",
    "email_addresses": [
      { "email_address": "user@example.com" }
    ],
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Signature Verification**:
```typescript
import { Webhook } from 'svix'

export async function verifyClerkWebhook(
  payload: string,
  headers: Headers,
  secret: string
) {
  const wh = new Webhook(secret)

  try {
    return wh.verify(payload, {
      'svix-id': headers.get('svix-id')!,
      'svix-timestamp': headers.get('svix-timestamp')!,
      'svix-signature': headers.get('svix-signature')!
    })
  } catch (error) {
    throw new Error('Invalid webhook signature')
  }
}
```

**Handler**:
```typescript
app.post('/api/webhooks/clerk', async (c) => {
  const payload = await c.req.text()
  const verified = await verifyClerkWebhook(
    payload,
    c.req.raw.headers,
    c.env.CLERK_WEBHOOK_SECRET
  )

  const event = JSON.parse(payload)

  switch (event.type) {
    case 'user.created':
      await createUserInDatabase(event.data)
      break
    case 'user.updated':
      await updateUserInDatabase(event.data)
      break
    case 'user.deleted':
      await deleteUserInDatabase(event.data.id)
      break
  }

  return c.json({ received: true })
})
```

**Configuration** (Clerk dashboard):
1. Go to Webhooks section
2. Add endpoint: `https://[your-app].workers.dev/api/webhooks/clerk`
3. Select events: user.created, user.updated, user.deleted
4. Copy signing secret to environment variables

---

### Webhook: [Service Name]

**Purpose**: [What events this webhook handles]

**Endpoint**: `POST /api/webhooks/[service]`

**Events**: [List of event types]

**Signature Verification**: [How to verify]

**Handler**: [Implementation details]

---

## Environment Variables

### Development (.dev.vars)
```env
# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# [Other services]
```

### Production (Wrangler secrets)
```bash
# Set secrets via CLI
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY

# Or via dashboard
# Cloudflare Dashboard → Workers → [Your Worker] → Settings → Variables
```

**Never commit secrets to git**. Use `.dev.vars` locally (gitignored) and Wrangler secrets in production.

---

## API Rate Limiting

### Handling Rate Limits

**Strategy**: Exponential backoff + retry

**Implementation**:
```typescript
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      if (error.code === 'rate_limit' && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        attempt++
      } else {
        throw error
      }
    }
  }

  throw new Error('Max retries exceeded')
}

// Usage
const result = await callWithRetry(() =>
  openai.chat.completions.create({ ... })
)
```

---

## Error Handling

### Integration Failure Patterns

**1. Service Temporarily Down**:
```typescript
try {
  const result = await callExternalService()
  return result
} catch (error) {
  console.error('Service error:', error)
  return c.json({
    error: 'Service temporarily unavailable. Please try again later.',
    code: 'SERVICE_UNAVAILABLE'
  }, 503)
}
```

**2. Invalid Credentials**:
```typescript
if (error.code === 'invalid_api_key') {
  console.error('Invalid API key for [service]')
  return c.json({
    error: 'Configuration error. Please contact support.',
    code: 'CONFIGURATION_ERROR'
  }, 500)
}
```

**3. Rate Limited**:
```typescript
if (error.code === 'rate_limit_exceeded') {
  return c.json({
    error: 'Too many requests. Please wait a moment and try again.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: error.retryAfter
  }, 429)
}
```

---

## Testing Integrations

### Mocking External Services

**Use MSW (Mock Service Worker)** for tests:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        { message: { content: 'Mocked response' } }
      ]
    })
  })
]
```

**Setup**:
```typescript
// tests/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

### Testing Webhooks

**Test webhook signature verification**:
```typescript
describe('POST /api/webhooks/clerk', () => {
  it('rejects invalid signature', async () => {
    const res = await app.request('/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'svix-signature': 'invalid_signature'
      },
      body: JSON.stringify({ type: 'user.created', data: {} })
    })

    expect(res.status).toBe(401)
  })

  it('processes valid webhook', async () => {
    // Generate valid signature for testing
    const payload = JSON.stringify({ type: 'user.created', data: {...} })
    const signature = generateTestSignature(payload)

    const res = await app.request('/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'svix-signature': signature,
        'svix-id': 'msg_123',
        'svix-timestamp': Date.now().toString()
      },
      body: payload
    })

    expect(res.status).toBe(200)
  })
})
```

---

## Monitoring

### Track Integration Health

**Metrics**:
- API call success rate (per service)
- API call latency (average, p95, p99)
- Rate limit hits
- Webhook delivery success rate

**Logging**:
```typescript
console.log('[Integration]', {
  service: 'openai',
  method: 'chat.completions.create',
  success: true,
  latency: responseTime,
  tokensUsed: response.usage.total_tokens
})
```

**Alerts**:
- Integration success rate < 95% → Alert
- Average latency > 5s → Alert
- Webhook failures > 10 in 1 hour → Alert

---

## Graceful Degradation

**If integration fails, app should still function** (with reduced features).

**Example**: AI chat unavailable
```typescript
try {
  const response = await openai.chat.completions.create({ ... })
  return response
} catch (error) {
  console.error('OpenAI unavailable:', error)

  // Fallback: Return canned response
  return {
    content: "I'm currently unavailable. Please try again later or contact support.",
    fallback: true
  }
}
```

**Example**: Payment processing down
```typescript
if (!stripe.isHealthy()) {
  return (
    <Alert variant="warning">
      Payment processing is temporarily unavailable. Please try again later.
    </Alert>
  )
}
```

---

## Security Best Practices

### API Keys
- ✅ Store in environment variables
- ✅ Use Wrangler secrets in production
- ✅ Rotate keys periodically
- ❌ Never commit to git
- ❌ Never log in production

### Webhook Security
- ✅ Always verify signatures
- ✅ Use HTTPS endpoints only
- ✅ Validate payload structure
- ✅ Implement replay protection (check timestamp)
- ❌ Never trust webhook data without verification

### CORS
- ✅ Restrict origins to your domain
- ✅ Allow only necessary methods
- ❌ Don't use wildcard (*) in production

---

## Future Integrations

Planned integrations:
- [ ] [Service name] - [Purpose]
- [ ] [Service name] - [Purpose]

---

## Integration Checklist

When adding a new integration:
- [ ] Install SDK/package
- [ ] Add environment variables
- [ ] Create API client wrapper
- [ ] Implement error handling
- [ ] Add rate limit handling
- [ ] Setup webhook handler (if applicable)
- [ ] Verify webhook signatures
- [ ] Write tests (mock external calls)
- [ ] Document in this file
- [ ] Add monitoring/logging
- [ ] Test in staging before production

---

## Revision History

**v1.0** ([Date]): Initial integration documentation
**v1.1** ([Date]): [Changes made]
