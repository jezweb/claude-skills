# React Integration Guide

**Best practices for integrating Turnstile with React, Next.js, and modern React patterns**

**Recommended Package**: @marsidev/react-turnstile (Cloudflare-verified)

---

## Package Installation

```bash
npm install @marsidev/react-turnstile
# or
pnpm add @marsidev/react-turnstile
# or
yarn add @marsidev/react-turnstile
```

**Current Version**: 1.3.1 (September 2025)
**React Compatibility**: React 18+, Next.js 13+, 14+, 15+

---

## Basic Usage

```tsx
import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'

export function ContactForm() {
  const [token, setToken] = useState<string>()

  return (
    <form>
      <input name="email" type="email" required />
      <textarea name="message" required />

      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
      />

      <button disabled={!token}>Submit</button>
    </form>
  )
}
```

---

## Props Reference

### Required Props

#### `siteKey`
**Type**: `string`
**Description**: Your Turnstile sitekey

```tsx
<Turnstile siteKey="YOUR_SITE_KEY" />
```

### Optional Props

#### `onSuccess`
**Type**: `(token: string) => void`
**Description**: Called when challenge succeeds

```tsx
<Turnstile onSuccess={(token) => console.log(token)} />
```

#### `onError`
**Type**: `(error: string) => void`
**Description**: Called when challenge fails

```tsx
<Turnstile onError={(error) => console.error(error)} />
```

#### `onExpire`
**Type**: `() => void`
**Description**: Called when token expires (5 min)

```tsx
<Turnstile onExpire={() => setToken(undefined)} />
```

#### `onAbort`
**Type**: `() => void`
**Description**: Called when challenge is aborted

#### `options`
**Type**: `TurnstileOptions`
**Description**: Widget configuration

```tsx
<Turnstile
  siteKey="..."
  options={{
    theme: 'dark',
    size: 'compact',
    action: 'login',
  }}
/>
```

---

## Using Refs

Access widget instance for manual control:

```tsx
import { useRef } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

export function AdvancedForm() {
  const turnstileRef = useRef<TurnstileInstance>(null)

  function handleReset() {
    turnstileRef.current?.reset()
  }

  function handleRemove() {
    turnstileRef.current?.remove()
  }

  return (
    <>
      <Turnstile ref={turnstileRef} siteKey="..." />
      <button onClick={handleReset}>Reset</button>
      <button onClick={handleRemove}>Remove</button>
    </>
  )
}
```

---

## Next.js App Router

### Client Component

```tsx
// app/contact/page.tsx
'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'

export default function ContactPage() {
  const [token, setToken] = useState<string>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        message: formData.get('message'),
        'cf-turnstile-response': token,
      }),
    })

    if (response.ok) {
      alert('Success!')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <textarea name="message" required />

      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
        onExpire={() => setToken(undefined)}
      />

      <button disabled={!token}>Submit</button>
    </form>
  )
}
```

### Server Action (Next.js 14+)

```tsx
'use server'

import { validateTurnstile } from '@/lib/turnstile'

export async function submitContact(formData: FormData) {
  const token = formData.get('cf-turnstile-response')?.toString()

  if (!token) {
    return { error: 'Missing verification' }
  }

  const result = await validateTurnstile(token, process.env.TURNSTILE_SECRET_KEY!)

  if (!result.success) {
    return { error: 'Verification failed' }
  }

  // Process form
  return { success: true }
}
```

---

## Next.js Pages Router

### Page Component

```tsx
// pages/contact.tsx
import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'

export default function ContactPage() {
  const [token, setToken] = useState<string>()

  return (
    <form>
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
      />
    </form>
  )
}
```

### API Route

```typescript
// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { validateTurnstile } from '@/lib/turnstile'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.body['cf-turnstile-response']

  if (!token) {
    return res.status(400).json({ error: 'Missing token' })
  }

  const result = await validateTurnstile(
    token,
    process.env.TURNSTILE_SECRET_KEY!,
    {
      remoteip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
    }
  )

  if (!result.success) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Process form
  res.status(200).json({ success: true })
}
```

---

## Custom Hook Pattern

```tsx
// hooks/useTurnstile.ts
import { useRef, useState } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

export function useTurnstile(siteKey: string) {
  const [token, setToken] = useState<string>()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string>()
  const turnstileRef = useRef<TurnstileInstance>(null)

  const reset = () => {
    turnstileRef.current?.reset()
    setToken(undefined)
    setIsReady(false)
    setError(undefined)
  }

  const TurnstileWidget = () => (
    <Turnstile
      ref={turnstileRef}
      siteKey={siteKey}
      onSuccess={(token) => {
        setToken(token)
        setIsReady(true)
        setError(undefined)
      }}
      onError={(err) => {
        setError(err)
        setIsReady(false)
      }}
      onExpire={() => {
        setToken(undefined)
        setIsReady(false)
      }}
    />
  )

  return {
    token,
    isReady,
    error,
    reset,
    TurnstileWidget,
  }
}

// Usage
export function MyForm() {
  const { token, isReady, error, reset, TurnstileWidget } = useTurnstile(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
  )

  return (
    <form>
      <TurnstileWidget />
      {error && <div>Error: {error}</div>}
      <button disabled={!isReady}>Submit</button>
    </form>
  )
}
```

---

## Jest Testing

### Mock Setup

```typescript
// jest.setup.ts
import React from 'react'

jest.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
    React.useEffect(() => {
      onSuccess('XXXX.DUMMY.TOKEN.XXXX')
    }, [onSuccess])

    return <div data-testid="turnstile-mock" />
  },
}))
```

### Component Test

```tsx
// ContactForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ContactForm } from './ContactForm'

test('submits form with Turnstile', async () => {
  render(<ContactForm />)

  const submitButton = screen.getByRole('button', { name: 'Submit' })

  // Turnstile auto-solves (mocked)
  await waitFor(() => {
    expect(submitButton).not.toBeDisabled()
  })

  fireEvent.click(submitButton)

  expect(await screen.findByText('Success')).toBeInTheDocument()
})
```

---

## Environment-Aware Sitekey

```tsx
// lib/turnstile.ts
export function useTurnstileSiteKey() {
  // Test/Development: Use dummy key
  if (process.env.NODE_ENV !== 'production') {
    return '1x00000000000000000000AA'
  }

  // Production: Use real key
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
}

// Usage
import { useTurnstileSiteKey } from '@/lib/turnstile'

export function MyForm() {
  const siteKey = useTurnstileSiteKey()

  return <Turnstile siteKey={siteKey} />
}
```

---

## Known Issues & Workarounds

### Issue #112: Next.js + Jest Compatibility (Oct 2025)

**Problem**: @marsidev/react-turnstile breaks Jest tests

**Source**: https://github.com/marsidev/react-turnstile/issues/112

**Workaround**: Mock the component (see Jest Testing section above)

### Issue #113: Blocked Script Execution (Oct 2025)

**Problem**: Script execution blocked in some environments

**Source**: https://github.com/marsidev/react-turnstile/issues/113

**Workaround**:
1. Check CSP headers allow `challenges.cloudflare.com`
2. Ensure `api.js` loads from CDN (not proxied)

---

## TypeScript Types

```typescript
import type {
  TurnstileInstance,
  TurnstileProps,
  TurnstileOptions,
} from '@marsidev/react-turnstile'

// Widget instance methods
interface TurnstileInstance {
  reset(): void
  remove(): void
  execute(): void
  getResponse(): string | undefined
  isExpired(): boolean
}

// Component props
interface TurnstileProps {
  siteKey: string
  onSuccess?: (token: string) => void
  onError?: (error: string) => void
  onExpire?: () => void
  onAbort?: () => void
  options?: TurnstileOptions
  scriptOptions?: {
    nonce?: string
    defer?: boolean
    async?: boolean
  }
}

// Widget options
interface TurnstileOptions {
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  action?: string
  cdata?: string
  execution?: 'render' | 'execute'
  appearance?: 'always' | 'execute' | 'interaction-only'
  retry?: 'auto' | 'never'
  'retry-interval'?: number
}
```

---

## Performance Optimization

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const Turnstile = lazy(() =>
  import('@marsidev/react-turnstile').then(mod => ({ default: mod.Turnstile }))
)

export function LazyTurnstileForm() {
  return (
    <form>
      <Suspense fallback={<div>Loading verification...</div>}>
        <Turnstile siteKey="..." />
      </Suspense>
    </form>
  )
}
```

### Conditional Rendering

Only render Turnstile when needed:

```tsx
export function ConditionalForm() {
  const [showTurnstile, setShowTurnstile] = useState(false)

  return (
    <form>
      <input onChange={() => setShowTurnstile(true)} />

      {showTurnstile && <Turnstile siteKey="..." />}
    </form>
  )
}
```

---

## Best Practices

✅ **Use environment variables** for sitekeys
✅ **Mock in tests** using Jest setup file
✅ **Handle expiration** with `onExpire` callback
✅ **Disable submit until ready** based on token state
✅ **Reset after submission** for multi-use forms
✅ **Use TypeScript** for type safety
✅ **Lazy load** if not immediately needed

❌ **Don't hardcode sitekeys** in components
❌ **Don't skip error handling** (`onError`)
❌ **Don't forget server validation** (critical!)
❌ **Don't use production keys in tests**

---

**Last Updated**: 2025-10-22
**Package Version**: @marsidev/react-turnstile@1.3.1
**Cloudflare Status**: ✅ Officially Recommended
