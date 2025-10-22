# Turnstile Testing Guide

**Complete testing strategies for E2E, unit, and integration tests**

**Official Docs**: https://developers.cloudflare.com/turnstile/troubleshooting/testing/

---

## Quick Reference: Dummy Credentials

### Sitekeys (Client-Side)
```typescript
const TEST_SITEKEYS = {
  ALWAYS_PASS: '1x00000000000000000000AA',           // Visible, always passes
  ALWAYS_BLOCK: '2x00000000000000000000AB',          // Visible, always blocks
  ALWAYS_PASS_INVISIBLE: '1x00000000000000000000BB', // Invisible, always passes
  ALWAYS_BLOCK_INVISIBLE: '2x00000000000000000000BB',// Invisible, always blocks
  FORCE_INTERACTIVE: '3x00000000000000000000FF',     // Visible, forces checkbox
}
```

### Secret Keys (Server-Side)
```typescript
const TEST_SECRET_KEYS = {
  ALWAYS_PASS: '1x0000000000000000000000000000000AA',  // success: true
  ALWAYS_FAIL: '2x0000000000000000000000000000000AA',  // success: false
  TOKEN_SPENT: '3x0000000000000000000000000000000AA',  // "already spent" error
}
```

### Dummy Token
```typescript
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'
```

**CRITICAL**:
- Dummy sitekeys generate `XXXX.DUMMY.TOKEN.XXXX`
- Dummy secret keys ONLY accept dummy token
- Production secret keys REJECT dummy token
- Real tokens FAIL with dummy secret keys

---

## Environment Detection Patterns

### Pattern 1: Request Headers
```typescript
function isTestEnvironment(request: Request): boolean {
  return request.headers.get('x-test-environment') === 'true'
}

// Usage in Cloudflare Worker
if (isTestEnvironment(request)) {
  secretKey = TEST_SECRET_KEYS.ALWAYS_PASS
}
```

### Pattern 2: IP Address
```typescript
function isTestEnvironment(request: Request): boolean {
  const ip = request.headers.get('CF-Connecting-IP') || ''
  const testIPs = ['127.0.0.1', '::1', 'localhost']
  return testIPs.includes(ip)
}
```

### Pattern 3: Query Parameter
```typescript
function isTestEnvironment(request: Request): boolean {
  const url = new URL(request.url)
  return url.searchParams.get('test') === 'true'
}
```

### Pattern 4: Environment Variable
```typescript
const sitekey = process.env.NODE_ENV === 'test'
  ? TEST_SITEKEYS.ALWAYS_PASS
  : process.env.TURNSTILE_SITE_KEY
```

---

## Playwright Testing

### Setup
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173',
    extraHTTPHeaders: {
      'x-test-environment': 'true', // Auto-use test credentials
    },
  },
})
```

### Basic Test
```typescript
// tests/contact-form.spec.ts
import { test, expect } from '@playwright/test'

test('submits contact form with Turnstile', async ({ page }) => {
  await page.goto('/contact')

  // Fill form
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('textarea[name="message"]', 'Test message')

  // Turnstile auto-solves with dummy token in test mode
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page.locator('.success-message')).toBeVisible()
})
```

### Advanced: Multiple Scenarios
```typescript
test('handles Turnstile failure gracefully', async ({ page, context }) => {
  // Override to use "always fail" sitekey
  await context.route('**/api.js', route => {
    const FAIL_SITEKEY = '2x00000000000000000000AB'
    // Inject failing sitekey
    route.continue()
  })

  await page.goto('/contact')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.click('button[type="submit"]')

  await expect(page.locator('.error-message')).toContainText('verification failed')
})
```

---

## Cypress Testing

### Setup
```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Set test header on all requests
      on('before:browser:launch', (browser, launchOptions) => {
        launchOptions.args.push('--disable-web-security')
        return launchOptions
      })
    },
  },
})
```

### Test Example
```typescript
// cypress/e2e/turnstile.cy.ts
describe('Turnstile Form', () => {
  beforeEach(() => {
    cy.intercept('**/*', (req) => {
      req.headers['x-test-environment'] = 'true'
    })
  })

  it('submits form successfully', () => {
    cy.visit('/contact')

    cy.get('input[name="email"]').type('test@example.com')
    cy.get('textarea[name="message"]').type('Test message')

    // Turnstile auto-solves in test mode
    cy.get('button[type="submit"]').click()

    cy.contains('Success').should('be.visible')
  })
})
```

---

## Jest / Vitest (React)

### Mock @marsidev/react-turnstile
```typescript
// jest.setup.ts or vitest.setup.ts
import React from 'react'

jest.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
    // Auto-solve with dummy token
    React.useEffect(() => {
      onSuccess('XXXX.DUMMY.TOKEN.XXXX')
    }, [onSuccess])

    return <div data-testid="turnstile-mock" />
  },
}))
```

### Component Test
```typescript
// ContactForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContactForm } from './ContactForm'

test('submits form with Turnstile', async () => {
  render(<ContactForm />)

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' },
  })

  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: 'Test message' },
  })

  // Turnstile auto-solves (mocked)
  const submitButton = screen.getByRole('button', { name: 'Submit' })
  expect(submitButton).not.toBeDisabled()

  fireEvent.click(submitButton)

  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

---

## Server-Side Testing (Vitest)

### Validate Dummy Token
```typescript
// server.test.ts
import { describe, it, expect } from 'vitest'
import { validateTurnstile } from './turnstile-server-validation'
import { TEST_SECRET_KEYS, DUMMY_TOKEN } from './turnstile-test-config'

describe('Turnstile Validation', () => {
  it('validates dummy token with test secret', async () => {
    const result = await validateTurnstile(
      DUMMY_TOKEN,
      TEST_SECRET_KEYS.ALWAYS_PASS
    )

    expect(result.success).toBe(true)
  })

  it('rejects real token with test secret', async () => {
    const realToken = 'real-production-token'

    const result = await validateTurnstile(
      realToken,
      TEST_SECRET_KEYS.ALWAYS_PASS
    )

    expect(result.success).toBe(false)
  })

  it('handles always-fail secret key', async () => {
    const result = await validateTurnstile(
      DUMMY_TOKEN,
      TEST_SECRET_KEYS.ALWAYS_FAIL
    )

    expect(result.success).toBe(false)
  })
})
```

---

## Cloudflare Workers Testing (Miniflare)

### Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
        TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      },
    },
  },
})
```

### Worker Test
```typescript
// worker.test.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'
import worker from '../src/index'
import { DUMMY_TOKEN } from './turnstile-test-config'

describe('Worker with Turnstile', () => {
  it('validates test token successfully', async () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('cf-turnstile-response', DUMMY_TOKEN)

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: formData,
      headers: {
        'x-test-environment': 'true',
      },
    })

    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(200)
  })
})
```

---

## CI/CD Configuration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        env:
          TURNSTILE_SITE_KEY: 1x00000000000000000000AA
          TURNSTILE_SECRET_KEY: 1x0000000000000000000000000000000AA
          NODE_ENV: test
        run: npm test
```

### GitLab CI
```yaml
# .gitlab-ci.yml
test:
  image: node:20
  script:
    - npm ci
    - npm test
  variables:
    TURNSTILE_SITE_KEY: "1x00000000000000000000AA"
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA"
    NODE_ENV: "test"
```

---

## Testing Best Practices

✅ **Always use dummy keys** - Never use production credentials in tests
✅ **Test both success and failure** - Use both pass and fail test keys
✅ **Mock in unit tests** - Mock Turnstile component for fast unit tests
✅ **E2E with real widget** - Use test sitekeys in E2E tests
✅ **Separate environments** - Different config for test/dev/staging/prod
✅ **Test expiration** - Verify token expiration handling
✅ **Test error states** - Validate error callback behavior

❌ **Never commit production keys** - Use environment variables
❌ **Don't skip server validation tests** - Critical security component
❌ **Don't test with production sitekeys** - Can trigger rate limits
❌ **Don't hardcode test keys** - Use constants/config files

---

## Debugging Tests

### Enable Verbose Logging
```typescript
turnstile.render('#container', {
  sitekey: TEST_SITEKEYS.ALWAYS_PASS,
  callback: (token) => console.log('[TEST] Token:', token),
  'error-callback': (error) => console.error('[TEST] Error:', error),
  'expired-callback': () => console.warn('[TEST] Token expired'),
})
```

### Check Network Requests
```typescript
// Playwright
await page.route('**/siteverify', route => {
  console.log('Siteverify called with:', route.request().postData())
  route.continue()
})
```

### Verify Environment Detection
```typescript
test('uses test credentials in test env', async ({ page }) => {
  const response = await page.evaluate(() => {
    return document.querySelector('.cf-turnstile')?.getAttribute('data-sitekey')
  })

  expect(response).toBe('1x00000000000000000000AA')
})
```

---

**Last Updated**: 2025-10-22
**Test Framework Support**: Playwright, Cypress, Jest, Vitest, Miniflare
