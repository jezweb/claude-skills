# Puppeteer vs Playwright Comparison

Complete comparison guide for choosing between @cloudflare/puppeteer and @cloudflare/playwright.

---

## Quick Recommendation

**Use Puppeteer if:**
- ✅ Starting a new project
- ✅ Need session management features
- ✅ Want to optimize performance/costs
- ✅ Building screenshot/PDF services
- ✅ Web scraping workflows

**Use Playwright if:**
- ✅ Already have Playwright tests to migrate
- ✅ Prefer auto-waiting behavior
- ✅ Don't need advanced session features
- ✅ Want cross-browser APIs (even if only Chromium supported now)

**Bottom Line**: **Puppeteer is recommended** for most Browser Rendering use cases.

---

## Package Installation

### Puppeteer
```bash
npm install @cloudflare/puppeteer
```

**Version**: 1.0.4 (based on Puppeteer v23.x)

### Playwright
```bash
npm install @cloudflare/playwright
```

**Version**: 1.0.0 (based on Playwright v1.55.0)

---

## API Comparison

### Launching a Browser

**Puppeteer:**
```typescript
import puppeteer from "@cloudflare/puppeteer";

const browser = await puppeteer.launch(env.MYBROWSER);
```

**Playwright:**
```typescript
import { chromium } from "@cloudflare/playwright";

const browser = await chromium.launch(env.BROWSER);
```

**Key Difference**: Playwright uses `chromium.launch()` (browser-specific), Puppeteer uses `puppeteer.launch()` (generic).

---

### Basic Screenshot Example

**Puppeteer:**
```typescript
import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.goto("https://example.com");
    const screenshot = await page.screenshot();
    await browser.close();

    return new Response(screenshot, {
      headers: { "content-type": "image/png" }
    });
  }
};
```

**Playwright:**
```typescript
import { chromium } from "@cloudflare/playwright";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await chromium.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.goto("https://example.com");
    const screenshot = await page.screenshot();
    await browser.close();

    return new Response(screenshot, {
      headers: { "content-type": "image/png" }
    });
  }
};
```

**Key Difference**: Nearly identical! Main difference is import and launch method.

---

## Feature Comparison

| Feature | Puppeteer | Playwright | Notes |
|---------|-----------|------------|-------|
| **Basic Screenshots** | ✅ Yes | ✅ Yes | Both support PNG/JPEG |
| **PDF Generation** | ✅ Yes | ✅ Yes | Identical API |
| **Page Navigation** | ✅ Yes | ✅ Yes | Similar API |
| **Element Selectors** | CSS only | CSS, text | Playwright has more selector types |
| **Auto-waiting** | ❌ Manual | ✅ Built-in | Playwright waits for elements automatically |
| **Session Management** | ✅ Advanced | ⚠️ Basic | Puppeteer has .sessions(), .history(), .limits() |
| **Session Reuse** | ✅ Yes | ⚠️ Limited | Puppeteer has .connect() with sessionId |
| **Browser Contexts** | ✅ Yes | ✅ Yes | Both support incognito contexts |
| **Multiple Tabs** | ✅ Yes | ✅ Yes | Both support multiple pages |
| **Network Interception** | ✅ Yes | ✅ Yes | Similar APIs |
| **Geolocation** | ✅ Yes | ✅ Yes | Similar APIs |
| **Emulation** | ✅ Yes | ✅ Yes | Device emulation, viewport |
| **Browser Support** | Chromium only | Chromium only | Firefox/Safari not yet supported |
| **TypeScript Types** | ✅ Yes | ✅ Yes | Both fully typed |

---

## Session Management

### Puppeteer (Advanced)

```typescript
// List active sessions
const sessions = await puppeteer.sessions(env.MYBROWSER);

// Find free session
const freeSession = sessions.find(s => !s.connectionId);

// Connect to existing session
if (freeSession) {
  const browser = await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
}

// Check limits
const limits = await puppeteer.limits(env.MYBROWSER);
console.log("Can launch:", limits.allowedBrowserAcquisitions > 0);

// View history
const history = await puppeteer.history(env.MYBROWSER);
```

**Puppeteer APIs:**
- ✅ `puppeteer.sessions()` - List active sessions
- ✅ `puppeteer.connect()` - Connect to session by ID
- ✅ `puppeteer.history()` - View recent sessions
- ✅ `puppeteer.limits()` - Check account limits
- ✅ `browser.sessionId()` - Get current session ID
- ✅ `browser.disconnect()` - Disconnect without closing

---

### Playwright (Basic)

```typescript
// Launch browser
const browser = await chromium.launch(env.BROWSER);

// Get session info (basic)
// Note: No .sessions(), .history(), or .limits() APIs
```

**Playwright APIs:**
- ❌ No `chromium.sessions()` equivalent
- ❌ No session reuse APIs
- ❌ No limits checking
- ❌ No session history

**Workaround**: Use Puppeteer-style session management via REST API (more complex).

---

## Auto-Waiting Behavior

### Puppeteer (Manual)

```typescript
// Must explicitly wait for elements
await page.goto("https://example.com");
await page.waitForSelector("button#submit");
await page.click("button#submit");
```

**Pros**: Fine-grained control

**Cons**: More verbose, easy to forget waits

---

### Playwright (Auto-waiting)

```typescript
// Automatically waits for elements
await page.goto("https://example.com");
await page.click("button#submit");  // Waits automatically!
```

**Pros**: Less boilerplate, fewer timing issues

**Cons**: Less control over wait behavior

---

## Selector Support

### Puppeteer

**Supported:**
- CSS selectors: `"button#submit"`, `"div > p"`
- `:visible`, `:hidden` pseudo-classes
- `page.$()`, `page.$$()` for querying

**Not Supported:**
- XPath selectors (use `page.evaluate()` workaround)
- Text selectors
- Layout selectors

**Example:**
```typescript
// CSS selector
const button = await page.$("button#submit");

// XPath workaround
const heading = await page.evaluate(() => {
  return new XPathEvaluator()
    .createExpression("//h1[@class='title']")
    .evaluate(document, XPathResult.FIRST_ORDERED_NODE_TYPE)
    .singleNodeValue.textContent;
});
```

---

### Playwright

**Supported:**
- CSS selectors: `"button#submit"`
- Text selectors: `"text=Submit"`
- XPath selectors: `"xpath=//button"`
- Layout selectors: `"button :right-of(:text('Cancel'))"`

**Example:**
```typescript
// CSS selector
await page.click("button#submit");

// Text selector
await page.click("text=Submit");

// Combined selector
await page.click("button >> text=Submit");
```

**Advantage**: More flexible selector options

---

## Performance & Cost

### Puppeteer (Optimized)

**Session Reuse:**
```typescript
// Reuse sessions to reduce costs
const sessions = await puppeteer.sessions(env.MYBROWSER);
const browser = await puppeteer.connect(env.MYBROWSER, sessionId);
await browser.disconnect(); // Keep alive
```

**Cost Impact:**
- ✅ Reduce cold starts by 50-70%
- ✅ Lower concurrency charges
- ✅ Better throughput

---

### Playwright (Limited Optimization)

**No Session Reuse:**
```typescript
// Must launch new browser each time
const browser = await chromium.launch(env.BROWSER);
await browser.close(); // Cannot keep alive for reuse
```

**Cost Impact:**
- ❌ Higher browser hours (cold starts every request)
- ❌ Higher concurrency usage
- ❌ Lower throughput

**Difference**: ~30-50% higher costs with Playwright vs optimized Puppeteer.

---

## API Differences

| Operation | Puppeteer | Playwright |
|-----------|-----------|------------|
| **Import** | `import puppeteer from "@cloudflare/puppeteer"` | `import { chromium } from "@cloudflare/playwright"` |
| **Launch** | `puppeteer.launch(env.MYBROWSER)` | `chromium.launch(env.BROWSER)` |
| **Connect** | `puppeteer.connect(env.MYBROWSER, sessionId)` | ❌ Not available |
| **Sessions** | `puppeteer.sessions(env.MYBROWSER)` | ❌ Not available |
| **Limits** | `puppeteer.limits(env.MYBROWSER)` | ❌ Not available |
| **Goto** | `page.goto(url, { waitUntil: "networkidle0" })` | `page.goto(url, { waitUntil: "networkidle" })` |
| **Screenshot** | `page.screenshot({ fullPage: true })` | `page.screenshot({ fullPage: true })` |
| **PDF** | `page.pdf({ format: "A4" })` | `page.pdf({ format: "A4" })` |
| **Wait** | `page.waitForSelector("button")` | `page.locator("button").waitFor()` |
| **Click** | `page.click("button")` | `page.click("button")` (auto-waits) |

---

## Migration Guide

### Puppeteer → Playwright

```typescript
// Before (Puppeteer)
import puppeteer from "@cloudflare/puppeteer";

const browser = await puppeteer.launch(env.MYBROWSER);
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle0" });
await page.waitForSelector("button#submit");
await page.click("button#submit");
const screenshot = await page.screenshot();
await browser.close();
```

```typescript
// After (Playwright)
import { chromium } from "@cloudflare/playwright";

const browser = await chromium.launch(env.BROWSER);
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle" });
// No waitForSelector needed - auto-waits
await page.click("button#submit");
const screenshot = await page.screenshot();
await browser.close();
```

**Changes:**
1. Import: `puppeteer` → `{ chromium }`
2. Launch: `puppeteer.launch()` → `chromium.launch()`
3. Wait: `networkidle0` → `networkidle`
4. Remove explicit `waitForSelector()` (auto-waits)

---

### Playwright → Puppeteer

```typescript
// Before (Playwright)
import { chromium } from "@cloudflare/playwright";

const browser = await chromium.launch(env.BROWSER);
const page = await browser.newPage();
await page.goto(url);
await page.click("button#submit"); // Auto-waits
```

```typescript
// After (Puppeteer)
import puppeteer from "@cloudflare/puppeteer";

const browser = await puppeteer.launch(env.MYBROWSER);
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle0" });
await page.waitForSelector("button#submit"); // Explicit wait
await page.click("button#submit");
```

**Changes:**
1. Import: `{ chromium }` → `puppeteer`
2. Launch: `chromium.launch()` → `puppeteer.launch()`
3. Add explicit waits: `page.waitForSelector()`
4. Specify wait conditions: `waitUntil: "networkidle0"`

---

## Use Case Recommendations

### Screenshot Service
**Winner**: **Puppeteer**

**Reason**: Session reuse reduces costs by 30-50%

```typescript
// Puppeteer: Reuse sessions
const sessions = await puppeteer.sessions(env.MYBROWSER);
const browser = await puppeteer.connect(env.MYBROWSER, sessionId);
await browser.disconnect(); // Keep alive
```

---

### PDF Generation
**Winner**: **Tie**

**Reason**: Identical API, no session reuse benefit

```typescript
// Both have same API
const pdf = await page.pdf({ format: "A4" });
```

---

### Web Scraping
**Winner**: **Puppeteer**

**Reason**: Session management + limit checking

```typescript
// Puppeteer: Check limits before scraping
const limits = await puppeteer.limits(env.MYBROWSER);
if (limits.allowedBrowserAcquisitions === 0) {
  await delay(limits.timeUntilNextAllowedBrowserAcquisition);
}
```

---

### Test Migration
**Winner**: **Playwright**

**Reason**: Easier to migrate existing Playwright tests

```typescript
// Minimal changes needed
// Just update imports and launch
```

---

### Interactive Automation
**Winner**: **Tie**

**Reason**: Both support form filling, clicking, etc.

---

## Configuration

### wrangler.jsonc (Puppeteer)

```jsonc
{
  "browser": {
    "binding": "MYBROWSER"
  },
  "compatibility_flags": ["nodejs_compat"]
}
```

```typescript
interface Env {
  MYBROWSER: Fetcher;
}
```

---

### wrangler.jsonc (Playwright)

```jsonc
{
  "browser": {
    "binding": "BROWSER"
  },
  "compatibility_flags": ["nodejs_compat"]
}
```

```typescript
interface Env {
  BROWSER: Fetcher;
}
```

**Note**: Binding name is arbitrary, but convention is `MYBROWSER` for Puppeteer and `BROWSER` for Playwright.

---

## Production Considerations

### Puppeteer Advantages
- ✅ Session reuse (30-50% cost savings)
- ✅ Limit checking (`puppeteer.limits()`)
- ✅ Session monitoring (`puppeteer.sessions()`, `.history()`)
- ✅ Better performance optimization options
- ✅ More mature Cloudflare fork

### Playwright Advantages
- ✅ Auto-waiting (less code)
- ✅ More selector types
- ✅ Better cross-browser APIs (future-proof)
- ✅ Easier migration from existing tests

---

## Recommendation Summary

| Scenario | Recommended | Reason |
|----------|-------------|--------|
| New project | **Puppeteer** | Session management + cost optimization |
| Screenshot service | **Puppeteer** | Session reuse saves 30-50% |
| PDF generation | **Tie** | Identical API |
| Web scraping | **Puppeteer** | Limit checking + session management |
| Migrating Playwright tests | **Playwright** | Minimal changes needed |
| High traffic production | **Puppeteer** | Better performance optimization |
| Quick prototype | **Tie** | Both easy to start with |

---

## Code Examples

### Puppeteer (Production-Optimized)

```typescript
import puppeteer, { Browser } from "@cloudflare/puppeteer";

async function getBrowser(env: Env): Promise<Browser> {
  // Check limits
  const limits = await puppeteer.limits(env.MYBROWSER);
  if (limits.allowedBrowserAcquisitions === 0) {
    throw new Error("Rate limit reached");
  }

  // Try to reuse session
  const sessions = await puppeteer.sessions(env.MYBROWSER);
  const freeSession = sessions.find(s => !s.connectionId);

  if (freeSession) {
    try {
      return await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
    } catch {
      // Session closed, launch new
    }
  }

  return await puppeteer.launch(env.MYBROWSER);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await getBrowser(env);

    try {
      const page = await browser.newPage();
      await page.goto("https://example.com", {
        waitUntil: "networkidle0",
        timeout: 30000
      });
      const screenshot = await page.screenshot();

      // Disconnect (keep alive)
      await browser.disconnect();

      return new Response(screenshot, {
        headers: { "content-type": "image/png" }
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
};
```

---

### Playwright (Simple)

```typescript
import { chromium } from "@cloudflare/playwright";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await chromium.launch(env.BROWSER);

    try {
      const page = await browser.newPage();
      await page.goto("https://example.com", {
        waitUntil: "networkidle",
        timeout: 30000
      });
      const screenshot = await page.screenshot();

      await browser.close();

      return new Response(screenshot, {
        headers: { "content-type": "image/png" }
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
};
```

---

## References

- **Puppeteer Docs**: https://pptr.dev/
- **Playwright Docs**: https://playwright.dev/
- **Cloudflare Puppeteer Fork**: https://github.com/cloudflare/puppeteer
- **Cloudflare Playwright Fork**: https://github.com/cloudflare/playwright
- **Browser Rendering Docs**: https://developers.cloudflare.com/browser-rendering/

---

**Last Updated**: 2025-10-22
