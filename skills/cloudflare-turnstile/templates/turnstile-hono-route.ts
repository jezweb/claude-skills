/**
 * Turnstile + Hono Route Handlers
 *
 * Complete examples for integrating Turnstile validation
 * with Hono API routes in Cloudflare Workers
 */

import { Hono } from 'hono'
import { validateTurnstile, type TurnstileResponse } from './turnstile-server-validation'

/**
 * Environment Bindings
 */
type Bindings = {
  TURNSTILE_SECRET_KEY: string
  TURNSTILE_SITE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * Example 1: Simple Contact Form
 */
app.post('/api/contact', async (c) => {
  try {
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

    // Process contact form
    const email = body.get('email')?.toString()
    const message = body.get('message')?.toString()

    console.log('Contact form submitted:', { email, message })

    // Your business logic here (send email, save to DB, etc.)

    return c.json({ message: 'Contact form submitted successfully' })
  } catch (error) {
    console.error('Contact form error:', error)
    return c.text('Internal server error', 500)
  }
})

/**
 * Example 2: Login with Turnstile
 */
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password, 'cf-turnstile-response': token } = await c.req.json()

    // Validate Turnstile token first
    const result = await validateTurnstile(
      token,
      c.env.TURNSTILE_SECRET_KEY,
      {
        remoteip: c.req.header('CF-Connecting-IP'),
        expectedAction: 'login',
        expectedHostname: new URL(c.req.url).hostname,
      }
    )

    if (!result.success) {
      return c.json(
        {
          error: 'Invalid Turnstile token',
          codes: result['error-codes'],
        },
        401
      )
    }

    // Validate credentials (example - use proper auth in production)
    if (!username || !password) {
      return c.json({ error: 'Missing credentials' }, 400)
    }

    // Check credentials against database
    // const user = await db.query('SELECT * FROM users WHERE username = ?', [username])

    // Create session token
    // const sessionToken = await createSession(user.id)

    return c.json({
      message: 'Login successful',
      // token: sessionToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

/**
 * Example 3: Signup with Turnstile + Rate Limiting
 */
app.post('/api/auth/signup', async (c) => {
  try {
    const { email, password, 'cf-turnstile-response': token } = await c.req.json()

    // Validate Turnstile
    const result = await validateTurnstile(
      token,
      c.env.TURNSTILE_SECRET_KEY,
      {
        remoteip: c.req.header('CF-Connecting-IP'),
        expectedAction: 'signup',
      }
    )

    if (!result.success) {
      return c.json({ error: 'Bot detection failed' }, 401)
    }

    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Check if user exists
    // const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email])
    // if (existingUser) {
    //   return c.json({ error: 'User already exists' }, 409)
    // }

    // Create user
    // const hashedPassword = await hashPassword(password)
    // await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword])

    return c.json({
      message: 'Signup successful',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'Signup failed' }, 500)
  }
})

/**
 * Example 4: Middleware for Turnstile Validation
 */
async function turnstileMiddleware(c: any, next: () => Promise<void>) {
  const contentType = c.req.header('Content-Type')

  let token: string | null = null

  // Get token from FormData or JSON
  if (contentType?.includes('multipart/form-data') || contentType?.includes('application/x-www-form-urlencoded')) {
    const formData = await c.req.formData()
    token = formData.get('cf-turnstile-response')?.toString() || null
  } else if (contentType?.includes('application/json')) {
    const body = await c.req.json()
    token = body['cf-turnstile-response'] || null
  }

  if (!token) {
    return c.json({ error: 'Missing Turnstile token' }, 400)
  }

  // Validate token
  const result = await validateTurnstile(
    token,
    c.env.TURNSTILE_SECRET_KEY,
    {
      remoteip: c.req.header('CF-Connecting-IP'),
    }
  )

  if (!result.success) {
    return c.json({
      error: 'Turnstile validation failed',
      codes: result['error-codes'],
    }, 401)
  }

  // Store result in context for route handler
  c.set('turnstileResult', result)

  await next()
}

/**
 * Example 5: Using Middleware
 */
app.post('/api/protected/action', turnstileMiddleware, async (c) => {
  const turnstileResult = c.get('turnstileResult') as TurnstileResponse

  console.log('Turnstile validated:', turnstileResult)

  // Your protected action here
  return c.json({ message: 'Action completed successfully' })
})

/**
 * Example 6: Get Sitekey Endpoint (for frontend)
 */
app.get('/api/turnstile/sitekey', (c) => {
  return c.json({
    sitekey: c.env.TURNSTILE_SITE_KEY,
  })
})

/**
 * Example 7: Health Check (without Turnstile)
 */
app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

/**
 * Example 8: CORS for Turnstile
 */
import { cors } from 'hono/cors'

app.use('/api/*', cors({
  origin: ['https://yourdomain.com', 'http://localhost:5173'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}))

/**
 * Export
 */
export default app
