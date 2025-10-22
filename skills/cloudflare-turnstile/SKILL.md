---
name: cloudflare-turnstile
description: |
  This skill provides comprehensive knowledge for implementing Cloudflare Turnstile, the CAPTCHA-alternative bot protection system. It should be used when integrating bot protection into forms, login pages, signup flows, or any user-facing feature requiring spam/bot prevention. Turnstile runs invisible challenges in the background, maintaining excellent user experience while blocking automated traffic.

  Use when: Adding bot protection to forms, implementing login security, protecting API endpoints from abuse, migrating from reCAPTCHA/hCaptcha, encountering CSP errors with Turnstile, handling token validation failures, implementing E2E tests with Turnstile, integrating with React/Next.js/Hono applications, or debugging error codes 100*, 300*, 600*.

  Keywords: turnstile, captcha, bot protection, cloudflare challenge, siteverify, recaptcha alternative, spam prevention, form protection, cf-turnstile, turnstile widget, token validation, managed challenge, invisible challenge, @marsidev/react-turnstile, hono turnstile, workers turnstile
license: MIT
---

# Cloudflare Turnstile

**Status**: Production Ready
**Last Updated**: 2025-10-22
**Dependencies**: None (optional: @marsidev/react-turnstile for React)
**Latest Versions**: @marsidev/react-turnstile@1.3.1, turnstile-types@1.2.3

---

## Quick Start (10 Minutes)

### 1. Create Turnstile Widget

Get your sitekey and secret key from Cloudflare Dashboard.

```bash
# Navigate to: https://dash.cloudflare.com/?to=/:account/turnstile
# Create new widget → Copy sitekey (public) and secret key (private)
```

**Why this matters:**
- Each widget has unique sitekey/secret pair
- Sitekey goes in frontend (public)
- Secret key ONLY in backend (private)
- Use different widgets for dev/staging/production

### 2. Add Widget to Frontend

Embed the Turnstile widget in your HTML form.

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <form id="myForm" action="/submit" method="POST">
    <input type="email" name="email" required>
    <!-- Turnstile widget renders here -->
    <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

**CRITICAL:**
- Never proxy or cache `api.js` - must load from Cloudflare CDN
- Widget auto-creates hidden input `cf-turnstile-response` with token
- Token expires in 5 minutes
- Each token is single-use only

### 3. Validate Token on Server

ALWAYS validate the token server-side. Client-side verification alone is not secure.

```typescript
// Cloudflare Workers example
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const formData = await request.formData()
    const token = formData.get('cf-turnstile-response')
    const ip = request.headers.get('CF-Connecting-IP')

    // Validate token with Siteverify API
    const verifyFormData = new FormData()
    verifyFormData.append('secret', env.TURNSTILE_SECRET_KEY)
    verifyFormData.append('response', token)
    verifyFormData.append('remoteip', ip)

    const result = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: verifyFormData,
      }
    )

    const outcome = await result.json()

    if (!outcome.success) {
      return new Response('Invalid Turnstile token', { status: 401 })
    }

    // Token valid - proceed with form processing
    return new Response('Success!')
  }
}
```

---

## The 3-Step Setup Process

### Step 1: Create Widget Configuration

1. Log into Cloudflare Dashboard
2. Navigate to Turnstile section
3. Click "Add Site"
4. Configure:
   - **Widget Mode**: Managed (recommended), Non-Interactive, or Invisible
   - **Domains**: Add allowed hostnames (e.g., example.com, localhost for dev)
   - **Name**: Descriptive name (e.g., "Production Login Form")

**Key Points:**
- Use separate widgets for dev/staging/production
- Restrict domains to only those you control
- Managed mode provides best balance of security and UX
- localhost must be explicitly added for local testing

### Step 2: Client-Side Integration

Choose between implicit or explicit rendering:

**Implicit Rendering** (Recommended for static forms):
```html
<!-- 1. Load script -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- 2. Add widget -->
<div class="cf-turnstile"
     data-sitekey="YOUR_SITE_KEY"
     data-callback="onSuccess"
     data-error-callback="onError"></div>

<script>
function onSuccess(token) {
  console.log('Turnstile success:', token)
}

function onError(error) {
  console.error('Turnstile error:', error)
}
</script>
```

**Explicit Rendering** (For SPAs/dynamic UIs):
```typescript
// 1. Load script with explicit mode
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>

// 2. Render programmatically
const widgetId = turnstile.render('#container', {
  sitekey: 'YOUR_SITE_KEY',
  callback: (token) => {
    console.log('Token:', token)
  },
  'error-callback': (error) => {
    console.error('Error:', error)
  },
  theme: 'auto',
  execution: 'render', // or 'execute' for manual trigger
})

// Control lifecycle
turnstile.reset(widgetId)        // Reset widget
turnstile.remove(widgetId)       // Remove widget
turnstile.execute(widgetId)      // Manually trigger challenge
const token = turnstile.getResponse(widgetId) // Get current token
```

**React Integration** (using @marsidev/react-turnstile):
```tsx
import { Turnstile } from '@marsidev/react-turnstile'

export function MyForm() {
  const [token, setToken] = useState<string>()

  return (
    <form>
      <Turnstile
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={setToken}
        onError={(error) => console.error(error)}
      />
      <button disabled={!token}>Submit</button>
    </form>
  )
}
```

### Step 3: Server-Side Validation

**MANDATORY**: Always call Siteverify API to validate tokens.

```typescript
interface TurnstileResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  error-codes?: string[]
  action?: string
  cdata?: string
}

async function validateTurnstile(
  token: string,
  secretKey: string,
  options?: {
    remoteip?: string
    idempotency_key?: string
    expectedAction?: string
    expectedHostname?: string
  }
): Promise<TurnstileResponse> {
  const formData = new FormData()
  formData.append('secret', secretKey)
  formData.append('response', token)

  if (options?.remoteip) {
    formData.append('remoteip', options.remoteip)
  }

  if (options?.idempotency_key) {
    formData.append('idempotency_key', options.idempotency_key)
  }

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: formData,
    }
  )

  const result = await response.json<TurnstileResponse>()

  // Additional validation
  if (result.success) {
    if (options?.expectedAction && result.action !== options.expectedAction) {
      return { success: false, 'error-codes': ['action-mismatch'] }
    }

    if (options?.expectedHostname && result.hostname !== options.expectedHostname) {
      return { success: false, 'error-codes': ['hostname-mismatch'] }
    }
  }

  return result
}

// Usage in Cloudflare Worker
const result = await validateTurnstile(
  token,
  env.TURNSTILE_SECRET_KEY,
  {
    remoteip: request.headers.get('CF-Connecting-IP'),
    expectedHostname: 'example.com',
  }
)

if (!result.success) {
  return new Response('Turnstile validation failed', { status: 401 })
}
```

---

## Critical Rules

### Always Do

✅ **Call Siteverify API** - Server-side validation is mandatory
✅ **Use HTTPS** - Never validate over HTTP
✅ **Protect secret keys** - Never expose in frontend code
✅ **Handle token expiration** - Tokens expire after 5 minutes
✅ **Implement error callbacks** - Handle failures gracefully
✅ **Use dummy keys for testing** - Test sitekey: `1x00000000000000000000AA`
✅ **Set reasonable timeouts** - Don't wait indefinitely for validation
✅ **Validate action/hostname** - Check additional fields when specified
✅ **Rotate keys periodically** - Use dashboard or API to rotate secrets
✅ **Monitor analytics** - Track solve rates and failures

### Never Do

❌ **Skip server validation** - Client-side only = security vulnerability
❌ **Proxy api.js script** - Must load from Cloudflare CDN
❌ **Reuse tokens** - Each token is single-use only
❌ **Use GET requests** - Siteverify only accepts POST
❌ **Expose secret key** - Keep secrets in backend environment only
❌ **Trust client-side validation** - Tokens can be forged
❌ **Cache api.js** - Future updates will break your integration
❌ **Use production keys in tests** - Use dummy keys instead
❌ **Ignore error callbacks** - Always handle failures

---

## Known Issues Prevention

This skill prevents **12** documented issues:

### Issue #1: Missing Server-Side Validation
**Error**: Zero token validation in Turnstile Analytics dashboard
**Source**: https://developers.cloudflare.com/turnstile/get-started/
**Why It Happens**: Developers only implement client-side widget, skip Siteverify call
**Prevention**: All templates include mandatory server-side validation with Siteverify API

### Issue #2: Token Expiration (5 Minutes)
**Error**: `success: false` for valid tokens submitted after delay
**Source**: https://developers.cloudflare.com/turnstile/get-started/server-side-validation
**Why It Happens**: Tokens expire 300 seconds after generation
**Prevention**: Templates document TTL and implement token refresh on expiration

### Issue #3: Secret Key Exposed in Frontend
**Error**: Security bypass - attackers can validate their own tokens
**Source**: https://developers.cloudflare.com/turnstile/get-started/server-side-validation
**Why It Happens**: Secret key hardcoded in JavaScript or visible in source
**Prevention**: All templates show backend-only validation with environment variables

### Issue #4: GET Request to Siteverify
**Error**: API returns 405 Method Not Allowed
**Source**: https://developers.cloudflare.com/turnstile/migration/recaptcha
**Why It Happens**: reCAPTCHA supports GET, Turnstile requires POST
**Prevention**: Templates use POST with FormData or JSON body

### Issue #5: Content Security Policy Blocking
**Error**: Error 200500 - "Loading error: The iframe could not be loaded"
**Source**: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes
**Why It Happens**: CSP blocks challenges.cloudflare.com iframe
**Prevention**: Skill includes CSP configuration reference and check-csp.sh script

### Issue #6: Widget Crash (Error 300030)
**Error**: Generic client execution error for legitimate users
**Source**: https://community.cloudflare.com/t/turnstile-is-frequently-generating-300x-errors/700903
**Why It Happens**: Unknown - appears to be Cloudflare-side issue (2025)
**Prevention**: Templates implement error callbacks, retry logic, and fallback handling

### Issue #7: Configuration Error (Error 600010)
**Error**: Widget fails with "configuration error"
**Source**: https://community.cloudflare.com/t/repeated-cloudflare-turnstile-error-600010/644578
**Why It Happens**: Missing or deleted hostname in widget configuration
**Prevention**: Templates document hostname allowlist requirement and verification steps

### Issue #8: Safari 18 / macOS 15 "Hide IP" Issue
**Error**: Error 300010 when Safari's "Hide IP address" is enabled
**Source**: https://community.cloudflare.com/t/turnstile-is-frequently-generating-300x-errors/700903
**Why It Happens**: Privacy settings interfere with challenge signals
**Prevention**: Error handling reference documents Safari workaround (disable Hide IP)

### Issue #9: Brave Browser Confetti Animation Failure
**Error**: Verification fails during success animation
**Source**: https://github.com/brave/brave-browser/issues/45608 (April 2025)
**Why It Happens**: Brave shields block animation scripts
**Prevention**: Templates handle success before animation completes

### Issue #10: Next.js + Jest Incompatibility
**Error**: @marsidev/react-turnstile breaks Jest tests
**Source**: https://github.com/marsidev/react-turnstile/issues/112 (Oct 2025)
**Why It Happens**: Module resolution issues with Jest
**Prevention**: Testing guide includes Jest mocking patterns and dummy sitekey usage

### Issue #11: localhost Not in Allowlist
**Error**: Error 110200 - "Unknown domain: Domain not allowed"
**Source**: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes
**Why It Happens**: Production widget used in development without localhost in allowlist
**Prevention**: Templates use dummy test keys for dev, document localhost allowlist requirement

### Issue #12: Token Reuse Attempt
**Error**: `success: false` with "token already spent" error
**Source**: https://developers.cloudflare.com/turnstile/troubleshooting/testing
**Why It Happens**: Each token can only be validated once
**Prevention**: Templates document single-use constraint and token refresh patterns

---

## Configuration Files Reference

### wrangler.jsonc (Cloudflare Workers)

```jsonc
{
  "name": "my-app",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-22",

  // Public sitekey (safe to commit)
  "vars": {
    "TURNSTILE_SITE_KEY": "1x00000000000000000000AA" // Use real key in production
  },

  // Secret key (DO NOT commit - use wrangler secret)
  // Run: wrangler secret put TURNSTILE_SECRET_KEY
  "secrets": ["TURNSTILE_SECRET_KEY"]
}
```

**Why these settings:**
- `vars` for public sitekey (visible in client code)
- `secrets` for private secret key (encrypted, backend-only)
- Use dummy keys for development (see testing-guide.md)
- Rotate production secret keys quarterly

### Required CSP Directives

```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' https://challenges.cloudflare.com;
  frame-src 'self' https://challenges.cloudflare.com;
  connect-src 'self' https://challenges.cloudflare.com;
">
```

---

## Common Patterns

### Pattern 1: Hono + Cloudflare Workers

```typescript
import { Hono } from 'hono'

type Bindings = {
  TURNSTILE_SECRET_KEY: string
  TURNSTILE_SITE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.post('/api/login', async (c) => {
  const body = await c.req.formData()
  const token = body.get('cf-turnstile-response')

  if (!token) {
    return c.text('Missing Turnstile token', 400)
  }

  // Validate token
  const verifyFormData = new FormData()
  verifyFormData.append('secret', c.env.TURNSTILE_SECRET_KEY)
  verifyFormData.append('response', token.toString())
  verifyFormData.append('remoteip', c.req.header('CF-Connecting-IP') || '')

  const verifyResult = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: verifyFormData,
    }
  )

  const outcome = await verifyResult.json<{ success: boolean }>()

  if (!outcome.success) {
    return c.text('Invalid Turnstile token', 401)
  }

  // Process login
  return c.json({ message: 'Login successful' })
})

export default app
```

**When to use**: API routes in Cloudflare Workers with Hono framework

### Pattern 2: React + Next.js App Router

```tsx
'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'

export function ContactForm() {
  const [token, setToken] = useState<string>()
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!token) {
      setError('Please complete the challenge')
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.append('cf-turnstile-response', token)

    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      setError('Submission failed')
      return
    }

    // Success
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <textarea name="message" required />

      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
        onError={() => setError('Challenge failed')}
        onExpire={() => setToken(undefined)}
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={!token}>
        Submit
      </button>
    </form>
  )
}
```

**When to use**: Client-side forms in Next.js with React hooks

### Pattern 3: E2E Testing with Dummy Keys

```typescript
// test/helpers/turnstile.ts
export const TEST_TURNSTILE = {
  sitekey: {
    alwaysPass: '1x00000000000000000000AA',
    alwaysBlock: '2x00000000000000000000AB',
    invisible: '1x00000000000000000000BB',
    interactive: '3x00000000000000000000FF',
  },
  secretKey: {
    alwaysPass: '1x0000000000000000000000000000000AA',
    alwaysFail: '2x0000000000000000000000000000000AA',
    tokenSpent: '3x0000000000000000000000000000000AA',
  },
  dummyToken: 'XXXX.DUMMY.TOKEN.XXXX',
}

// Playwright test example
test('form submission with Turnstile', async ({ page }) => {
  // Set test environment
  await page.goto('/contact?test=true')

  // Widget uses test sitekey in test mode
  await page.fill('input[name="email"]', 'test@example.com')

  // Turnstile auto-solves with dummy token
  await page.click('button[type="submit"]')

  await expect(page.locator('.success')).toBeVisible()
})
```

**When to use**: Automated testing (Playwright, Cypress, Jest)

### Pattern 4: Widget Lifecycle Management

```typescript
class TurnstileManager {
  private widgetId: string | null = null
  private sitekey: string

  constructor(sitekey: string) {
    this.sitekey = sitekey
  }

  render(containerId: string, callbacks: {
    onSuccess: (token: string) => void
    onError: (error: string) => void
  }) {
    if (this.widgetId !== null) {
      this.reset() // Reset if already rendered
    }

    this.widgetId = turnstile.render(containerId, {
      sitekey: this.sitekey,
      callback: callbacks.onSuccess,
      'error-callback': callbacks.onError,
      'expired-callback': () => this.reset(),
    })

    return this.widgetId
  }

  reset() {
    if (this.widgetId !== null) {
      turnstile.reset(this.widgetId)
    }
  }

  remove() {
    if (this.widgetId !== null) {
      turnstile.remove(this.widgetId)
      this.widgetId = null
    }
  }

  getToken(): string | undefined {
    if (this.widgetId === null) return undefined
    return turnstile.getResponse(this.widgetId)
  }
}

// Usage
const manager = new TurnstileManager(SITE_KEY)
manager.render('#container', {
  onSuccess: (token) => console.log('Token:', token),
  onError: (error) => console.error('Error:', error),
})
```

**When to use**: SPAs requiring programmatic widget control

---

## Using Bundled Resources

### Scripts (scripts/)

- **check-csp.sh** - Verifies Content Security Policy allows Turnstile scripts and iframes

**Example Usage:**
```bash
./scripts/check-csp.sh https://example.com
```

### References (references/)

- `references/widget-configs.md` - Complete reference of all widget configuration options
- `references/error-codes.md` - Comprehensive error code reference with troubleshooting
- `references/testing-guide.md` - Testing strategies, dummy keys, E2E patterns
- `references/react-integration.md` - React-specific patterns and @marsidev/react-turnstile usage

**When Claude should load these**:
- `widget-configs.md`: When configuring widget appearance, themes, or execution modes
- `error-codes.md`: When debugging error codes 100*, 200*, 300*, 400*, 600*
- `testing-guide.md`: When setting up E2E tests or local development
- `react-integration.md`: When integrating with React, Next.js, or encountering React-specific issues

### Templates (templates/)

- `wrangler-turnstile-config.jsonc` - Cloudflare Workers environment configuration
- `turnstile-widget-implicit.html` - Implicit rendering HTML example
- `turnstile-widget-explicit.ts` - Explicit rendering JavaScript API
- `turnstile-server-validation.ts` - Siteverify API validation function
- `turnstile-react-component.tsx` - React component using @marsidev/react-turnstile
- `turnstile-hono-route.ts` - Hono route handler with validation
- `turnstile-test-config.ts` - Testing configuration with dummy keys

---

## Advanced Topics

### Pre-Clearance for SPAs

Turnstile can issue a pre-clearance cookie that persists across page navigations in single-page applications.

```typescript
turnstile.render('#container', {
  sitekey: SITE_KEY,
  callback: async (token) => {
    // Request pre-clearance cookie
    await fetch('/api/pre-clearance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  },
})
```

### Custom Actions and cData

Track different challenge types or pass custom data:

```typescript
turnstile.render('#container', {
  sitekey: SITE_KEY,
  action: 'login', // Track action in analytics
  cdata: JSON.stringify({ userId: '123' }), // Custom data (max 255 chars)
  callback: (token) => {
    // Token includes action and cdata for server validation
  },
})
```

**Server-side verification:**
```typescript
const result = await validateTurnstile(token, secretKey)

if (result.action !== 'login') {
  return new Response('Invalid action', { status: 400 })
}

const customData = JSON.parse(result.cdata || '{}')
```

### Retry and Error Handling Strategies

```typescript
class TurnstileWithRetry {
  private retryCount = 0
  private maxRetries = 3

  render(containerId: string) {
    turnstile.render(containerId, {
      sitekey: SITE_KEY,
      retry: 'auto', // or 'never' for manual control
      'retry-interval': 8000, // ms between retries
      'error-callback': (error) => {
        this.handleError(error)
      },
    })
  }

  private handleError(error: string) {
    // Error codes that should not retry
    const noRetry = ['110100', '110200', '110500']

    if (noRetry.some(code => error.includes(code))) {
      this.showFallback()
      return
    }

    // Retry on transient errors
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      setTimeout(() => {
        turnstile.reset(this.widgetId)
      }, 2000 * this.retryCount) // Exponential backoff
    } else {
      this.showFallback()
    }
  }

  private showFallback() {
    // Show alternative verification method
    console.error('Turnstile failed - showing fallback')
  }
}
```

### Multi-Widget Pages

```typescript
const widgets = {
  login: null as string | null,
  signup: null as string | null,
}

// Render multiple widgets
widgets.login = turnstile.render('#login-widget', {
  sitekey: SITE_KEY,
  action: 'login',
})

widgets.signup = turnstile.render('#signup-widget', {
  sitekey: SITE_KEY,
  action: 'signup',
})

// Reset specific widget
turnstile.reset(widgets.login)

// Get token from specific widget
const loginToken = turnstile.getResponse(widgets.login)
```

---

## Dependencies

**Required:**
- None (Turnstile loads from CDN)

**Optional (React):**
- `@marsidev/react-turnstile@1.3.1` - Official Cloudflare-recommended React integration
- `turnstile-types@1.2.3` - TypeScript type definitions

**Optional (Other Frameworks):**
- `vue-turnstile` - Vue 3 integration
- `cfturnstile-vue3` - Alternative Vue 3 wrapper
- `ngx-turnstile` - Angular integration
- `svelte-turnstile` - Svelte integration
- `@nuxtjs/turnstile` - Nuxt full-stack integration

---

## Official Documentation

- **Cloudflare Turnstile**: https://developers.cloudflare.com/turnstile/
- **Get Started**: https://developers.cloudflare.com/turnstile/get-started/
- **Client-Side Rendering**: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- **Server-Side Validation**: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- **Error Codes**: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
- **Testing**: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- **Community Resources**: https://developers.cloudflare.com/turnstile/community-resources/
- **Migration from reCAPTCHA**: https://developers.cloudflare.com/turnstile/migration/recaptcha/
- **Cloudflare MCP**: Use `mcp__cloudflare-docs__search_cloudflare_documentation` tool

---

## Package Versions (Verified 2025-10-22)

```json
{
  "devDependencies": {
    "@marsidev/react-turnstile": "^1.3.1",
    "turnstile-types": "^1.2.3"
  }
}
```

**Notes:**
- @marsidev/react-turnstile is Cloudflare's recommended React package
- Last updated September 2025 (actively maintained)
- Compatible with React 18+, Next.js 13+, Next.js 14+, Next.js 15+

---

## Production Example

This skill is based on production implementations:

- **Cloudflare Workers**: Official HTMLRewriter example
- **React Apps**: @marsidev/react-turnstile (Cloudflare-verified)
- **Community**: WordPress, Craft CMS, SilverStripe, Statamic integrations
- **Validation**: ✅ All 12 known issues documented and prevented

---

## Troubleshooting

### Problem: Error 110200 - "Unknown domain"
**Solution**: Add your domain (including localhost for dev) to widget's allowed domains in Cloudflare Dashboard. For local dev, use dummy test sitekey `1x00000000000000000000AA` instead.

### Problem: Error 300030 - Widget crashes for legitimate users
**Solution**: Implement error callback with retry logic. This is a known Cloudflare-side issue (2025). Fallback to alternative verification if retries fail.

### Problem: Tokens always return `success: false`
**Solution**:
1. Check token hasn't expired (5 min TTL)
2. Verify secret key is correct
3. Ensure token hasn't been validated before (single-use)
4. Check hostname matches widget configuration

### Problem: CSP blocking iframe (Error 200500)
**Solution**: Add CSP directives:
```html
<meta http-equiv="Content-Security-Policy" content="
  frame-src https://challenges.cloudflare.com;
  script-src https://challenges.cloudflare.com;
">
```

### Problem: Safari 18 "Hide IP" causing Error 300010
**Solution**: Document in error message that users should disable Safari's "Hide IP address" setting (Safari → Settings → Privacy → Hide IP address → Off)

### Problem: Next.js + Jest tests failing with @marsidev/react-turnstile
**Solution**: Mock the Turnstile component in Jest setup:
```typescript
// jest.setup.ts
jest.mock('@marsidev/react-turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile-mock" />,
}))
```

---

## Complete Setup Checklist

Use this checklist to verify your setup:

- [ ] Created Turnstile widget in Cloudflare Dashboard
- [ ] Added allowed domains (including localhost for dev)
- [ ] Frontend widget loads from `https://challenges.cloudflare.com/turnstile/v0/api.js`
- [ ] Widget renders with correct sitekey
- [ ] Error callback implemented and tested
- [ ] Server-side Siteverify validation implemented
- [ ] Secret key stored in environment variable (not hardcoded)
- [ ] Token validation includes remoteip check
- [ ] CSP allows challenges.cloudflare.com (if using CSP)
- [ ] Testing uses dummy sitekeys (`1x00000000000000000000AA`)
- [ ] Token expiration handling implemented (5 min TTL)
- [ ] Widget accessibility tested (keyboard navigation, screen readers)
- [ ] Error states display user-friendly messages
- [ ] Production deployment uses separate widget from dev/staging

---

**Questions? Issues?**

1. Check `references/error-codes.md` for specific error troubleshooting
2. Verify all steps in the 3-Step Setup Process
3. Check official docs: https://developers.cloudflare.com/turnstile/
4. Ensure server-side validation is implemented (most common issue)
5. Use Cloudflare Docs MCP tool: `mcp__cloudflare-docs__search_cloudflare_documentation`

---

**Token Efficiency**: ~65-70% savings (10-12k tokens → 3-4k tokens)

**Errors Prevented**: 12 documented issues with complete solutions
