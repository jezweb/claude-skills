# Enabling Clerk Authentication

This scaffold includes Clerk auth patterns (commented out). Enable with one script.

---

## Quick Enable

```bash
./scripts/enable-auth.sh
```

This uncomments all auth patterns and prompts for API keys.

---

## Manual Setup

### 1. Get Clerk API Keys

1. Go to https://dashboard.clerk.com
2. Create an application
3. Copy your publishable and secret keys

### 2. Create JWT Template

In Clerk Dashboard → JWT Templates:
- Name: `cloudflare-worker`
- Claims:
  ```json
  {
    "email": "{{user.primary_email_address}}",
    "firstName": "{{user.first_name}}",
    "lastName": "{{user.last_name}}",
    "userId": "{{user.id}}"
  }
  ```

### 3. Add Environment Variables

**.env** (frontend):
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

**.dev.vars** (backend):
```bash
CLERK_SECRET_KEY=sk_test_xxx
```

### 4. Uncomment Auth Code

**Frontend** (`src/lib/api-client.ts`):
- Uncomment `useApiClient` hook
- Uncomment token attachment

**Frontend** (`src/components/ProtectedRoute.tsx`):
- Uncomment entire component

**Backend** (`backend/middleware/auth.ts`):
- Uncomment `jwtAuthMiddleware`

**Backend** (`backend/src/index.ts`):
- Uncomment auth middleware application

---

## Testing Auth

1. Start dev server: `npm run dev`
2. Visit protected route
3. Should redirect to Clerk sign-in
4. After sign-in, API calls should include auth token

---

## Production Secrets

```bash
npx wrangler secret put CLERK_SECRET_KEY
```

---

See `cloudflare-full-stack-integration` skill for complete auth patterns.
