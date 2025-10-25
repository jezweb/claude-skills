# Example: Simple Task Manager (No Auth)

This is an example of planning docs generated for a simple public task manager web app (no user accounts).

**User Request**: "I want to build a simple task manager where anyone can create, edit, and complete tasks. Just a public tool, no user accounts needed."

---

## IMPLEMENTATION_PHASES.md

# Implementation Phases: Simple Task Manager

**Project Type**: Public Web App (CRUD)
**Stack**: Cloudflare Workers + Vite + React + Tailwind v4 + shadcn/ui + D1
**Estimated Total**: 12 hours (~12 minutes human time with AI assistance)
**Created**: 2025-10-25

---

## Phase 1: Project Setup
**Type**: Infrastructure
**Estimated**: 2-3 hours
**Files**: `package.json`, `wrangler.jsonc`, `vite.config.ts`, `src/index.ts`, `src/index.css`

### Tasks
- [ ] Scaffold Cloudflare Worker with Vite using `npm create cloudflare@latest`
- [ ] Install dependencies: React, Tailwind v4, shadcn/ui, Hono
- [ ] Configure `wrangler.jsonc` with D1 database binding
- [ ] Setup Tailwind v4 with `@tailwindcss/vite` plugin
- [ ] Initialize shadcn/ui with dark mode support
- [ ] Create basic "Hello World" component
- [ ] Test local dev server
- [ ] Test deployment to Cloudflare

### Verification Criteria
- [ ] `npm run dev` starts without errors
- [ ] `localhost:5173` shows React app with Tailwind styling
- [ ] Dark/light mode toggle works
- [ ] `npm run build` succeeds
- [ ] `npx wrangler deploy` deploys successfully
- [ ] Deployed URL shows working app

### Exit Criteria
Working development environment with successful test deployment. Can iterate on code locally and deploy to Cloudflare.

---

## Phase 2: Database Schema
**Type**: Database
**Estimated**: 2 hours
**Files**: `migrations/0001_initial.sql`, `src/lib/db-types.ts`

### Tasks
- [ ] Create D1 database using `npx wrangler d1 create task-manager-db`
- [ ] Design `tasks` table schema
- [ ] Write migration SQL file
- [ ] Apply migration to local database
- [ ] Create TypeScript types for database schema
- [ ] Write test query in Worker to verify database connection

### Verification Criteria
- [ ] Migration runs without errors
- [ ] Can insert test task
- [ ] Can query tasks from Worker
- [ ] TypeScript types match database schema

### Exit Criteria
Database schema deployed locally, can perform CRUD operations from Worker.

---

## Phase 3: Tasks API
**Type**: API
**Estimated**: 4 hours
**Files**: `src/routes/tasks.ts`, `src/lib/schemas.ts`, `src/middleware/cors.ts`

### Tasks
- [ ] Define Zod schema for task validation
- [ ] Create CORS middleware
- [ ] Implement GET /api/tasks (list all tasks)
- [ ] Implement POST /api/tasks (create task)
- [ ] Implement PATCH /api/tasks/:id (update task)
- [ ] Implement DELETE /api/tasks/:id (delete task)
- [ ] Add error handling middleware
- [ ] Test all endpoints manually with curl

### Verification Criteria
- [ ] GET /api/tasks returns empty array initially
- [ ] POST /api/tasks with valid data returns 201
- [ ] POST /api/tasks with invalid data returns 400
- [ ] PATCH /api/tasks/:id updates task and returns 200
- [ ] DELETE /api/tasks/:id removes task and returns 204
- [ ] Invalid task ID returns 404
- [ ] CORS headers present in responses

### Exit Criteria
All CRUD endpoints working, tested with curl, proper error handling.

---

## Phase 4: Task List UI
**Type**: UI
**Estimated**: 3-4 hours
**Files**: `src/components/TaskList.tsx`, `src/components/TaskCard.tsx`, `src/lib/api.ts`

### Tasks
- [ ] Setup TanStack Query for data fetching
- [ ] Create API client functions (fetch tasks, create, update, delete)
- [ ] Build `TaskList` component with loading/error states
- [ ] Build `TaskCard` component to display individual tasks
- [ ] Add "Mark complete" toggle functionality
- [ ] Add delete button with confirmation
- [ ] Style with Tailwind and shadcn/ui components

### Verification Criteria
- [ ] Task list displays fetched tasks
- [ ] Loading skeleton shows while fetching
- [ ] Error message shows if API fails
- [ ] Can toggle task completion (optimistic update)
- [ ] Can delete task (shows confirmation dialog)
- [ ] UI updates immediately after mutations

### Exit Criteria
Task list displays correctly with all CRUD operations working from UI.

---

## Phase 5: Task Creation Form
**Type**: UI
**Estimated**: 2-3 hours
**Files**: `src/components/TaskForm.tsx`, `src/components/CreateTaskDialog.tsx`

### Tasks
- [ ] Install React Hook Form and Zod resolver
- [ ] Create `TaskForm` component with title and description fields
- [ ] Add client-side validation (Zod schema)
- [ ] Build `CreateTaskDialog` modal wrapper
- [ ] Implement form submission with TanStack Query mutation
- [ ] Add loading state during submission
- [ ] Show success/error feedback
- [ ] Clear form and close dialog on success

### Verification Criteria
- [ ] Form validates empty title (shows error)
- [ ] Form validates title length (max 100 chars)
- [ ] Successful submission creates task in database
- [ ] Task appears in list immediately (optimistic update)
- [ ] Form resets after successful submission
- [ ] Dialog closes after successful submission
- [ ] Error message shows if submission fails

### Exit Criteria
Can create tasks via form, validation works, UX is smooth.

---

## Notes

### Testing Strategy
Testing built into each phase via verification criteria. No separate testing phase needed for this simple project.

### Deployment Strategy
Deploy after each phase to test in production environment:
```bash
npm run build && npx wrangler deploy
```

### Context Management
Phases sized to complete in single session including implementation, verification, and expected debugging.

---

## DATABASE_SCHEMA.md

# Database Schema: Simple Task Manager

**Database**: Cloudflare D1 (SQLite)
**Migrations**: `migrations/` directory
**ORM**: None (raw SQL)

---

## Tables

### `tasks`
**Purpose**: Store tasks (public, no user association)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | INTEGER | PRIMARY KEY | AUTO | Auto-increment |
| `title` | TEXT | NOT NULL | - | Task title (max 100 chars) |
| `description` | TEXT | NULL | - | Task description (optional) |
| `completed` | INTEGER | NOT NULL | 0 | 0 = incomplete, 1 = complete |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp |

**Indexes**:
- `idx_tasks_created_at` on `created_at` (for sorting by date)
- `idx_tasks_completed` on `completed` (for filtering complete/incomplete)

---

## Migrations

### Migration 0001: Initial Schema
**File**: `migrations/0001_initial_schema.sql`
**Purpose**: Create tasks table

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_completed ON tasks(completed);
```

**Run**:
```bash
npx wrangler d1 execute task-manager-db --local --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute task-manager-db --remote --file=migrations/0001_initial_schema.sql
```

---

## Seed Data

**File**: `migrations/seed.sql`

```sql
INSERT INTO tasks (title, description, completed, created_at, updated_at)
VALUES
  ('Build database schema', 'Create tasks table with migrations', 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('Create API endpoints', 'Implement CRUD operations for tasks', 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('Build UI components', 'Task list and creation form', 0, strftime('%s', 'now'), strftime('%s', 'now'));
```

---

## API_ENDPOINTS.md

# API Endpoints: Simple Task Manager

**Base URL**: `/api`
**Framework**: Hono
**Auth**: None (public API)
**Validation**: Zod schemas

---

## Tasks

### GET `/api/tasks`
**Purpose**: List all tasks

**Query Parameters**:
- `completed` (optional): Filter by completion status (`true` or `false`)

**Response 200**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Sample Task",
      "description": "Task description",
      "completed": false,
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

---

### POST `/api/tasks`
**Purpose**: Create a new task

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Optional description"
}
```

**Validation**:
```typescript
z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional()
})
```

**Response 201**: Created task object

**Response 400**: Validation error

---

### PATCH `/api/tasks/:id`
**Purpose**: Update a task

**Request Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "completed": true
}
```

**Response 200**: Updated task object

**Response 404**: Task not found

---

### DELETE `/api/tasks/:id`
**Purpose**: Delete a task

**Response 204**: No content (success)

**Response 404**: Task not found

---

**Note**: This is a simplified example for a public task manager. For a production app with user accounts, see the `auth-web-app.md` example.
