# Architecture: [Project Name]

**Deployment Platform**: Cloudflare Workers
**Frontend**: Vite + React + Tailwind v4 + shadcn/ui
**Backend**: Hono (API routes on same Worker)
**Database**: Cloudflare D1 (SQLite)
**Storage**: Cloudflare R2 (object storage)
**Auth**: Clerk (JWT-based)
**Last Updated**: [Date]

---

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React App (Vite build)                                │  │
│  │  - Components (shadcn/ui + custom)                     │  │
│  │  - State (TanStack Query + Zustand)                    │  │
│  │  - Forms (React Hook Form + Zod)                       │  │
│  └───────────┬────────────────────────────────────────────┘  │
└──────────────┼───────────────────────────────────────────────┘
               │ HTTPS
               ↓
┌──────────────────────────────────────────────────────────────┐
│             Cloudflare Worker (Edge Runtime)                 │
│  ┌────────────────────────┐   ┌──────────────────────────┐  │
│  │   Static Assets        │   │    API Routes (Hono)     │  │
│  │   (Vite build output)  │   │    /api/*                │  │
│  │   Served directly      │   │                          │  │
│  │                        │   │  Middleware:             │  │
│  │   / → index.html       │   │  - CORS                  │  │
│  │   /assets/*            │   │  - Auth (JWT verify)     │  │
│  │                        │   │  - Error handling        │  │
│  └────────────────────────┘   │  - Validation (Zod)      │  │
│                                └───────┬──────────────────┘  │
│                                        │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────┐
          │                              │                          │
          ↓                              ↓                          ↓
┌───────────────────┐         ┌───────────────────┐    ┌──────────────────┐
│  Cloudflare D1    │         │  Cloudflare R2    │    │   Clerk Auth     │
│  (Database)       │         │  (File Storage)   │    │   (External)     │
│                   │         │                   │    │                  │
│  - users          │         │  - avatars/       │    │  - User accounts │
│  - [other tables] │         │  - uploads/       │    │  - JWT tokens    │
│                   │         │                   │    │  - Social auth   │
└───────────────────┘         └───────────────────┘    └──────────────────┘
```

---

## Components Breakdown

### Frontend (Browser)

**Technology**: React 19 + Vite + Tailwind v4

**Responsibilities**:
- Render UI components
- Handle user interactions
- Client-side validation (Zod)
- Optimistic updates
- State management
- Routing (React Router or TanStack Router)

**Key Libraries**:
- `@clerk/clerk-react` - Authentication UI and hooks
- `@tanstack/react-query` - Server state management (caching, refetching)
- `zustand` - Client state management (UI state, preferences)
- `react-hook-form` - Form state and validation
- `zod` - Schema validation
- `shadcn/ui` - UI component library (Radix UI primitives)

**State Architecture**:
```
Server State (TanStack Query)
  ↓
  Cached API responses, auto-refetch, background sync
  Examples: user data, tasks, analytics

Client State (Zustand)
  ↓
  UI state, form state, user preferences
  Examples: sidebar open/closed, theme, filters
```

---

### Backend (Cloudflare Worker)

**Technology**: Hono web framework on Cloudflare Workers

**Responsibilities**:
- Serve static assets (Vite build)
- API request routing
- Authentication/authorization
- Server-side validation
- Business logic
- Database operations
- Third-party API integration

**Route Structure**:
```typescript
app.use('*', cors())
app.use('/api/*', authMiddleware)

// Static assets
app.get('/', serveStatic({ path: './dist/index.html' }))
app.get('/assets/*', serveStatic({ root: './dist' }))

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/[resource]', [resource]Routes)
// ... more routes

app.onError(errorHandler)
```

**Middleware Pipeline**:
```
Request
  ↓
CORS Middleware (allow frontend origin)
  ↓
Auth Middleware (verify JWT for /api/* routes)
  ↓
Route Handler
  ↓
Validation Middleware (Zod schema)
  ↓
Business Logic
  ↓
Response
  ↓
Error Handler (catch unhandled errors)
```

---

### Database (Cloudflare D1)

**Technology**: SQLite (via D1)

**Access Pattern**: SQL queries via Worker bindings

**Schema**: See `DATABASE_SCHEMA.md` for full details

**Usage**:
```typescript
// In Worker
const result = await c.env.DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first()
```

**Migrations**: Manual SQL files in `migrations/`

**Backups**: Export via `npx wrangler d1 export`

---

### Storage (Cloudflare R2)

**Technology**: S3-compatible object storage

**Use Cases**:
- User avatars
- File uploads
- Generated assets

**Access Pattern**: Direct upload from Worker, signed URLs for browser access

**Bucket Structure**:
```
[bucket-name]/
├── avatars/
│   ├── user-1.jpg
│   └── user-2.png
├── uploads/
│   └── [user-id]/
│       └── document.pdf
└── generated/
    └── export-123.csv
```

---

### Authentication (Clerk)

**Technology**: Clerk (external SaaS)

**Flow**:
```
1. User clicks "Sign In"
2. Clerk modal opens (handled by @clerk/clerk-react)
3. User authenticates (email/password or social)
4. Clerk returns JWT
5. Frontend includes JWT in API requests (Authorization: Bearer ...)
6. Worker verifies JWT using Clerk secret key
7. Worker extracts user email/ID from JWT
8. Worker processes request with user context
```

**JWT Custom Template** (configured in Clerk):
```json
{
  "email": "{{user.primary_email_address}}",
  "userId": "{{user.id}}",
  "metadata": {
    "displayName": "{{user.first_name}} {{user.last_name}}"
  }
}
```

**Verification** (in Worker):
```typescript
import { verifyToken } from '@clerk/backend'

const token = c.req.header('Authorization')?.replace('Bearer ', '')
const verified = await verifyToken(token, {
  secretKey: c.env.CLERK_SECRET_KEY
})
```

---

## Data Flow Patterns

### User Authentication Flow

```
1. User loads app
   → React app served from Worker static assets
   → ClerkProvider wraps app

2. User not authenticated
   → Show sign-in button
   → User clicks sign-in
   → Clerk modal opens

3. User signs in
   → Clerk handles authentication
   → Returns JWT to browser
   → React stores JWT in memory (via ClerkProvider)

4. User makes API request
   → React includes JWT in Authorization header
   → Worker middleware verifies JWT
   → Extracts user info from JWT
   → Passes to route handler via context
```

---

### CRUD Operation Flow (Example: Create Task)

```
1. User fills out form
   ↓
2. React Hook Form validates locally (Zod schema)
   ↓
3. Validation passes → Submit to API
   ↓
4. POST /api/tasks with JWT in header
   ↓
5. Worker receives request
   ↓
6. CORS middleware allows request
   ↓
7. Auth middleware verifies JWT → extracts userId
   ↓
8. Route handler receives request
   ↓
9. Validation middleware validates body (Zod schema)
   ↓
10. Business logic creates task in D1
    INSERT INTO tasks (user_id, title, ...) VALUES (?, ?, ...)
   ↓
11. Return created task (201)
   ↓
12. TanStack Query updates cache
   ↓
13. React re-renders with new task
```

---

### File Upload Flow

```
1. User selects file in browser
   ↓
2. React sends file to POST /api/upload
   ↓
3. Worker receives file (multipart/form-data)
   ↓
4. Worker validates file (size, type)
   ↓
5. Worker uploads to R2
   await c.env.R2_BUCKET.put(`uploads/${userId}/${filename}`, file)
   ↓
6. Worker creates DB record with R2 key
   INSERT INTO files (user_id, r2_key, filename, ...) VALUES (...)
   ↓
7. Return file metadata (200)
   ↓
8. Frontend shows uploaded file with signed URL
   GET /api/files/:id/url → Worker generates R2 signed URL
```

---

## Deployment Architecture

### Development Environment

```
localhost:5173
  ↓
Vite dev server (HMR)
  ↓
@cloudflare/vite-plugin runs Worker alongside Vite
  ↓
Worker connects to local D1 database
  ↓
All requests proxied correctly (frontend ↔ API on same port)
```

**Start dev**:
```bash
npm run dev
# Vite serves frontend on :5173
# Worker API available at :5173/api
# Uses local D1 and R2 buckets
```

---

### Production Environment

```
https://[app-name].[account].workers.dev (or custom domain)
  ↓
Cloudflare Worker (edge locations globally)
  ↓
Static assets cached at edge
API requests hit Worker
  ↓
D1 database (regional, auto-replicated)
R2 storage (global, low latency)
```

**Deploy**:
```bash
npm run build        # Vite builds frontend → dist/
npx wrangler deploy  # Uploads Worker + assets
```

---

## Security Architecture

### Authentication
- **JWT verification** on all protected routes
- **Clerk handles** password hashing, session management, social auth
- **No passwords stored** in our database

### Authorization
- **User ownership checks** before mutations
- Example: Can't delete another user's task
```typescript
const task = await getTask(id)
if (task.user_id !== c.get('userId')) {
  return c.json({ error: 'Forbidden' }, 403)
}
```

### Input Validation
- **Client-side** (Zod): Fast feedback, better UX
- **Server-side** (Zod): Security, trust boundary
- **Same schemas** used on both sides

### CORS
- **Restrict origins** to production domain
- **Allow credentials** for JWT cookies (if used)

### Secrets Management
- **Environment variables** for API keys
- **Never committed** to git
- **Wrangler secrets** for production

### Rate Limiting
[Optional: Add if implemented]
- X requests per minute per IP
- Higher limits for authenticated users

---

## Scaling Considerations

### Current Architecture Scales to:
- **Requests**: Millions/day (Cloudflare Workers auto-scale)
- **Users**: 10k-100k (D1 suitable for this range)
- **Data**: Moderate (D1 max 10GB per database)

### If You Need to Scale Beyond:
- **Database**: Consider Hyperdrive + external Postgres for >100k users
- **Storage**: R2 scales infinitely
- **Real-time**: Add Durable Objects for WebSocket connections
- **Compute**: Workers already global and auto-scaling

---

## Monitoring and Observability

[Optional: Define monitoring strategy]

**Metrics to Track**:
- Request volume and latency
- Error rates (4xx, 5xx)
- Database query performance
- R2 upload/download volumes

**Tools**:
- Cloudflare Analytics (built-in)
- Workers Analytics Engine (custom metrics)
- Sentry or similar for error tracking

---

## Development Workflow

1. **Local development**: `npm run dev`
2. **Make changes**: Edit code, hot reload
3. **Test locally**: Manual testing or automated tests
4. **Commit**: `git commit -m "feat: add feature"`
5. **Deploy**: `npx wrangler deploy`
6. **Monitor**: Check Cloudflare dashboard for errors

---

## Technology Choices Rationale

**Why Cloudflare Workers?**
- Global edge deployment (low latency)
- Auto-scaling (no server management)
- Integrated services (D1, R2, KV)
- Cost-effective for moderate traffic

**Why Vite?**
- Fast dev server with HMR
- Excellent React support
- Simple config
- `@cloudflare/vite-plugin` integrates perfectly with Workers

**Why Hono?**
- Lightweight and fast
- Express-like API (familiar)
- Native TypeScript support
- Works on any runtime (including Workers)

**Why Clerk?**
- Handles complex auth flows
- Social auth out of the box
- Great DX
- No need to build/maintain auth system

**Why Tailwind v4?**
- Utility-first CSS
- shadcn/ui compatibility
- Dark mode support
- v4 Vite plugin (no PostCSS needed)

---

## Future Architecture Enhancements

Potential additions:
- [ ] Durable Objects for real-time features (WebSockets)
- [ ] Workers AI for AI-powered features
- [ ] Queues for background jobs
- [ ] Hyperdrive for external database connections
- [ ] Vectorize for semantic search

---

## Revision History

**v1.0** ([Date]): Initial architecture design
**v1.1** ([Date]): [Changes made]
