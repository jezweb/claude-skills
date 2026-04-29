# Playwright Killer-Flow Tests

Audits find what's broken now. Tests prevent it from breaking again. After a v2 walkthrough surfaces the killer flows, write Playwright tests for them so regressions never ship silently.

This file is starter examples + patterns. Adapt to the project's stack (TanStack, Next.js, etc.) and CI setup.

## Why kill flow tests beat broader test suites

Most apps don't have time to write comprehensive E2E suites. The 80/20 is: write tests for the bugs that *would have hurt most* if they shipped. The 6 bugs found in vite-flare-starter on 2026-04-29 are exactly that class — each has a one-line Playwright assertion that would have blocked the deploy.

**Aim**: 10-15 tests, each ~10-30 lines, one per killer flow. Run on every deploy. Total runtime < 2 minutes.

## Where these tests live

Recommended file structure:

```
e2e/
  ├── critical-flows.spec.ts      # the killer flows
  ├── regression-tests.spec.ts    # tests added per regression caught
  ├── fixtures.ts                 # auth helpers, seed helpers
  └── playwright.config.ts        # config with retry, baseUrl, viewport
```

Run via `pnpm test:e2e` (or `npm`). CI runs on every PR and on every main push.

## Test patterns by bug class

### Pattern 1: "Action clears the trigger state"

Catches: send button doesn't clear input, save button doesn't reset form, submit-then-redirect leaves stale form data.

```ts
import { test, expect } from '@playwright/test';
import { signIn } from './fixtures';

test('spaces: send clears input', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard/spaces/test-space');

  const input = page.locator('textarea[placeholder*="message"]');
  await input.fill('hello world');
  await page.locator('button[aria-label="Send"]').click();

  // Critical assertion: input cleared within 1s
  await expect(input).toHaveValue('', { timeout: 1000 });
});
```

### Pattern 2: "Layout doesn't collapse"

Catches: vertical-text stacking, panel squeeze, min-content failures. Reproduces the multi-pane bug.

```ts
test('spaces: thread does not collapse timeline below readable width', async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/dashboard/spaces/test-space');

  // Open the members panel + the thread aside
  await page.locator('[data-pane-trigger="members"]').click();
  await page.locator('[data-message-id]').first().click();

  // The main column should never be < 200px wide
  const main = page.locator('main');
  const width = await main.evaluate(el => el.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(200);
});
```

Run this at multiple viewports to cover the full multi-pane stress matrix:

```ts
const viewports = [1024, 1280, 1440, 1920];

for (const vw of viewports) {
  test(`spaces: thread keeps timeline width at ${vw}px`, async ({ page }) => {
    await signIn(page);
    await page.setViewportSize({ width: vw, height: 800 });
    // ... same as above
    expect(width).toBeGreaterThan(200);
  });
}
```

### Pattern 3: "No console output during action"

Catches: lurking warnings, deprecation notices, protocol mismatches. The 2026-04-29 VoiceClient warning was visible weeks before the audit caught it.

```ts
test('chat: console emits no warnings on mount', async ({ page }) => {
  const messages: { type: string; text: string }[] = [];
  page.on('console', msg => {
    if (['warning', 'error'].includes(msg.type())) {
      messages.push({ type: msg.type(), text: msg.text() });
    }
  });

  await signIn(page);
  await page.goto('/dashboard/chat');
  await page.waitForLoadState('networkidle');

  // Allowlist known unfixable warnings (e.g. third-party tracker)
  const filtered = messages.filter(m => !m.text.includes('[allowed-warning]'));
  expect(filtered, JSON.stringify(filtered, null, 2)).toEqual([]);
});
```

### Pattern 4: "Single state transition counts correctly"

Catches: @-mention double-insert, optimistic UI duplicating items, double-click submission.

```ts
test('spaces: @-mention does not duplicate', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard/spaces/test-space');

  await page.locator('textarea').type('@ass');
  await page.locator('text=@assistant').first().click();

  // After picking, exactly one mention pill in the input parts
  const pills = page.locator('[data-slot="mention-pill"]');
  await expect(pills).toHaveCount(1);
});

test('spaces: send does not duplicate on double-click', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard/spaces/test-space');

  await page.locator('textarea').fill('test message');
  const send = page.locator('button[aria-label="Send"]');

  // Double-click in rapid succession
  await Promise.all([send.click(), send.click()]);

  // Only one new message appears
  await expect(page.locator('[data-message-id]:has-text("test message")')).toHaveCount(1, { timeout: 2000 });
});
```

### Pattern 5: "Network call succeeds with expected payload"

Catches: silent SDK contract violations, missing options, wrong endpoints.

```ts
test('approve action sends decision to server', async ({ page }) => {
  await signIn(page);

  let approvalRequest: any = null;
  page.on('request', req => {
    if (req.url().includes('/api/tool-approvals')) {
      approvalRequest = { method: req.method(), payload: req.postDataJSON() };
    }
  });

  await page.goto('/dashboard/chat');
  await page.locator('button:has-text("Approve")').first().click();

  // Verify request actually fired with the decision
  await expect.poll(() => approvalRequest).toBeTruthy();
  expect(approvalRequest.method).toBe('POST');
  expect(approvalRequest.payload).toMatchObject({ decision: 'approved' });
});
```

### Pattern 6: "First-time user can complete primary task"

Catches: onboarding gaps, mandatory fields without defaults, jargon labels. Directly maps to the first-time-user lens.

```ts
test('first-time user: can create their first space in 3 clicks', async ({ page }) => {
  // Use a fresh signup, not a seeded test account
  await page.goto('/signup');
  await page.locator('input[name="email"]').fill('audit-test@example.com');
  await page.locator('input[name="password"]').fill('audit-test-123!');
  await page.locator('button:has-text("Sign up")').click();

  await page.waitForURL(/\/dashboard/);

  // From the dashboard, count clicks to space creation
  let clickCount = 0;
  page.on('click', () => clickCount++);

  // The expected path
  await page.locator('button:has-text("Create space")').click();
  await page.locator('input[name="name"]').fill('My first space');
  await page.locator('button:has-text("Create")').click();

  // Verify the space exists
  await expect(page.locator('h1:has-text("My first space")')).toBeVisible({ timeout: 5000 });
  expect(clickCount).toBeLessThanOrEqual(3);
});
```

### Pattern 7: "Network response is observable to user"

Catches: 5xx on the wire that the user never sees.

```ts
test('save shows error toast on server failure', async ({ page }) => {
  await signIn(page);
  await page.route('**/api/settings', route => route.fulfill({ status: 500, body: 'server error' }));
  await page.goto('/dashboard/settings');

  await page.locator('button:has-text("Save")').click();

  // User MUST see the error
  await expect(page.locator('[role="alert"]')).toContainText(/error|failed|try again/i, { timeout: 3000 });
});
```

## Auth helpers (fixtures.ts)

```ts
import type { Page } from '@playwright/test';

export async function signIn(page: Page) {
  await page.goto('/signin');
  await page.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL ?? 'test@example.com');
  await page.locator('input[name="password"]').fill(process.env.TEST_USER_PASSWORD ?? 'test-password');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/);
}

export async function seedSpace(page: Page, name = 'test-space') {
  // POST to test-only seed endpoint, OR use UI flow.
  // ...
}
```

## Playwright config (playwright.config.ts)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'chromium-laptop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

## Seed-data strategy

Killer-flow tests need predictable state. Three strategies:

1. **Per-test setup via API** — call POST `/api/test/seed` (server-only test endpoint) to create the state needed
2. **Per-test setup via UI** — slower but tests the actual flow
3. **Snapshot DB** — restore a known DB state before each suite (heaviest, most reliable)

For Cloudflare Workers + D1, the `/api/test/seed` route gated behind a `TEST_MODE` env is usually fastest.

## CI integration

Recommended GitHub Actions setup:

```yaml
- name: Install Playwright
  run: pnpm exec playwright install --with-deps chromium

- name: Run E2E tests
  run: pnpm test:e2e
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

Run on every PR. Block merge on failure.

## Cadence — what to write tests for

Write a test the moment you find a bug that:
- Wasn't caught by the audit (audit failure → new test)
- Is "obvious in hindsight" (vertical text, send-not-clearing — these surfaces deserve tests forever)
- Touches money / data integrity / auth
- Has shipped twice in regression form (third regression must become a test)

Don't write tests for:
- Visual polish that's not load-bearing (use visual regression instead)
- Features that change weekly (test would churn faster than it adds value)
- Things that are obvious from a unit test (component API, function output)

## The audit-test virtuous cycle

The pattern that ships:

1. Audit (v2) finds a bug
2. Fix the bug
3. Write a Playwright killer-flow test that catches the bug
4. CI runs the test on every deploy
5. Bug never returns silently

This is the methodology shift the 2026-04-29 post-mortem advocates: from "ship, audit, find, fix" to "find before shipping". The audit produces the audit catalogue; the tests turn each entry into a regression gate.

After 6-12 months of disciplined application, the killer-flow suite is the most-trusted artifact in the project — it encodes every painful lesson the team has learned.
