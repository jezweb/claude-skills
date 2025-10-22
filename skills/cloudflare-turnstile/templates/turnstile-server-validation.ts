/**
 * Turnstile Server-Side Validation
 *
 * CRITICAL: Server-side validation is MANDATORY.
 * Client-side widget alone does NOT provide security.
 *
 * Tokens:
 * - Expire after 5 minutes (300 seconds)
 * - Are single-use only
 * - Can be forged by attackers (must validate on server)
 */

/**
 * Siteverify API Response
 */
export interface TurnstileResponse {
  success: boolean
  challenge_ts?: string // ISO 8601 timestamp
  hostname?: string     // Hostname where challenge was solved
  'error-codes'?: string[]
  action?: string       // Custom action if specified
  cdata?: string        // Custom data if specified
}

/**
 * Validation Options
 */
export interface ValidationOptions {
  remoteip?: string
  idempotency_key?: string
  expectedAction?: string
  expectedHostname?: string
  timeout?: number // milliseconds (default: 5000)
}

/**
 * Validate Turnstile Token
 *
 * @param token - The token from cf-turnstile-response
 * @param secretKey - Your Turnstile secret key (from environment variable)
 * @param options - Optional validation parameters
 * @returns Promise<TurnstileResponse>
 */
export async function validateTurnstile(
  token: string,
  secretKey: string,
  options?: ValidationOptions
): Promise<TurnstileResponse> {
  if (!token) {
    return {
      success: false,
      'error-codes': ['missing-input-response'],
    }
  }

  if (!secretKey) {
    return {
      success: false,
      'error-codes': ['missing-input-secret'],
    }
  }

  // Prepare request body
  const formData = new FormData()
  formData.append('secret', secretKey)
  formData.append('response', token)

  if (options?.remoteip) {
    formData.append('remoteip', options.remoteip)
  }

  if (options?.idempotency_key) {
    formData.append('idempotency_key', options.idempotency_key)
  }

  // Set timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 5000)

  try {
    // Call Siteverify API
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }
    )

    const result = await response.json<TurnstileResponse>()

    // Additional validation checks
    if (result.success) {
      // Validate action if specified
      if (options?.expectedAction && result.action !== options.expectedAction) {
        return {
          success: false,
          'error-codes': ['action-mismatch'],
        }
      }

      // Validate hostname if specified
      if (options?.expectedHostname && result.hostname !== options.expectedHostname) {
        return {
          success: false,
          'error-codes': ['hostname-mismatch'],
        }
      }
    }

    return result
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        'error-codes': ['timeout'],
      }
    }

    console.error('Turnstile validation error:', error)
    return {
      success: false,
      'error-codes': ['internal-error'],
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Cloudflare Workers Example
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const formData = await request.formData()
      const token = formData.get('cf-turnstile-response')

      if (!token) {
        return new Response('Missing Turnstile token', { status: 400 })
      }

      // Validate token
      const result = await validateTurnstile(
        token.toString(),
        env.TURNSTILE_SECRET_KEY,
        {
          remoteip: request.headers.get('CF-Connecting-IP') || undefined,
          expectedHostname: new URL(request.url).hostname,
        }
      )

      if (!result.success) {
        console.error('Turnstile validation failed:', result['error-codes'])
        return new Response('Invalid Turnstile token', {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      // Token is valid - process the form
      const email = formData.get('email')
      const message = formData.get('message')

      // Your business logic here
      console.log('Form submitted:', { email, message })

      return new Response('Success!', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    } catch (error) {
      console.error('Request handling error:', error)
      return new Response('Internal server error', { status: 500 })
    }
  },
}

/**
 * Advanced Example: Validation with Retry Logic
 */
export async function validateWithRetry(
  token: string,
  secretKey: string,
  options?: ValidationOptions,
  maxRetries: number = 3
): Promise<TurnstileResponse> {
  let lastError: TurnstileResponse | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await validateTurnstile(token, secretKey, options)

    if (result.success) {
      return result
    }

    // Don't retry on permanent errors
    const permanentErrors = [
      'missing-input-secret',
      'invalid-input-secret',
      'missing-input-response',
      'invalid-input-response',
      'action-mismatch',
      'hostname-mismatch',
    ]

    if (
      result['error-codes']?.some((code) => permanentErrors.includes(code))
    ) {
      return result
    }

    // Retry on transient errors
    lastError = result
    if (attempt < maxRetries - 1) {
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
    }
  }

  return lastError || { success: false, 'error-codes': ['max-retries-exceeded'] }
}

/**
 * Type Definitions for Cloudflare Workers
 */
export interface Env {
  TURNSTILE_SECRET_KEY: string
  TURNSTILE_SITE_KEY: string
  // Add other environment variables here
}
