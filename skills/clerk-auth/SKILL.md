---
name: clerk-auth
description: |
  This skill provides comprehensive knowledge for integrating Clerk authentication in React, Next.js, and Cloudflare Workers applications. It should be used when setting up user authentication, implementing protected routes, verifying JWT tokens, configuring Clerk middleware, integrating with shadcn/ui components, or troubleshooting Clerk authentication errors.

  Use when: adding Clerk to React/Vite projects, setting up Clerk in Next.js App Router, implementing Clerk authentication in Cloudflare Workers, configuring clerkMiddleware for route protection, creating custom JWT templates, verifying tokens with @clerk/backend, integrating Clerk with Hono, using Clerk shadcn/ui components, or encountering authentication errors.

  Prevents 10 documented issues: missing secret key errors, API key migration failures, JWKS cache race conditions, CSRF vulnerabilities from missing authorizedParties, import path errors after Core 2 upgrade, JWT size limit issues, deprecated API version warnings, ClerkProvider JSX component errors, async auth() helper confusion, and environment variable misconfiguration.

  Keywords: clerk, clerk auth, clerk authentication, @clerk/nextjs, @clerk/backend, @clerk/clerk-react, clerkMiddleware, createRouteMatcher, verifyToken, useUser, useAuth, useClerk, JWT template, clerk webhook, clerk secret key, clerk publishable key, protected routes, Cloudflare Workers auth, Next.js auth, shadcn/ui auth, @hono/clerk-auth, "Missing Clerk Secret Key", "cannot be used as a JSX component", JWKS error, authorizedParties, clerk middleware, ClerkProvider, UserButton, SignIn, SignUp
license: MIT
---

# Clerk Authentication

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Dependencies**: None
**Latest Versions**: @clerk/nextjs@6.33.3, @clerk/backend@2.17.2, @clerk/clerk-react@5.51.0

---

## Quick Start (10 Minutes)

Choose your framework:
- [React (Vite)](#react-vite-setup) - ClerkProvider + hooks
- [Next.js App Router](#nextjs-app-router-setup) - Middleware + async auth()
- [Cloudflare Workers](#cloudflare-workers-setup) - Backend verification

---

## React (Vite) Setup

### 1. Install Clerk

\`\`\`bash
npm install @clerk/clerk-react
\`\`\`

**Latest Version**: @clerk/clerk-react@5.51.0 (verified 2025-10-22)

### 2. Configure ClerkProvider

Update \`src/main.tsx\`:

\`\`\`typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// Get publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
\`\`\`

**CRITICAL**:
- Use \`VITE_\` prefix for environment variables in Vite
- ClerkProvider must wrap your entire app
- Source: https://clerk.com/docs/references/react/clerk-provider

### 3. Add Environment Variables

Create \`.env.local\`:

\`\`\`bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
\`\`\`

**Security Note**: Only \`VITE_\` prefixed vars are exposed to client code.

### 4. Use Authentication Hooks

\`\`\`typescript
import { useUser, useAuth, useClerk } from '@clerk/clerk-react'

function App() {
  // Get user object (includes email, metadata, etc.)
  const { isLoaded, isSignedIn, user } = useUser()

  // Get auth state and session methods
  const { userId, sessionId, getToken } = useAuth()

  // Get Clerk instance for advanced operations
  const { openSignIn, signOut } = useClerk()

  // Always check isLoaded before rendering auth-dependent UI
  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <button onClick={() => openSignIn()}>Sign In</button>
  }

  return (
    <div>
      <h1>Welcome {user.firstName}!</h1>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
\`\`\`

**Why This Matters**:
- \`isLoaded\` prevents flash of wrong content
- \`useUser()\` provides full user object with metadata
- \`useAuth()\` provides session tokens and auth state
- Source: https://clerk.com/docs/references/react/use-user

---

## Next.js App Router Setup

### 1. Install Clerk

\`\`\`bash
npm install @clerk/nextjs
\`\`\`

**Latest Version**: @clerk/nextjs@6.33.3 (verified 2025-10-22)
- **New in v6**: Async auth() helper, Next.js 15 support, static rendering by default
- Source: https://clerk.com/changelog/2024-10-22-clerk-nextjs-v6

### 2. Configure Environment Variables

Create \`.env.local\`:

\`\`\`bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Customize sign-in/up pages
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
\`\`\`

**CRITICAL**:
- \`CLERK_SECRET_KEY\` must NEVER be exposed to client
- Use \`NEXT_PUBLIC_\` prefix for client-side vars only
- Source: https://clerk.com/docs/guides/development/clerk-environment-variables

### 3. Add Middleware for Route Protection

Create \`middleware.ts\` in project root:

\`\`\`typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes are public (everything else requires auth)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // Clerk webhooks should be public
])

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
\`\`\`

**CRITICAL**:
- \`auth.protect()\` is async in v6 (breaking change from v5)
- \`createRouteMatcher()\` accepts glob patterns
- Alternative: protect specific routes instead of inverting logic
- Source: https://clerk.com/docs/reference/nextjs/clerk-middleware

### 4. Wrap App with ClerkProvider

Update \`app/layout.tsx\`:

\`\`\`typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
\`\`\`

### 5. Use auth() in Server Components

\`\`\`typescript
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  // Get auth state (lightweight)
  const { userId, sessionId } = await auth()

  // Get full user object (heavier, fewer calls)
  const user = await currentUser()

  if (!userId) {
    return <div>Unauthorized</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>User ID: {userId}</p>
      <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  )
}
\`\`\`

**CRITICAL**:
- \`auth()\` is async in v6 (breaking change)
- Use \`auth()\` for lightweight checks
- Use \`currentUser()\` when you need full user object

---

## Cloudflare Workers Setup

### 1. Install Dependencies

\`\`\`bash
npm install @clerk/backend hono
\`\`\`

**Latest Versions**:
- @clerk/backend@2.17.2 (verified 2025-10-22)
- hono@4.10.1

### 2. Configure Environment Variables

Create \`.dev.vars\` for local development:

\`\`\`bash
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
\`\`\`

**Production**: Use \`wrangler secret put CLERK_SECRET_KEY\`

### 3. Implement Token Verification

Create \`src/index.ts\`:

\`\`\`typescript
import { Hono } from 'hono'
import { verifyToken } from '@clerk/backend'

type Bindings = {
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
}

type Variables = {
  userId: string | null
  sessionClaims: any | null
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware: Verify Clerk token
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    c.set('userId', null)
    c.set('sessionClaims', null)
    return next()
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const { data, error } = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
      // IMPORTANT: Set authorizedParties to prevent CSRF attacks
      authorizedParties: ['https://yourdomain.com'],
    })

    if (error) {
      console.error('Token verification failed:', error)
      c.set('userId', null)
      c.set('sessionClaims', null)
    } else {
      c.set('userId', data.sub)
      c.set('sessionClaims', data)
    }
  } catch (err) {
    console.error('Token verification error:', err)
    c.set('userId', null)
    c.set('sessionClaims', null)
  }

  return next()
})

// Protected route
app.get('/api/protected', (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    message: 'This is protected',
    userId,
    sessionClaims: c.get('sessionClaims'),
  })
})

export default app
\`\`\`

**CRITICAL**:
- Always set \`authorizedParties\` to prevent CSRF attacks
- Use \`secretKey\`, not deprecated \`apiKey\`
- Source: https://clerk.com/docs/reference/backend/verify-token

---

## Known Issues Prevention

This skill prevents **10 documented issues**:

### Issue #1: Missing Clerk Secret Key
**Error**: "Missing Clerk Secret Key or API Key"
**Source**: https://stackoverflow.com/questions/77620604
**Prevention**: Always set in \`.env.local\` or via \`wrangler secret put\`

### Issue #2: API Key → Secret Key Migration
**Error**: "apiKey is deprecated, use secretKey"
**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend
**Prevention**: Replace \`apiKey\` with \`secretKey\` in all calls

### Issue #3: JWKS Cache Race Condition
**Error**: "No JWK available"
**Source**: https://github.com/clerk/javascript/blob/main/packages/backend/CHANGELOG.md
**Prevention**: Use @clerk/backend@2.17.2 or later (fixed)

### Issue #4: Missing authorizedParties (CSRF)
**Error**: No error, but CSRF vulnerability
**Source**: https://clerk.com/docs/reference/backend/verify-token
**Prevention**: Always set \`authorizedParties: ['https://yourdomain.com']\`

### Issue #5: Import Path Changes (Core 2)
**Error**: "Cannot find module"
**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend
**Prevention**: Update import paths for Core 2

### Issue #6: JWT Size Limit Exceeded
**Error**: Token exceeds size limit
**Source**: https://clerk.com/docs/backend-requests/making/custom-session-token
**Prevention**: Keep custom claims under 1.2KB

### Issue #7: Deprecated API Version v1
**Error**: "API version v1 is deprecated"
**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend
**Prevention**: Use latest SDK versions (API v2025-04-10)

### Issue #8: ClerkProvider JSX Component Error
**Error**: "cannot be used as a JSX component"
**Source**: https://stackoverflow.com/questions/79265537
**Prevention**: Ensure React 19 compatibility with @clerk/clerk-react@5.51.0+

### Issue #9: Async auth() Helper Confusion
**Error**: "auth() is not a function"
**Source**: https://clerk.com/changelog/2024-10-22-clerk-nextjs-v6
**Prevention**: Always await: \`const { userId } = await auth()\`

### Issue #10: Environment Variable Misconfiguration
**Error**: "Missing Publishable Key" or secret leaked
**Prevention**: Use correct prefixes (\`NEXT_PUBLIC_\`, \`VITE_\`), never commit secrets

---

## Critical Rules

### Always Do

✅ Set \`authorizedParties\` when verifying tokens
✅ Use \`CLERK_SECRET_KEY\` environment variable
✅ Check \`isLoaded\` before rendering auth UI
✅ Use \`getToken()\` fresh for each request
✅ Await \`auth()\` in Next.js v6+
✅ Use \`NEXT_PUBLIC_\` prefix for client vars only
✅ Store secrets via \`wrangler secret put\`
✅ Implement middleware for route protection
✅ Use API version 2025-04-10 or later

### Never Do

❌ Store \`CLERK_SECRET_KEY\` in client code
❌ Use deprecated \`apiKey\` parameter
❌ Store tokens in localStorage
❌ Skip \`authorizedParties\` check
❌ Exceed 1.2KB for custom JWT claims
❌ Forget to check \`isLoaded\`
❌ Expose secrets with \`NEXT_PUBLIC_\` prefix
❌ Use API version v1

---

## Official Documentation

- **Clerk Docs**: https://clerk.com/docs
- **Next.js Guide**: https://clerk.com/docs/references/nextjs/overview
- **React Guide**: https://clerk.com/docs/references/react/overview
- **Backend SDK**: https://clerk.com/docs/reference/backend/overview
- **JWT Templates**: https://clerk.com/docs/guides/sessions/jwt-templates
- **shadcn/ui Integration**: https://clerk.com/docs/guides/development/shadcn-cli
- **Context7 Library ID**: \`/clerk/clerk-docs\`

---

## Package Versions (Verified 2025-10-22)

\`\`\`json
{
  "dependencies": {
    "@clerk/nextjs": "^6.33.3",
    "@clerk/clerk-react": "^5.51.0",
    "@clerk/backend": "^2.17.2"
  }
}
\`\`\`
