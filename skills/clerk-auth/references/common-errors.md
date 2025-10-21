# Clerk Authentication - Common Errors & Solutions

**Last Updated**: 2025-10-22

This document provides detailed troubleshooting for all 10 documented Clerk authentication issues.

---

## Error #1: Missing Clerk Secret Key

### Symptoms
\`\`\`
Error: Missing Clerk Secret Key or API Key
\`\`\`

### Why It Happens
- \`CLERK_SECRET_KEY\` environment variable not set
- Environment file not loaded
- Wrong environment file name

### Solutions

**Next.js**:
1. Create \`.env.local\` in project root
2. Add: \`CLERK_SECRET_KEY=sk_test_...\`
3. Restart dev server

**Cloudflare Workers**:
1. Local: Create \`.dev.vars\` with \`CLERK_SECRET_KEY=sk_test_...\`
2. Production: Run \`wrangler secret put CLERK_SECRET_KEY\`

### Prevention
- Always set secret key before running app
- Verify with: \`echo $CLERK_SECRET_KEY\` (should be empty - it's private!)
- Check environment is loading: add \`console.log(!!process.env.CLERK_SECRET_KEY)\`

**Source**: https://stackoverflow.com/questions/77620604

---

## Error #2: API Key → Secret Key Migration (Core 2)

### Symptoms
\`\`\`
Warning: apiKey is deprecated, use secretKey instead
TypeError: Cannot read properties of undefined
\`\`\`

### Why It Happens
- Upgrading from @clerk/backend v1 to v2 (Core 2)
- Old code uses \`apiKey\` parameter
- Breaking change in Core 2

### Solutions

**Before (v1)**:
\`\`\`typescript
const clerk = createClerkClient({
  apiKey: process.env.CLERK_API_KEY // ❌ Deprecated
})
\`\`\`

**After (v2)**:
\`\`\`typescript
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY // ✅ Correct
})
\`\`\`

### Prevention
- Use \`secretKey\` in all new code
- Search codebase for \`apiKey:\` and replace with \`secretKey:\`
- Update environment variable name from \`CLERK_API_KEY\` to \`CLERK_SECRET_KEY\`

**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend

---

## Error #3: JWKS Cache Race Condition

### Symptoms
\`\`\`
Error: No JWK available
Token verification fails intermittently
\`\`\`

### Why It Happens
- Race condition in older @clerk/backend versions
- JWKS cache not populated before verification
- Fixed in recent versions

### Solutions

**Update Package**:
\`\`\`bash
npm install @clerk/backend@latest
# Ensure version is 2.17.2 or later
\`\`\`

**Verify Version**:
\`\`\`bash
npm list @clerk/backend
\`\`\`

### Prevention
- Always use latest stable @clerk/backend version
- This issue is fixed in modern versions

**Source**: https://github.com/clerk/javascript/blob/main/packages/backend/CHANGELOG.md

---

## Error #4: Missing authorizedParties (CSRF Vulnerability)

### Symptoms
- No error, but security vulnerability
- Tokens from other domains accepted
- CSRF attacks possible

### Why It Happens
- \`authorizedParties\` not set in \`verifyToken()\`
- Clerk accepts tokens from any domain by default

### Solutions

**Always Set authorizedParties**:
\`\`\`typescript
const { data, error } = await verifyToken(token, {
  secretKey: env.CLERK_SECRET_KEY,
  authorizedParties: [
    'http://localhost:5173',    // Development
    'https://yourdomain.com',   // Production
  ], // ✅ Required for security
})
\`\`\`

### Prevention
- Always set \`authorizedParties\` in production
- List all domains that should be able to make requests
- Never use wildcard or leave empty

**Source**: https://clerk.com/docs/reference/backend/verify-token

---

## Error #5: Import Path Changes (Core 2 Upgrade)

### Symptoms
\`\`\`
Error: Cannot find module '@clerk/backend'
Module not found: Can't resolve '@clerk/backend/errors'
\`\`\`

### Why It Happens
- Import paths changed in Core 2
- Old imports don't work in new version

### Solutions

**Update Imports**:
\`\`\`typescript
// Before (v1)
import { TokenVerificationError } from '@clerk/backend'

// After (v2)
import { TokenVerificationError } from '@clerk/backend/errors'
\`\`\`

### Common Path Changes
| Old Path | New Path |
|----------|----------|
| \`@clerk/backend\` (errors) | \`@clerk/backend/errors\` |
| \`@clerk/backend\` (types) | \`@clerk/backend/types\` |

### Prevention
- Follow official migration guide
- Update all imports when upgrading

**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend

---

## Error #6: JWT Size Limit Exceeded

### Symptoms
\`\`\`
Error: Token exceeds maximum size
Session token too large
\`\`\`

### Why It Happens
- Custom JWT claims exceed 1.2KB limit
- Too much data in \`publicMetadata\`
- Clerk's default claims + your claims > 1.2KB

### Solutions

**Reduce Custom Claims**:
\`\`\`json
{
  "email": "{{user.primary_email_address}}",
  "role": "{{user.public_metadata.role}}"
}
\`\`\`

**Store Large Data in Database**:
- Use JWT for minimal claims (user ID, role)
- Store profile data, preferences in your database
- Fetch after authentication

### Prevention
- Keep custom claims minimal
- Use database for large/complex data
- Monitor token size during development

**Source**: https://clerk.com/docs/backend-requests/making/custom-session-token

---

## Error #7: Deprecated API Version v1

### Symptoms
\`\`\`
Warning: API version v1 is deprecated
Please upgrade to API version 2025-04-10
\`\`\`

### Why It Happens
- Using old SDK version
- API version 1 deprecated April 2025

### Solutions

**Update SDKs**:
\`\`\`bash
npm install @clerk/nextjs@latest
npm install @clerk/backend@latest
npm install @clerk/clerk-react@latest
\`\`\`

**Verify Versions**:
- @clerk/nextjs: 6.0.0+
- @clerk/backend: 2.0.0+
- @clerk/clerk-react: 5.0.0+

### Prevention
- Keep SDKs updated
- Use latest stable versions
- Follow deprecation warnings

**Source**: https://clerk.com/docs/upgrade-guides/core-2/backend

---

## Error #8: ClerkProvider JSX Component Error

### Symptoms
\`\`\`
Error: 'ClerkProvider' cannot be used as a JSX component
  Its element type 'ReactElement<any, any> | Component<...>' is not a valid JSX element
\`\`\`

### Why It Happens
- React version mismatch
- @clerk/clerk-react not compatible with React version
- TypeScript type conflicts

### Solutions

**Update Packages**:
\`\`\`bash
npm install @clerk/clerk-react@latest react@latest react-dom@latest
\`\`\`

**Ensure Compatibility**:
- React 19: Use @clerk/clerk-react@5.51.0+
- React 18: Use @clerk/clerk-react@5.0.0+

### Prevention
- Keep React and Clerk packages in sync
- Use compatible versions

**Source**: https://stackoverflow.com/questions/79265537

---

## Error #9: Async auth() Helper Confusion

### Symptoms
\`\`\`
Error: auth() is not a function
TypeError: Cannot read properties of undefined
\`\`\`

### Why It Happens
- @clerk/nextjs v6 made \`auth()\` async (breaking change)
- Old code doesn't await \`auth()\`

### Solutions

**Before (v5)**:
\`\`\`typescript
const { userId } = auth() // ❌ Sync in v5
\`\`\`

**After (v6)**:
\`\`\`typescript
const { userId } = await auth() // ✅ Async in v6
\`\`\`

### All Affected Code
- \`const { userId } = await auth()\`
- \`const user = await currentUser()\`
- \`await auth.protect()\` (in middleware)

### Prevention
- Always await auth-related functions in v6+
- Update all instances when upgrading

**Source**: https://clerk.com/changelog/2024-10-22-clerk-nextjs-v6

---

## Error #10: Environment Variable Misconfiguration

### Symptoms
\`\`\`
Error: Missing Publishable Key
Warning: Secret key exposed to client
\`\`\`

### Why It Happens
- Wrong environment variable prefix
- Secrets committed to version control
- Environment file not loaded

### Solutions

**Next.js Prefix Rules**:
- Client variables: \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\`
- Server variables: \`CLERK_SECRET_KEY\` (no prefix!)

**Vite Prefix Rules**:
- Client variables: \`VITE_CLERK_PUBLISHABLE_KEY\`

**Cloudflare Workers**:
- Local: \`.dev.vars\` file
- Production: \`wrangler secret put CLERK_SECRET_KEY\`

### Prevention Checklist
- [ ] Use correct prefix for framework
- [ ] Never use \`NEXT_PUBLIC_\` or \`VITE_\` for secrets
- [ ] Add \`.env.local\` and \`.dev.vars\` to \`.gitignore\`
- [ ] Use different keys for dev and production
- [ ] Restart dev server after changing env vars

**Source**: General best practices

---

## Quick Debugging Checklist

When auth isn't working:

1. **Check Environment Variables**
   - [ ] \`CLERK_SECRET_KEY\` set?
   - [ ] \`CLERK_PUBLISHABLE_KEY\` or \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\` set?
   - [ ] Correct prefix for framework?
   - [ ] Dev server restarted after changes?

2. **Check Package Versions**
   - [ ] Using latest stable versions?
   - [ ] React version compatible with Clerk?
   - [ ] All Clerk packages same major version?

3. **Check Code Patterns**
   - [ ] \`auth()\` being awaited? (v6+)
   - [ ] \`authorizedParties\` set in \`verifyToken()\`?
   - [ ] \`isLoaded\` checked before rendering?
   - [ ] Using \`secretKey\` not \`apiKey\`?

4. **Check Network**
   - [ ] Token in \`Authorization: Bearer <token>\` header?
   - [ ] CORS configured if API is different domain?
   - [ ] Clerk Dashboard shows API requests?

5. **Check Clerk Dashboard**
   - [ ] Application configured correctly?
   - [ ] Development/production keys match environment?
   - [ ] Custom JWT template valid?
   - [ ] Webhooks configured if using?

---

**Still Having Issues?**

1. Check official Clerk docs: https://clerk.com/docs
2. Search Clerk Discord: https://clerk.com/discord
3. File GitHub issue: https://github.com/clerk/javascript/issues
4. Check Clerk status: https://status.clerk.com
