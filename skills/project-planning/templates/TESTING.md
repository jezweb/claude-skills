# Testing Strategy: [Project Name]

**Testing Framework**: Vitest (unit/integration)
**E2E Framework**: Playwright (optional)
**Coverage Target**: 70%+ for critical paths
**Last Updated**: [Date]

---

## Overview

This document defines the testing strategy including what to test, how to test, and when to test.

**Testing Philosophy**:
- **Test behavior, not implementation** - Focus on user-facing functionality
- **Test critical paths first** - Auth, data CRUD, payments, etc
- **Fast feedback** - Unit tests run in milliseconds
- **Realistic tests** - Integration tests use real-ish data
- **E2E for happy paths** - Cover main user workflows

**Testing Pyramid**:
```
        ┌──────────┐
        │   E2E    │ ← Few (slow, brittle)
        └──────────┘
      ┌──────────────┐
      │ Integration  │ ← Some (medium speed)
      └──────────────┘
   ┌───────────────────┐
   │  Unit Tests       │ ← Many (fast, focused)
   └───────────────────┘
```

---

## What to Test

### ✅ Do Test

**Business Logic**:
- Data validation (Zod schemas)
- Data transformations
- Complex calculations
- State management logic

**API Endpoints**:
- All HTTP methods (GET, POST, PATCH, DELETE)
- All response codes (200, 400, 401, 404, 500)
- Request validation
- Authorization checks

**User Workflows**:
- Authentication flow
- CRUD operations (create, read, update, delete)
- Form submissions
- Error handling

**Critical Paths**:
- Payment processing (if applicable)
- Data export/import
- Email notifications
- File uploads

---

### ❌ Don't Test

**Third-party libraries**: Trust that React, Tailwind, shadcn/ui work

**Implementation details**: Internal function calls, component props (unless part of public API)

**Trivial code**: Simple getters/setters, pass-through functions

**UI styling**: Visual regression testing is overkill for most projects

---

## Testing Layers

### 1. Unit Tests (Many)

**Purpose**: Test individual functions and utilities in isolation

**Tool**: Vitest

**What to test**:
- Utility functions (`src/lib/utils.ts`)
- Zod schemas (`src/lib/schemas.ts`)
- Data transformations
- Pure functions

**Example**:
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate, cn } from './utils'

describe('formatDate', () => {
  it('formats Unix timestamp to readable date', () => {
    expect(formatDate(1234567890)).toBe('Feb 14, 2009')
  })

  it('handles invalid timestamps', () => {
    expect(formatDate(-1)).toBe('Invalid Date')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})
```

**Run**: `npm run test`

---

### 2. Integration Tests (Some)

**Purpose**: Test API endpoints with real database interactions

**Tool**: Vitest + Miniflare (Cloudflare Workers simulator)

**What to test**:
- API routes (`/api/*`)
- Middleware (auth, CORS, error handling)
- Database operations (CRUD)

**Setup**:
```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'

beforeAll(async () => {
  // Setup test database
  await env.DB.exec('CREATE TABLE IF NOT EXISTS users (...)')
})

beforeEach(async () => {
  // Clear database before each test
  await env.DB.exec('DELETE FROM users')
})

afterAll(async () => {
  // Cleanup
})
```

**Example Test**:
```typescript
// tests/api/tasks.test.ts
import { describe, it, expect } from 'vitest'
import app from '../../src/index'

describe('POST /api/tasks', () => {
  it('creates a task for authenticated user', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid_jwt_token'
      },
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Test Description'
      })
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.title).toBe('Test Task')
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' })
    })

    expect(res.status).toBe(401)
  })

  it('returns 400 with invalid data', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid_jwt_token'
      },
      body: JSON.stringify({
        title: '' // invalid: empty title
      })
    })

    expect(res.status).toBe(400)
  })
})
```

**Run**: `npm run test`

---

### 3. E2E Tests (Few) - Optional

**Purpose**: Test complete user workflows in real browser

**Tool**: Playwright

**What to test**:
- Authentication flow (sign up, sign in, sign out)
- Main CRUD workflows
- Critical paths (payments, exports, etc)

**Setup**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Example Test**:
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign in and create a task', async ({ page }) => {
  // Sign in
  await page.goto('http://localhost:5173')
  await page.click('text=Sign In')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/)

  // Create task
  await page.click('text=Create Task')
  await page.fill('input[name="title"]', 'New Task')
  await page.fill('textarea[name="description"]', 'Task description')
  await page.click('button:has-text("Save")')

  // Verify task appears
  await expect(page.locator('text=New Task')).toBeVisible()
})
```

**Run**: `npm run test:e2e`

---

## Test Coverage

**Target Coverage**: 70%+ for critical code

**What to cover**:
- ✅ All API routes
- ✅ All middleware
- ✅ Business logic and utilities
- ✅ Zod schemas (validation tests)
- ⚠️ React components (optional - prefer E2E for UI)

**Generate Coverage Report**:
```bash
npm run test -- --coverage
```

**View Report**: `coverage/index.html`

---

## Testing Checklist

Before marking a phase complete, verify:

### API Phase
- [ ] All endpoints return correct status codes (200, 400, 401, 404, 500)
- [ ] Request validation works (invalid data → 400)
- [ ] Authorization works (no token → 401, wrong user → 403)
- [ ] Database operations succeed
- [ ] Error handling catches exceptions

### UI Phase
- [ ] Forms validate input (Zod schemas)
- [ ] Forms show error messages
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Happy path works (create, read, update, delete)

### Integration Phase
- [ ] Third-party service integration works
- [ ] Webhooks fire correctly
- [ ] Error handling for external failures

---

## Manual Testing

**Automated tests don't catch everything**. Manually test:

### Before Each Deployment
- [ ] Sign in works
- [ ] Main workflows work (create, edit, delete)
- [ ] Forms validate correctly
- [ ] Errors display properly
- [ ] Dark/light mode works
- [ ] Mobile layout works

### Smoke Test Checklist
```
1. Visit homepage → Should load
2. Click Sign In → Should show Clerk modal
3. Sign in → Should redirect to dashboard
4. Create [resource] → Should appear in list
5. Edit [resource] → Changes should save
6. Delete [resource] → Should remove from list
7. Sign out → Should return to homepage
```

---

## Continuous Integration (CI)

**GitHub Actions** (optional):

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run test
      - run: npm run build
```

**Run tests on**:
- Every push
- Every pull request
- Before deployment

---

## Test Data

### Seed Data for Testing

Create `migrations/seed.sql` with realistic test data:

```sql
INSERT INTO users (email, clerk_id, display_name, created_at, updated_at)
VALUES
  ('alice@example.com', 'clerk_alice', 'Alice', strftime('%s', 'now'), strftime('%s', 'now')),
  ('bob@example.com', 'clerk_bob', 'Bob', strftime('%s', 'now'), strftime('%s', 'now'));

INSERT INTO tasks (user_id, title, description, created_at, updated_at)
VALUES
  (1, 'Review PR', 'Review the new feature PR', strftime('%s', 'now'), strftime('%s', 'now')),
  (1, 'Write tests', 'Add tests for API endpoints', strftime('%s', 'now'), strftime('%s', 'now')),
  (2, 'Deploy app', 'Deploy to production', strftime('%s', 'now'), strftime('%s', 'now'));
```

**Load seed data**:
```bash
npx wrangler d1 execute [DB_NAME] --local --file=migrations/seed.sql
```

---

## Testing Tools

### Installed
- **Vitest**: Unit and integration tests
- **@cloudflare/vitest-pool-workers**: Test Workers in Miniflare
- **@vitest/coverage-v8**: Code coverage

### Optional
- **Playwright**: E2E browser testing
- **@testing-library/react**: React component testing (if needed)
- **MSW**: Mock Service Worker (mock external APIs)

---

## Test Scripts

**package.json**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

**Run tests**:
```bash
npm run test              # Run all tests (watch mode)
npm run test:coverage     # Generate coverage report
npm run test:e2e          # Run E2E tests (Playwright)
```

---

## Debugging Tests

**Vitest UI** (visual test runner):
```bash
npm run test:ui
```

**Debug single test**:
```typescript
it.only('specific test', () => {
  // Only this test runs
})
```

**Console logs in tests**: They appear in terminal output

**Playwright debug mode**:
```bash
npx playwright test --debug
```

---

## Testing Best Practices

### ✅ Do

- **Arrange, Act, Assert** - Structure tests clearly
- **One assertion per test** (when possible)
- **Descriptive test names** - "should return 401 when token is missing"
- **Test edge cases** - Empty strings, null values, large numbers
- **Use realistic data** - Test with production-like data

### ❌ Don't

- **Test implementation details** - Internal state, private methods
- **Over-mock** - Use real database in integration tests
- **Brittle selectors** - Avoid testing specific CSS classes
- **Flaky tests** - Fix immediately or remove
- **Slow tests** - Optimize or move to E2E

---

## Test-Driven Development (TDD) - Optional

**For critical features**, consider writing tests first:

1. Write failing test
2. Implement feature (test passes)
3. Refactor
4. Repeat

**Benefits**: Better design, fewer bugs, built-in documentation

**When to use**: Complex business logic, critical paths, bug fixes

---

## Monitoring Test Health

**Metrics to track**:
- Test pass rate (should be 100%)
- Test coverage (target 70%+)
- Test execution time (keep fast)
- Flaky test count (should be 0)

**Weekly review**:
- Are tests passing?
- Is coverage dropping?
- Are tests slowing down?
- Any flaky tests to fix?

---

## Future Testing Enhancements

- [ ] Add visual regression testing (if needed)
- [ ] Add performance testing (if needed)
- [ ] Add accessibility testing (axe-core)
- [ ] Add API contract testing (Pact)

---

## Revision History

**v1.0** ([Date]): Initial testing strategy
**v1.1** ([Date]): [Changes made]
