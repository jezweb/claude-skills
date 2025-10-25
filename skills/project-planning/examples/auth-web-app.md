# Example: Personal Task Manager with Authentication

This example shows planning docs for a task manager with user authentication using Clerk.

**User Request**: "I want to build a task manager where users can sign up, log in, and manage their own tasks privately. Users should be able to organize tasks with tags and due dates."

---

## IMPLEMENTATION_PHASES.md (Excerpt)

# Implementation Phases: Personal Task Manager

**Project Type**: Authenticated Web App (Multi-user CRUD)
**Stack**: Cloudflare Workers + Vite + React + Tailwind v4 + shadcn/ui + D1 + Clerk
**Estimated Total**: 20 hours (~20 minutes human time)
**Created**: 2025-10-25

---

## Phase 1: Project Setup
**Type**: Infrastructure
**Estimated**: 2-3 hours
**Files**: `package.json`, `wrangler.jsonc`, `vite.config.ts`, `src/index.ts`

[Same structure as simple example]

---

## Phase 2: Database Schema
**Type**: Database
**Estimated**: 3-4 hours
**Files**: `migrations/0001_initial.sql`, `src/lib/db-types.ts`

### Tasks
- [ ] Create D1 database
- [ ] Design schema for users, tasks, tags, task_tags tables
- [ ] Write migration SQL
- [ ] Create TypeScript types
- [ ] Apply migration locally

### Verification Criteria
- [ ] All tables created successfully
- [ ] Foreign keys work (task references user)
- [ ] Unique constraints work (user email, tag name per user)
- [ ] Can query with joins (tasks with their tags)

### Exit Criteria
Complete database schema with relationships working.

---

## Phase 3: Clerk Authentication Setup
**Type**: Integration
**Estimated**: 3 hours
**Files**: `src/main.tsx`, `src/middleware/auth.ts`, `src/lib/clerk-types.ts`

### Tasks
- [ ] Create Clerk account and application
- [ ] Install `@clerk/clerk-react` and `@clerk/backend`
- [ ] Configure Clerk in frontend (ClerkProvider)
- [ ] Create custom JWT template in Clerk dashboard
- [ ] Implement auth middleware for Worker
- [ ] Test JWT verification
- [ ] Create protected route wrapper component

### Verification Criteria
- [ ] Can sign up new user (Clerk modal)
- [ ] Can sign in existing user
- [ ] JWT is included in API requests
- [ ] Worker middleware verifies JWT correctly
- [ ] Invalid JWT returns 401
- [ ] Protected routes redirect if not authenticated

### Exit Criteria
Authentication flow working end-to-end. Users can sign up, log in, and access protected routes.

---

## Phase 4: User Sync (Webhook)
**Type**: Integration
**Estimated**: 2 hours
**Files**: `src/routes/webhooks.ts`, `src/lib/webhook-verify.ts`

### Tasks
- [ ] Install `svix` package
- [ ] Create webhook endpoint `/api/webhooks/clerk`
- [ ] Implement signature verification
- [ ] Handle `user.created` event (insert into database)
- [ ] Handle `user.updated` event
- [ ] Handle `user.deleted` event
- [ ] Configure webhook in Clerk dashboard

### Verification Criteria
- [ ] New user signup triggers webhook
- [ ] User record created in D1 database
- [ ] Invalid webhook signature rejected
- [ ] User updates sync to database
- [ ] User deletions remove tasks (cascade)

### Exit Criteria
User data synced between Clerk and D1 database.

---

## Phase 5: Tasks API
**Type**: API
**Estimated**: 5 hours
**Files**: `src/routes/tasks.ts`, `src/lib/schemas.ts`

### Tasks
- [ ] Define Zod schemas for task validation
- [ ] GET /api/tasks (user's tasks only)
- [ ] POST /api/tasks (create for current user)
- [ ] PATCH /api/tasks/:id (update if user owns)
- [ ] DELETE /api/tasks/:id (delete if user owns)
- [ ] Add authorization checks (verify ownership)
- [ ] Filter by completion, tag, due date

### Verification Criteria
- [ ] GET /api/tasks returns only current user's tasks
- [ ] Cannot access other users' tasks
- [ ] Cannot update/delete other users' tasks (403)
- [ ] Filters work (completed, tag, due date)
- [ ] All CRUD operations tested

### Exit Criteria
Tasks API complete with proper authorization.

---

## Phase 6: Tags API
**Type**: API
**Estimated**: 2 hours
**Files**: `src/routes/tags.ts`

### Tasks
- [ ] GET /api/tags (user's tags)
- [ ] POST /api/tags (create tag)
- [ ] DELETE /api/tags/:id (delete tag)
- [ ] POST /api/tasks/:id/tags (add tag to task)
- [ ] DELETE /api/tasks/:id/tags/:tagId (remove tag from task)

### Verification Criteria
- [ ] Can create tags
- [ ] Can attach tags to tasks
- [ ] Can filter tasks by tag
- [ ] Deleting tag doesn't delete tasks

### Exit Criteria
Tag management working with task associations.

---

## Phase 7: Dashboard UI
**Type**: UI
**Estimated**: 6 hours
**Files**: `src/pages/Dashboard.tsx`, `src/components/layout/Sidebar.tsx`, etc.

### Tasks
- [ ] Build dashboard layout with sidebar
- [ ] Add user menu with sign out
- [ ] Create task list view
- [ ] Add task filtering (completed, tags, due date)
- [ ] Build task creation dialog
- [ ] Build task editing dialog
- [ ] Add task deletion with confirmation

### Verification Criteria
- [ ] Dashboard shows user's tasks
- [ ] Filters work correctly
- [ ] Can create tasks via dialog
- [ ] Can edit existing tasks
- [ ] Can delete tasks
- [ ] UI updates optimistically

### Exit Criteria
Complete dashboard with full task management.

---

## Phase 8: Tags UI
**Type**: UI
**Estimated**: 3 hours
**Files**: `src/components/TagManager.tsx`, `src/components/TagBadge.tsx`

### Tasks
- [ ] Build tag creation form
- [ ] Build tag list component
- [ ] Add tag selection to task form (multi-select)
- [ ] Display tags as badges on tasks
- [ ] Allow removing tags from tasks

### Verification Criteria
- [ ] Can create new tags
- [ ] Can select tags when creating/editing task
- [ ] Tags display on task cards
- [ ] Can filter by tag
- [ ] Can remove tags from tasks

### Exit Criteria
Full tag management integrated with tasks.

---

## DATABASE_SCHEMA.md (Excerpt)

# Database Schema: Personal Task Manager

---

## Tables

### `users`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment |
| `clerk_id` | TEXT | UNIQUE, NOT NULL | Clerk user ID |
| `email` | TEXT | UNIQUE, NOT NULL | User email |
| `display_name` | TEXT | NULL | Display name |
| `created_at` | INTEGER | NOT NULL | Unix timestamp |
| `updated_at` | INTEGER | NOT NULL | Unix timestamp |

**Indexes**: `idx_users_clerk_id`, `idx_users_email`

---

### `tasks`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment |
| `user_id` | INTEGER | FOREIGN KEY, NOT NULL | References users(id) |
| `title` | TEXT | NOT NULL | Task title |
| `description` | TEXT | NULL | Task description |
| `completed` | INTEGER | NOT NULL | 0 or 1 |
| `due_date` | INTEGER | NULL | Unix timestamp |
| `created_at` | INTEGER | NOT NULL | Unix timestamp |
| `updated_at` | INTEGER | NOT NULL | Unix timestamp |

**Indexes**: `idx_tasks_user_id`, `idx_tasks_due_date`, `idx_tasks_completed`

**Relationships**: Many-to-one with users

**Cascade**: ON DELETE CASCADE (deleting user deletes their tasks)

---

### `tags`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment |
| `user_id` | INTEGER | FOREIGN KEY, NOT NULL | References users(id) |
| `name` | TEXT | NOT NULL | Tag name |
| `color` | TEXT | NOT NULL | Hex color code |
| `created_at` | INTEGER | NOT NULL | Unix timestamp |

**Indexes**: `idx_tags_user_id`, `idx_tags_name_user_id UNIQUE`

**Unique Constraint**: (user_id, name) - users can't have duplicate tag names

---

### `task_tags`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment |
| `task_id` | INTEGER | FOREIGN KEY, NOT NULL | References tasks(id) |
| `tag_id` | INTEGER | FOREIGN KEY, NOT NULL | References tags(id) |
| `created_at` | INTEGER | NOT NULL | Unix timestamp |

**Indexes**: `idx_task_tags_task_id`, `idx_task_tags_tag_id`, `idx_task_tags_composite UNIQUE`

**Unique Constraint**: (task_id, tag_id) - can't add same tag to task twice

**Cascade**: ON DELETE CASCADE (deleting task or tag removes association)

---

## Relationships Diagram

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │ 1
       │
       ├─────────────────────┬
       │ N                   │ N
┌──────┴──────────┐   ┌──────┴──────────┐
│     tasks       │   │      tags       │
└──────┬──────────┘   └──────┬──────────┘
       │ N                   │ N
       │                     │
       └──────────┬──────────┘
                  │
           ┌──────┴──────────┐
           │   task_tags     │
           │   (junction)    │
           └─────────────────┘
```

---

## API_ENDPOINTS.md (Excerpt)

# API Endpoints: Personal Task Manager

**Auth**: Required on all `/api/*` routes (except webhooks)

---

## Authentication

### GET `/api/auth/me`
**Purpose**: Get current user profile

**Response 200**:
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "John Doe",
    "createdAt": 1234567890
  }
}
```

---

## Tasks

### GET `/api/tasks`
**Purpose**: Get current user's tasks

**Query Parameters**:
- `completed` (optional): `true` or `false`
- `tag` (optional): Tag ID to filter by
- `dueBefore` (optional): Unix timestamp
- `dueAfter` (optional): Unix timestamp

**Response 200**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Review PR",
      "description": "Check the new feature",
      "completed": false,
      "dueDate": 1234567890,
      "tags": [
        { "id": 1, "name": "work", "color": "#3b82f6" }
      ],
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

---

### POST `/api/tasks`
**Purpose**: Create task for current user

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Optional",
  "dueDate": 1234567890,
  "tagIds": [1, 2]
}
```

**Validation**:
```typescript
z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  dueDate: z.number().optional(),
  tagIds: z.array(z.number()).optional()
})
```

**Response 201**: Created task with tags

---

## Tags

### GET `/api/tags`
**Purpose**: Get current user's tags

**Response 200**:
```json
{
  "data": [
    { "id": 1, "name": "work", "color": "#3b82f6" },
    { "id": 2, "name": "personal", "color": "#10b981" }
  ]
}
```

---

### POST `/api/tags`
**Purpose**: Create tag for current user

**Request Body**:
```json
{
  "name": "urgent",
  "color": "#ef4444"
}
```

**Response 201**: Created tag

**Response 400**: Duplicate tag name (user already has tag with this name)

---

## INTEGRATION.md (Excerpt)

# Third-Party Integrations: Personal Task Manager

---

## Clerk (Authentication)

**Purpose**: User authentication and management

**Environment Variables**:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

**Custom JWT Template** (Clerk dashboard):
```json
{
  "email": "{{user.primary_email_address}}",
  "userId": "{{user.id}}",
  "firstName": "{{user.first_name}}",
  "lastName": "{{user.last_name}}"
}
```

**Frontend**:
```tsx
import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

<ClerkProvider publishableKey={...}>
  <SignedIn>
    <Dashboard />
    <UserButton />
  </SignedIn>
  <SignedOut>
    <LandingPage />
  </SignedOut>
</ClerkProvider>
```

**Backend Middleware**:
```typescript
import { verifyToken } from '@clerk/backend'

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const verified = await verifyToken(token, {
    secretKey: c.env.CLERK_SECRET_KEY
  })
  c.set('clerkUserId', verified.userId)
  c.set('email', verified.email)

  // Get local user ID from database
  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE clerk_id = ?'
  ).bind(verified.userId).first()

  c.set('userId', user.id)
  await next()
}
```

**Webhook** (User Sync):
```typescript
app.post('/api/webhooks/clerk', async (c) => {
  const payload = await c.req.text()
  const verified = await verifyClerkWebhook(payload, c.req.raw.headers, c.env.CLERK_WEBHOOK_SECRET)

  const event = JSON.parse(payload)

  if (event.type === 'user.created') {
    await c.env.DB.prepare(`
      INSERT INTO users (clerk_id, email, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      event.data.id,
      event.data.email_addresses[0].email_address,
      `${event.data.first_name} ${event.data.last_name}`,
      Date.now(),
      Date.now()
    ).run()
  }

  return c.json({ received: true })
})
```

---

**Note**: This example shows the complete structure for an authenticated multi-user app. For AI-powered features, see `ai-web-app.md`.
