/**
 * Turnstile Widget - Explicit Rendering
 *
 * Use explicit rendering when you need programmatic control over:
 * - When the widget renders
 * - Widget lifecycle (reset, remove)
 * - Multiple widgets on the same page
 * - Dynamic UI / Single Page Applications
 */

declare const turnstile: {
  render: (container: string | HTMLElement, options: TurnstileOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
  execute: (widgetId: string) => void
  getResponse: (widgetId: string) => string | undefined
  isExpired: (widgetId: string) => boolean
}

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'error-callback'?: (error: string) => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
  execution?: 'render' | 'execute'
  appearance?: 'always' | 'execute' | 'interaction-only'
  retry?: 'auto' | 'never'
  'retry-interval'?: number
  action?: string
  cdata?: string
}

/**
 * TurnstileManager - Lifecycle management wrapper
 */
export class TurnstileManager {
  private widgetId: string | null = null
  private sitekey: string

  constructor(sitekey: string) {
    this.sitekey = sitekey
  }

  /**
   * Render the Turnstile widget
   */
  render(
    containerId: string,
    callbacks: {
      onSuccess: (token: string) => void
      onError: (error: string) => void
      onExpired?: () => void
    },
    options?: Partial<TurnstileOptions>
  ): string {
    // Reset if already rendered
    if (this.widgetId !== null) {
      this.reset()
    }

    this.widgetId = turnstile.render(containerId, {
      sitekey: this.sitekey,
      callback: callbacks.onSuccess,
      'error-callback': callbacks.onError,
      'expired-callback': callbacks.onExpired || (() => this.reset()),
      theme: options?.theme || 'auto',
      size: options?.size || 'normal',
      execution: options?.execution || 'render',
      appearance: options?.appearance || 'always',
      retry: options?.retry || 'auto',
      action: options?.action,
      cdata: options?.cdata,
    })

    return this.widgetId
  }

  /**
   * Reset the widget (clears current state)
   */
  reset(): void {
    if (this.widgetId !== null) {
      turnstile.reset(this.widgetId)
    }
  }

  /**
   * Remove the widget completely
   */
  remove(): void {
    if (this.widgetId !== null) {
      turnstile.remove(this.widgetId)
      this.widgetId = null
    }
  }

  /**
   * Manually trigger challenge (execution: 'execute' mode only)
   */
  execute(): void {
    if (this.widgetId !== null) {
      turnstile.execute(this.widgetId)
    }
  }

  /**
   * Get current token
   */
  getToken(): string | undefined {
    if (this.widgetId === null) return undefined
    return turnstile.getResponse(this.widgetId)
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    if (this.widgetId === null) return true
    return turnstile.isExpired(this.widgetId)
  }
}

/**
 * Usage Example
 */
export function initializeTurnstile() {
  const SITE_KEY = 'YOUR_SITE_KEY' // Replace with actual sitekey

  const manager = new TurnstileManager(SITE_KEY)

  // Render widget when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    manager.render(
      '#turnstile-container',
      {
        onSuccess: (token) => {
          console.log('Turnstile success:', token)
          // Enable submit button
          const submitBtn = document.querySelector('#submit-btn') as HTMLButtonElement
          if (submitBtn) submitBtn.disabled = false
        },
        onError: (error) => {
          console.error('Turnstile error:', error)
          // Show error message
          const errorDiv = document.querySelector('#error-message')
          if (errorDiv) {
            errorDiv.textContent = 'Verification failed. Please try again.'
          }
        },
        onExpired: () => {
          console.warn('Turnstile token expired')
          // Disable submit button
          const submitBtn = document.querySelector('#submit-btn') as HTMLButtonElement
          if (submitBtn) submitBtn.disabled = true
        },
      },
      {
        theme: 'auto',
        size: 'normal',
        action: 'login', // Optional: track action in analytics
      }
    )
  })

  // Example: Reset on form submission
  const form = document.querySelector('#myForm') as HTMLFormElement
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const token = manager.getToken()
    if (!token || manager.isExpired()) {
      alert('Please complete the verification')
      return
    }

    // Submit form with token
    const formData = new FormData(form)
    formData.append('cf-turnstile-response', token)

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert('Success!')
        form.reset()
        manager.reset() // Reset Turnstile for next submission
      } else {
        alert('Submission failed')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('Network error')
    }
  })
}

/**
 * Advanced Example: Manual Execution Mode
 */
export function manualExecutionExample() {
  const manager = new TurnstileManager('YOUR_SITE_KEY')

  // Render in manual execution mode
  manager.render(
    '#turnstile-container',
    {
      onSuccess: (token) => {
        console.log('Challenge complete:', token)
      },
      onError: (error) => {
        console.error('Challenge failed:', error)
      },
    },
    {
      execution: 'execute', // Manual trigger
      appearance: 'interaction-only', // Show only when needed
    }
  )

  // Trigger challenge when user clicks submit
  document.querySelector('#submit-btn')?.addEventListener('click', () => {
    manager.execute()
  })
}

/**
 * Advanced Example: Multiple Widgets
 */
export function multipleWidgetsExample() {
  const loginManager = new TurnstileManager('YOUR_SITE_KEY')
  const signupManager = new TurnstileManager('YOUR_SITE_KEY')

  // Login widget
  loginManager.render(
    '#login-turnstile',
    {
      onSuccess: (token) => console.log('Login token:', token),
      onError: (error) => console.error('Login error:', error),
    },
    {
      action: 'login',
    }
  )

  // Signup widget
  signupManager.render(
    '#signup-turnstile',
    {
      onSuccess: (token) => console.log('Signup token:', token),
      onError: (error) => console.error('Signup error:', error),
    },
    {
      action: 'signup',
    }
  )
}
