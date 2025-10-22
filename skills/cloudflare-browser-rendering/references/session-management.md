# Session Management Guide

Complete guide to browser session management for performance optimization and concurrency handling.

---

## Why Session Management Matters

**The Problem:**
- Launching new browsers is slow (~2-3 seconds cold start)
- Each launch consumes concurrency quota
- Free tier: Only 3 concurrent browsers
- Paid tier: 10-30 concurrent browsers (costs $2/browser beyond included)

**The Solution:**
- Reuse browser sessions across requests
- Use multiple tabs instead of multiple browsers
- Check limits before launching
- Disconnect (don't close) to keep sessions alive

**Benefits:**
- ⚡ **50-70% faster** (no cold start)
- 💰 **Lower costs** (reduced concurrency charges)
- 📊 **Better utilization** (one browser, many tabs)

---

## Session Lifecycle

```
1. Launch → Browser session created (session ID assigned)
2. Connected → Worker actively using browser
3. Disconnected → Session idle, available for reuse
4. Timeout → Session closed after 60s idle (configurable)
5. Closed → Session terminated (must launch new one)
```

### Session States

| State | Description | Can Connect? |
|-------|-------------|--------------|
| **Active with connection** | Worker is using browser | ❌ No (occupied) |
| **Active without connection** | Browser idle, waiting | ✅ Yes (available) |
| **Closed** | Session terminated | ❌ No (gone) |

---

## Session Management API

### puppeteer.sessions()

List all currently running browser sessions.

**Signature:**
```typescript
await puppeteer.sessions(binding: Fetcher): Promise<SessionInfo[]>
```

**Response:**
```typescript
interface SessionInfo {
  sessionId: string;           // Unique session ID
  startTime: number;           // Unix timestamp (ms)
  connectionId?: string;       // Present if worker is connected
  connectionStartTime?: number;
}
```

**Example:**
```typescript
const sessions = await puppeteer.sessions(env.MYBROWSER);

// Find free sessions (no active connection)
const freeSessions = sessions.filter(s => !s.connectionId);

// Find occupied sessions
const occupiedSessions = sessions.filter(s => s.connectionId);

console.log({
  total: sessions.length,
  available: freeSessions.length,
  occupied: occupiedSessions.length
});
```

**Output:**
```json
[
  {
    "sessionId": "478f4d7d-e943-40f6-a414-837d3736a1dc",
    "startTime": 1711621703708,
    "connectionId": "2a2246fa-e234-4dc1-8433-87e6cee80145",
    "connectionStartTime": 1711621704607
  },
  {
    "sessionId": "565e05fb-4d2a-402b-869b-5b65b1381db7",
    "startTime": 1711621703808
  }
]
```

**Interpretation:**
- Session `478f4d...` is **occupied** (has connectionId)
- Session `565e05...` is **available** (no connectionId)

---

### puppeteer.history()

List recent sessions, both open and closed.

**Signature:**
```typescript
await puppeteer.history(binding: Fetcher): Promise<HistoryEntry[]>
```

**Response:**
```typescript
interface HistoryEntry {
  sessionId: string;
  startTime: number;
  endTime?: number;           // Present if closed
  closeReason?: number;       // Numeric close code
  closeReasonText?: string;   // Human-readable reason
}
```

**Close Reasons:**
- `"NormalClosure"` - Explicitly closed with browser.close()
- `"BrowserIdle"` - Timeout due to 60s idle period
- `"Unknown"` - Unexpected closure

**Example:**
```typescript
const history = await puppeteer.history(env.MYBROWSER);

history.forEach(entry => {
  const duration = entry.endTime
    ? (entry.endTime - entry.startTime) / 1000
    : 'still running';

  console.log({
    sessionId: entry.sessionId,
    duration: `${duration}s`,
    closeReason: entry.closeReasonText || 'N/A'
  });
});
```

**Use Cases:**
- Monitor browser usage patterns
- Debug unexpected closures
- Track session lifetimes
- Estimate costs

---

### puppeteer.limits()

Check current account limits and session availability.

**Signature:**
```typescript
await puppeteer.limits(binding: Fetcher): Promise<LimitsInfo>
```

**Response:**
```typescript
interface LimitsInfo {
  activeSessions: Array<{ id: string }>;
  maxConcurrentSessions: number;
  allowedBrowserAcquisitions: number;        // Can launch now?
  timeUntilNextAllowedBrowserAcquisition: number; // ms to wait
}
```

**Example:**
```typescript
const limits = await puppeteer.limits(env.MYBROWSER);

console.log({
  active: limits.activeSessions.length,
  max: limits.maxConcurrentSessions,
  canLaunch: limits.allowedBrowserAcquisitions > 0,
  waitTime: limits.timeUntilNextAllowedBrowserAcquisition
});
```

**Output:**
```json
{
  "activeSessions": [
    { "id": "478f4d7d-e943-40f6-a414-837d3736a1dc" },
    { "id": "565e05fb-4d2a-402b-869b-5b65b1381db7" }
  ],
  "allowedBrowserAcquisitions": 1,
  "maxConcurrentSessions": 10,
  "timeUntilNextAllowedBrowserAcquisition": 0
}
```

**Interpretation:**
- 2 sessions currently active
- Maximum 10 concurrent sessions allowed
- Can launch 1 more browser now
- No wait time required

---

### puppeteer.connect()

Connect to an existing browser session.

**Signature:**
```typescript
await puppeteer.connect(binding: Fetcher, sessionId: string): Promise<Browser>
```

**Example:**
```typescript
const sessions = await puppeteer.sessions(env.MYBROWSER);
const freeSession = sessions.find(s => !s.connectionId);

if (freeSession) {
  try {
    const browser = await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
    console.log("Connected to existing session:", browser.sessionId());
  } catch (error) {
    console.log("Connection failed, session may have closed");
  }
}
```

**Error Handling:**
Session may close between `.sessions()` call and `.connect()` call. Always wrap in try-catch.

---

### browser.sessionId()

Get the current browser's session ID.

**Signature:**
```typescript
browser.sessionId(): string
```

**Example:**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER);
const sessionId = browser.sessionId();
console.log("Current session:", sessionId);
```

---

### browser.disconnect()

Disconnect from browser WITHOUT closing it.

**Signature:**
```typescript
await browser.disconnect(): Promise<void>
```

**When to use:**
- Want to reuse session later
- Keep browser warm for next request
- Reduce cold start times

**Example:**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER);
const sessionId = browser.sessionId();

// Do work
const page = await browser.newPage();
await page.goto("https://example.com");

// Disconnect (keep alive)
await browser.disconnect();

// Later: reconnect
const browserAgain = await puppeteer.connect(env.MYBROWSER, sessionId);
```

**Important:**
- Browser will still timeout after 60s idle (use `keep_alive` to extend)
- Session remains in your concurrent browser count
- Other workers CAN connect to this session

---

### browser.close()

Close the browser and terminate the session.

**Signature:**
```typescript
await browser.close(): Promise<void>
```

**When to use:**
- Done with browser completely
- Want to free concurrency slot
- Error occurred during processing

**Example:**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER);

try {
  // Do work
} catch (error) {
  await browser.close(); // Clean up on error
  throw error;
}

await browser.close(); // Normal cleanup
```

---

## Session Reuse Patterns

### Pattern 1: Simple Reuse

```typescript
async function getBrowser(env: Env): Promise<Browser> {
  // Try to connect to existing session
  const sessions = await puppeteer.sessions(env.MYBROWSER);
  const freeSession = sessions.find(s => !s.connectionId);

  if (freeSession) {
    try {
      return await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
    } catch {
      // Session closed, launch new one
    }
  }

  // Launch new browser
  return await puppeteer.launch(env.MYBROWSER);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await getBrowser(env);

    // Do work
    const page = await browser.newPage();
    // ...

    // Disconnect (keep alive)
    await browser.disconnect();

    return response;
  }
};
```

---

### Pattern 2: Reuse with Limits Check

```typescript
async function getBrowserSafe(env: Env): Promise<Browser> {
  const sessions = await puppeteer.sessions(env.MYBROWSER);
  const freeSession = sessions.find(s => !s.connectionId);

  if (freeSession) {
    try {
      return await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
    } catch {
      // Continue to launch
    }
  }

  // Check limits before launching
  const limits = await puppeteer.limits(env.MYBROWSER);

  if (limits.allowedBrowserAcquisitions === 0) {
    throw new Error(
      `Rate limit reached. Retry after ${limits.timeUntilNextAllowedBrowserAcquisition}ms`
    );
  }

  return await puppeteer.launch(env.MYBROWSER);
}
```

---

### Pattern 3: Retry with Backoff

```typescript
async function getBrowserWithRetry(
  env: Env,
  maxRetries = 3
): Promise<Browser> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Try existing session first
      const sessions = await puppeteer.sessions(env.MYBROWSER);
      const freeSession = sessions.find(s => !s.connectionId);

      if (freeSession) {
        try {
          return await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
        } catch {
          // Continue to launch
        }
      }

      // Check limits
      const limits = await puppeteer.limits(env.MYBROWSER);

      if (limits.allowedBrowserAcquisitions > 0) {
        return await puppeteer.launch(env.MYBROWSER);
      }

      // Rate limited, wait and retry
      if (i < maxRetries - 1) {
        const delay = Math.min(
          limits.timeUntilNextAllowedBrowserAcquisition,
          Math.pow(2, i) * 1000 // Exponential backoff
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }

  throw new Error("Failed to acquire browser after retries");
}
```

---

## Browser Timeout Management

### Default Timeout

Browsers close after **60 seconds of inactivity** (no devtools commands).

**Inactivity means:**
- No `page.goto()`
- No `page.screenshot()`
- No `page.evaluate()`
- No other browser/page operations

### Extending Timeout with keep_alive

```typescript
const browser = await puppeteer.launch(env.MYBROWSER, {
  keep_alive: 300000  // 5 minutes = 300,000 ms
});
```

**Maximum:** 600,000ms (10 minutes)

**Use Cases:**
- Long-running scraping workflows
- Multi-step form automation
- Session reuse across multiple requests

**Cost Impact:**
- Longer keep_alive = more browser hours billed
- Only extend if actually needed

---

## Incognito Browser Contexts

Use browser contexts to isolate cookies/cache while sharing a browser.

**Benefits:**
- 1 concurrent browser instead of N
- Separate cookies/cache per context
- Test multi-user scenarios
- Session isolation

**Example:**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER);

// Create isolated contexts
const context1 = await browser.createBrowserContext();
const context2 = await browser.createBrowserContext();

// Each context has separate state
const page1 = await context1.newPage();
const page2 = await context2.newPage();

await page1.goto("https://app.example.com"); // User 1
await page2.goto("https://app.example.com"); // User 2

// page1 and page2 have separate cookies
await context1.close();
await context2.close();
await browser.close();
```

---

## Multiple Tabs vs Multiple Browsers

### ❌ Bad: Multiple Browsers

```typescript
// Uses 10 concurrent browsers!
for (const url of urls) {
  const browser = await puppeteer.launch(env.MYBROWSER);
  const page = await browser.newPage();
  await page.goto(url);
  await browser.close();
}
```

**Problems:**
- 10x concurrency usage
- 10x cold start delays
- May hit concurrency limits

---

### ✅ Good: Multiple Tabs

```typescript
// Uses 1 concurrent browser
const browser = await puppeteer.launch(env.MYBROWSER);

const results = await Promise.all(
  urls.map(async (url) => {
    const page = await browser.newPage();
    await page.goto(url);
    const data = await page.evaluate(() => ({
      title: document.title
    }));
    await page.close();
    return data;
  })
);

await browser.close();
```

**Benefits:**
- 1 concurrent browser (10x reduction)
- Faster (no repeated cold starts)
- Cheaper (reduced concurrency charges)

---

## Monitoring and Debugging

### Log Session Activity

```typescript
const browser = await puppeteer.launch(env.MYBROWSER);
const sessionId = browser.sessionId();

console.log({
  event: "browser_launched",
  sessionId,
  timestamp: Date.now()
});

// Do work

await browser.disconnect();

console.log({
  event: "browser_disconnected",
  sessionId,
  timestamp: Date.now()
});
```

### Track Session Metrics

```typescript
interface SessionMetrics {
  sessionId: string;
  launched: boolean;  // true = new, false = reused
  duration: number;   // ms
  operations: number; // page navigations
}

async function trackSession(env: Env, fn: (browser: Browser) => Promise<void>) {
  const start = Date.now();
  const sessions = await puppeteer.sessions(env.MYBROWSER);
  const freeSession = sessions.find(s => !s.connectionId);

  let browser: Browser;
  let launched: boolean;

  if (freeSession) {
    browser = await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
    launched = false;
  } else {
    browser = await puppeteer.launch(env.MYBROWSER);
    launched = true;
  }

  await fn(browser);

  const metrics: SessionMetrics = {
    sessionId: browser.sessionId(),
    launched,
    duration: Date.now() - start,
    operations: 1  // Track actual operations in production
  };

  await browser.disconnect();

  return metrics;
}
```

---

## Production Best Practices

1. **Always Check Limits**
   - Call `puppeteer.limits()` before launching
   - Handle rate limit errors gracefully
   - Implement retry with backoff

2. **Prefer Session Reuse**
   - Try `puppeteer.connect()` first
   - Fall back to `puppeteer.launch()` only if needed
   - Use `browser.disconnect()` instead of `browser.close()`

3. **Use Multiple Tabs**
   - One browser, many tabs
   - Reduces concurrency usage 10-50x
   - Faster than multiple browsers

4. **Set Appropriate Timeouts**
   - Default 60s is fine for most use cases
   - Extend only if actually needed (keep_alive)
   - Remember: longer timeout = more billable hours

5. **Handle Errors**
   - Always `browser.close()` on errors
   - Wrap `puppeteer.connect()` in try-catch
   - Gracefully handle rate limits

6. **Monitor Usage**
   - Log session IDs
   - Track reuse rate
   - Monitor concurrency in dashboard

7. **Use Incognito Contexts**
   - Isolate sessions while sharing browser
   - Better than multiple browsers
   - Test multi-user scenarios safely

---

## Cost Optimization

### Scenario: Screenshot Service (1000 requests/hour)

**Bad Approach (No Session Reuse):**
- Launch new browser for each request
- 1000 browsers/hour
- Average session: 5 seconds
- Browser hours: (1000 * 5) / 3600 = 1.39 hours
- Average concurrency: ~14 browsers
- **Cost**: 1.39 hours = $0.13 + (14-10) * $2 = $8.13/hour

**Good Approach (Session Reuse):**
- Maintain pool of 3-5 warm browsers
- Reuse sessions across requests
- Average session: 1 hour (keep_alive)
- Browser hours: 5 hours (5 browsers * 1 hour)
- Average concurrency: 5 browsers
- **Cost**: 5 hours = $0.45/hour

**Savings: 94%** ($8.13 → $0.45)

---

## Common Issues

### Issue: "Failed to connect to session"

**Cause:** Session closed between `.sessions()` and `.connect()` calls

**Solution:**
```typescript
const freeSession = sessions.find(s => !s.connectionId);
if (freeSession) {
  try {
    return await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
  } catch (error) {
    console.log("Session closed, launching new browser");
    return await puppeteer.launch(env.MYBROWSER);
  }
}
```

### Issue: Sessions timing out too quickly

**Cause:** Default 60s idle timeout

**Solution:** Extend with keep_alive:
```typescript
const browser = await puppeteer.launch(env.MYBROWSER, {
  keep_alive: 300000  // 5 minutes
});
```

### Issue: Rate limit reached

**Cause:** Too many concurrent browsers or launches per minute

**Solution:** Check limits before launching:
```typescript
const limits = await puppeteer.limits(env.MYBROWSER);
if (limits.allowedBrowserAcquisitions === 0) {
  return new Response("Rate limit reached", { status: 429 });
}
```

---

## Reference

- **Official Docs**: https://developers.cloudflare.com/browser-rendering/workers-bindings/reuse-sessions/
- **Limits**: https://developers.cloudflare.com/browser-rendering/platform/limits/
- **Pricing**: https://developers.cloudflare.com/browser-rendering/platform/pricing/

---

**Last Updated**: 2025-10-22
