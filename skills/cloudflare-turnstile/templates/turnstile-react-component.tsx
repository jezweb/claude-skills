/**
 * Turnstile React Component
 *
 * Uses @marsidev/react-turnstile (Cloudflare recommended)
 * npm install @marsidev/react-turnstile
 */

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef, useState } from 'react'

/**
 * Basic Example: Contact Form with Turnstile
 */
export function ContactForm() {
  const [token, setToken] = useState<string>()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!token) {
      setError('Please complete the verification')
      return
    }

    setIsSubmitting(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    formData.append('cf-turnstile-response', token)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError(`Submission failed: ${errorText}`)
        return
      }

      // Success
      alert('Message sent successfully!')
      e.currentTarget.reset()
      setToken(undefined)
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
        />
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
        />
      </div>

      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
        onError={() => setError('Verification failed')}
        onExpire={() => setToken(undefined)}
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={!token || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}

/**
 * Advanced Example: With Ref for Manual Control
 */
export function AdvancedTurnstileForm() {
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [token, setToken] = useState<string>()

  function handleReset() {
    // Reset the Turnstile widget
    turnstileRef.current?.reset()
    setToken(undefined)
  }

  function handleRemove() {
    // Completely remove the widget
    turnstileRef.current?.remove()
    setToken(undefined)
  }

  function handleExecute() {
    // Manually trigger challenge (execution: 'execute' mode only)
    turnstileRef.current?.execute()
  }

  return (
    <div>
      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
        onError={(error) => console.error('Turnstile error:', error)}
        options={{
          theme: 'auto',
          size: 'normal',
          execution: 'render', // or 'execute' for manual trigger
          action: 'login',
          retry: 'auto',
        }}
      />

      <div>
        <button onClick={handleReset}>Reset Widget</button>
        <button onClick={handleRemove}>Remove Widget</button>
        <button onClick={handleExecute}>Execute Challenge</button>
      </div>

      {token && <div>Token: {token}</div>}
    </div>
  )
}

/**
 * Next.js App Router Example (Client Component)
 */
'use client'

export function LoginForm() {
  const [token, setToken] = useState<string>()
  const [formError, setFormError] = useState<string>()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!token) {
      setFormError('Please complete the challenge')
      return
    }

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.get('username'),
          password: formData.get('password'),
          'cf-turnstile-response': token,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setFormError(error.message)
        return
      }

      // Redirect on success
      window.location.href = '/dashboard'
    } catch (err) {
      setFormError(`Login failed: ${err.message}`)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        name="username"
        type="text"
        placeholder="Username"
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        required
      />

      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
        onError={() => setFormError('Verification failed')}
        onExpire={() => setToken(undefined)}
        options={{
          theme: 'auto',
          action: 'login',
        }}
      />

      {formError && <div className="error">{formError}</div>}

      <button type="submit" disabled={!token}>
        Login
      </button>
    </form>
  )
}

/**
 * Testing Example: Mock for Jest
 *
 * Add to jest.setup.ts:
 */
/*
jest.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
    // Auto-solve with dummy token
    React.useEffect(() => {
      onSuccess('XXXX.DUMMY.TOKEN.XXXX')
    }, [])
    return <div data-testid="turnstile-mock" />
  },
}))
*/

/**
 * Environment-Aware Sitekey
 *
 * Use dummy keys for development/testing
 */
export function useT turnstileSiteKey() {
  // Development/Test: Use dummy sitekey
  if (process.env.NODE_ENV !== 'production') {
    return '1x00000000000000000000AA' // Always passes
  }

  // Production: Use real sitekey
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
}

/**
 * Example with Environment-Aware Sitekey
 */
export function SmartTurnstileForm() {
  const siteKey = useTurnstileSiteKey()
  const [token, setToken] = useState<string>()

  return (
    <form>
      {/* Form fields here */}

      <Turnstile
        siteKey={siteKey}
        onSuccess={setToken}
        onError={(error) => console.error(error)}
      />

      <button type="submit" disabled={!token}>
        Submit
      </button>
    </form>
  )
}

/**
 * Custom Hook: useTurnstile
 */
export function useTurnstile() {
  const [token, setToken] = useState<string>()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string>()
  const turnstileRef = useRef<TurnstileInstance>(null)

  const reset = () => {
    turnstileRef.current?.reset()
    setToken(undefined)
    setError(undefined)
  }

  const TurnstileWidget = () => (
    <Turnstile
      ref={turnstileRef}
      siteKey={useTurnstileSiteKey()}
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

/**
 * Usage of useTurnstile Hook
 */
export function FormWithHook() {
  const { token, isReady, error, reset, TurnstileWidget } = useTurnstile()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Use token for submission
    console.log('Token:', token)
    // Reset after submission
    reset()
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      <TurnstileWidget />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={!isReady}>
        Submit
      </button>
    </form>
  )
}
