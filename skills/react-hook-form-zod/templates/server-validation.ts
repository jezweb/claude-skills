/**
 * Server-Side Validation Example
 *
 * Demonstrates:
 * - Using the SAME Zod schema on server
 * - Single source of truth for validation
 * - Error mapping from server to client
 * - Type-safe validation on both sides
 */

import { z } from 'zod'

/**
 * SHARED SCHEMA - Use this exact schema on both client and server
 * Define it in a shared file (e.g., schemas/user.ts) and import on both sides
 */
export const userRegistrationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  age: z.number()
    .int('Age must be a whole number')
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Invalid age'),
}).refine((data) => {
  // Custom validation: check if username is blacklisted
  const blacklistedUsernames = ['admin', 'root', 'system']
  return !blacklistedUsernames.includes(data.username.toLowerCase())
}, {
  message: 'This username is not allowed',
  path: ['username'],
})

type UserRegistrationData = z.infer<typeof userRegistrationSchema>

/**
 * SERVER-SIDE VALIDATION (Next.js API Route Example)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Parse and validate with Zod
    const validatedData = userRegistrationSchema.parse(body)

    // 2. Additional server-only validation (database checks, etc.)
    const usernameExists = await checkUsernameExists(validatedData.username)
    if (usernameExists) {
      return Response.json(
        {
          success: false,
          errors: {
            username: 'Username is already taken',
          },
        },
        { status: 400 }
      )
    }

    const emailExists = await checkEmailExists(validatedData.email)
    if (emailExists) {
      return Response.json(
        {
          success: false,
          errors: {
            email: 'Email is already registered',
          },
        },
        { status: 400 }
      )
    }

    // 3. Proceed with registration
    const user = await createUser(validatedData)

    return Response.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    })

  } catch (error) {
    // 4. Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          errors: error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // 5. Handle other errors
    console.error('Registration error:', error)
    return Response.json(
      {
        success: false,
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * SERVER-SIDE VALIDATION (Node.js/Express Example)
 */
import express from 'express'

const app = express()

app.post('/api/register', async (req, res) => {
  try {
    // Parse and validate
    const validatedData = userRegistrationSchema.parse(req.body)

    // Server-only checks
    const usernameExists = await checkUsernameExists(validatedData.username)
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        errors: {
          username: 'Username is already taken',
        },
      })
    }

    // Create user
    const user = await createUser(validatedData)

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.flatten().fieldErrors,
      })
    }

    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
    })
  }
})

/**
 * SERVER-SIDE VALIDATION (Cloudflare Workers + Hono Example)
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

app.post('/api/register', zValidator('json', userRegistrationSchema), async (c) => {
  // Data is already validated by zValidator middleware
  const validatedData = c.req.valid('json')

  // Server-only checks
  const usernameExists = await checkUsernameExists(validatedData.username)
  if (usernameExists) {
    return c.json(
      {
        success: false,
        errors: {
          username: 'Username is already taken',
        },
      },
      400
    )
  }

  // Create user
  const user = await createUser(validatedData)

  return c.json({
    success: true,
    user,
  })
})

/**
 * CLIENT-SIDE INTEGRATION WITH SERVER ERRORS
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserRegistrationData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      age: 18,
    },
  })

  const onSubmit = async (data: UserRegistrationData) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        // Map server errors to form fields
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            setError(field as keyof UserRegistrationData, {
              type: 'server',
              message: Array.isArray(message) ? message[0] : message as string,
            })
          })
        } else {
          // Generic error
          setError('root', {
            type: 'server',
            message: result.message || 'Registration failed',
          })
        }
        return
      }

      // Success - redirect or show success message
      console.log('Registration successful:', result.user)
    } catch (error) {
      setError('root', {
        type: 'server',
        message: 'Network error. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root && (
        <div role="alert" className="error-banner">
          {errors.root.message}
        </div>
      )}

      {/* Form fields */}
      <input {...register('username')} />
      {errors.username && <span>{errors.username.message}</span>}

      <input type="email" {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
}

/**
 * Helper functions (implement according to your database)
 */
async function checkUsernameExists(username: string): Promise<boolean> {
  // Database query
  return false
}

async function checkEmailExists(email: string): Promise<boolean> {
  // Database query
  return false
}

async function createUser(data: UserRegistrationData) {
  // Create user in database
  return { id: '1', ...data }
}

/**
 * KEY BENEFITS OF SERVER-SIDE VALIDATION:
 *
 * 1. Security - Client validation can be bypassed, server validation cannot
 * 2. Single Source of Truth - Same schema on client and server
 * 3. Type Safety - TypeScript types automatically inferred from schema
 * 4. Consistency - Same validation rules applied everywhere
 * 5. Database Checks - Server can validate against database (unique username, etc.)
 */
