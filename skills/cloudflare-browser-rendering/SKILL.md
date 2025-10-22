---
name: Cloudflare Browser Rendering
description: |
  Complete knowledge domain for Cloudflare Browser Rendering - Headless Chrome automation
  with Puppeteer and Playwright on Cloudflare Workers for screenshots, PDFs, web scraping,
  and browser automation workflows.

  Use when: taking screenshots, generating PDFs from HTML or URLs, web scraping content,
  crawling websites, browser automation tasks, testing web applications, managing browser sessions,
  performing batch browser operations, integrating with AI for content extraction, or encountering
  browser rendering errors, XPath selector errors, browser timeout issues, concurrency limits,
  memory exceeded errors, or "Cannot read properties of undefined (reading 'fetch')" errors.

  Keywords: browser rendering cloudflare, @cloudflare/puppeteer, @cloudflare/playwright,
  puppeteer workers, playwright workers, screenshot cloudflare, pdf generation workers,
  web scraping cloudflare, headless chrome workers, browser automation, puppeteer.launch,
  playwright.chromium.launch, browser binding, session management, puppeteer.sessions,
  puppeteer.connect, browser.close, browser.disconnect, XPath not supported, browser timeout,
  concurrency limit, keep_alive, page.screenshot, page.pdf, page.goto, page.evaluate,
  incognito context, session reuse, batch scraping, crawling websites
license: MIT
---

# Cloudflare Browser Rendering - Complete Reference

Production-ready knowledge domain for building browser automation workflows with Cloudflare Browser Rendering.

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: @cloudflare/puppeteer@1.0.4, @cloudflare/playwright@1.0.0, wrangler@4.43.0

---

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Browser Rendering Overview](#browser-rendering-overview)
3. [Puppeteer API Reference](#puppeteer-api-reference)
4. [Playwright API Reference](#playwright-api-reference)
5. [Session Management](#session-management)
6. [Common Patterns](#common-patterns)
7. [Pricing & Limits](#pricing--limits)
8. [Known Issues Prevention](#known-issues-prevention)
9. [Production Checklist](#production-checklist)

---

## Quick Start (5 minutes)

### 1. Add Browser Binding

**wrangler.jsonc:**
```jsonc
{
  "name": "browser-worker",
  "main": "src/index.ts",
  "compatibility_date": "2023-03-14",
  "compatibility_flags": ["nodejs_compat"],
  "browser": {
    "binding": "MYBROWSER"
  }
}
```

**Why nodejs_compat?** Browser Rendering requires Node.js APIs and polyfills.

### 2. Install Puppeteer

```bash
npm install @cloudflare/puppeteer
```

### 3. Take Your First Screenshot

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || "https://example.com";

    // Launch browser
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    // Navigate and capture
    await page.goto(url);
    const screenshot = await page.screenshot();

    // Clean up
    await browser.close();

    return new Response(screenshot, {
      headers: { "content-type": "image/png" }
    });
  }
};
```

### 4. Deploy

```bash
npx wrangler deploy
```

Test at: `https://your-worker.workers.dev/?url=https://example.com`

**CRITICAL:**
- Always pass `env.MYBROWSER` to `puppeteer.launch()` (not undefined)
- Always call `browser.close()` when done (or use `browser.disconnect()` for session reuse)
- Use `nodejs_compat` compatibility flag

---

## Browser Rendering Overview

### What is Browser Rendering?

Cloudflare Browser Rendering provides headless Chromium browsers running on Cloudflare's global network. Use familiar tools like Puppeteer and Playwright to automate browser tasks:

- **Screenshots** - Capture visual snapshots of web pages
- **PDF Generation** - Convert HTML/URLs to PDFs
- **Web Scraping** - Extract content from dynamic websites
- **Testing** - Automate frontend tests
- **Crawling** - Navigate multi-page workflows

### Two Integration Methods

| Method | Best For | Complexity |
|--------|----------|-----------|
| **Workers Bindings** | Complex automation, custom workflows, session management | Advanced |
| **REST API** | Simple screenshot/PDF tasks | Simple |

**This skill covers Workers Bindings** (the advanced method with full Puppeteer/Playwright APIs).

### Puppeteer vs Playwright

| Feature | Puppeteer | Playwright |
|---------|-----------|------------|
| **API Familiarity** | Most popular | Growing adoption |
| **Package** | `@cloudflare/puppeteer@1.0.4` | `@cloudflare/playwright@1.0.0` |
| **Session Management** | ✅ Advanced APIs | ⚠️ Basic |
| **Browser Support** | Chromium only | Chromium only (Firefox/Safari not yet supported) |
| **Best For** | Screenshots, PDFs, scraping | Testing, frontend automation |

**Recommendation**: Use Puppeteer for most use cases. Playwright is ideal if you're already using it for testing.

---

## Puppeteer API Reference

### puppeteer.launch()

Launch a new browser instance.

**Signature:**
```typescript
await puppeteer.launch(binding: Fetcher, options?: LaunchOptions): Promise<Browser>
```

**Parameters:**
- `binding` (required) - Browser binding from `env.MYBROWSER`
- `options` (optional):
  - `keep_alive` (number) - Keep browser alive for N milliseconds (max: 600000 = 10 minutes)

**Returns:** `Promise<Browser>` - Browser instance

**Example:**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER, {
  keep_alive: 60000 // Keep alive for 60 seconds
});
```

**CRITICAL:** Must pass `env.MYBROWSER` binding. Error "Cannot read properties of undefined (reading 'fetch')" means the binding wasn't passed.

---

### puppeteer.connect()

Connect to an existing browser session.

**Signature:**
```typescript
await puppeteer.connect(binding: Fetcher, sessionId: string): Promise<Browser>
```

**Use Cases:**
- Reuse existing browser sessions for performance
- Share browser instance across multiple Workers
- Reduce startup time

**Example:**
```typescript
const sessionId = "478f4d7d-e943-40f6-a414-837d3736a1dc";
const browser = await puppeteer.connect(env.MYBROWSER, sessionId);
```

---

### puppeteer.sessions()

List currently running browser sessions.

**Signature:**
```typescript
await puppeteer.sessions(binding: Fetcher): Promise<SessionInfo[]>
```

**Returns:**
```typescript
interface SessionInfo {
  sessionId: string;
  startTime: number;
  connectionId?: string;  // Present if worker is connected
  connectionStartTime?: number;
}
```

**Example:**
```typescript
const sessions = await puppeteer.sessions(env.MYBROWSER);
// Find sessions without active connections
const freeSessions = sessions.filter(s => !s.connectionId);
```

---

### puppeteer.history()

List recent sessions (both open and closed).

**Signature:**
```typescript
await puppeteer.history(binding: Fetcher): Promise<HistoryEntry[]>
```

**Returns:**
```typescript
interface HistoryEntry {
  sessionId: string;
  startTime: number;
  endTime?: number;
  closeReason?: number;
  closeReasonText?: string; // "NormalClosure", "BrowserIdle", etc.
}
```

**Use Case:** Monitor usage patterns and debug session issues.

---

### puppeteer.limits()

Check current account limits and available sessions.

**Signature:**
```typescript
await puppeteer.limits(binding: Fetcher): Promise<LimitsInfo>
```

**Returns:**
```typescript
interface LimitsInfo {
  activeSessions: Array<{ id: string }>;
  maxConcurrentSessions: number;
  allowedBrowserAcquisitions: number;
  timeUntilNextAllowedBrowserAcquisition: number; // milliseconds
}
```

**Example:**
```typescript
const limits = await puppeteer.limits(env.MYBROWSER);
if (limits.allowedBrowserAcquisitions === 0) {
  return new Response("Rate limit reached", { status: 429 });
}
```

---

### Browser API

Methods available on the `Browser` object returned by `launch()` or `connect()`.

#### browser.newPage()

Create a new page (tab) in the browser.

**Signature:**
```typescript
await browser.newPage(): Promise<Page>
```

**Example:**
```typescript
const page = await browser.newPage();
await page.goto("https://example.com");
```

**Performance Tip:** Reuse browser instances and open multiple tabs instead of launching new browsers.

---

#### browser.sessionId()

Get the current browser session ID.

**Returns:** `string` - Session ID

**Example:**
```typescript
const sessionId = browser.sessionId();
console.log("Current session:", sessionId);
```

---

#### browser.close()

Close the browser and terminate the session.

**Signature:**
```typescript
await browser.close(): Promise<void>
```

**When to use:** When you're completely done with the browser and want to free resources.

---

#### browser.disconnect()

Disconnect from the browser WITHOUT closing it.

**Signature:**
```typescript
await browser.disconnect(): Promise<void>
```

**When to use:** Session reuse - allows another Worker to connect to the same session later.

**Example:**
```typescript
// Keep session alive for reuse
const sessionId = browser.sessionId();
await browser.disconnect(); // Don't close, just disconnect
// Later: puppeteer.connect(env.MYBROWSER, sessionId)
```

---

#### browser.createBrowserContext()

Create an isolated incognito browser context.

**Signature:**
```typescript
await browser.createBrowserContext(): Promise<BrowserContext>
```

**Use Cases:**
- Isolate cookies and cache between operations
- Test multi-user scenarios
- Maintain session isolation while reusing browser

**Example:**
```typescript
const context1 = await browser.createBrowserContext();
const context2 = await browser.createBrowserContext();

const page1 = await context1.newPage();
const page2 = await context2.newPage();

// page1 and page2 have separate cookies/cache
```

---

### Page API

Methods available on the `Page` object returned by `browser.newPage()`.

#### page.goto()

Navigate to a URL.

**Signature:**
```typescript
await page.goto(url: string, options?: NavigationOptions): Promise<Response>
```

**Options:**
- `waitUntil` - When to consider navigation complete:
  - `"load"` - Wait for load event (default)
  - `"domcontentloaded"` - Wait for DOMContentLoaded
  - `"networkidle0"` - Wait until no network connections for 500ms
  - `"networkidle2"` - Wait until ≤2 network connections for 500ms
- `timeout` - Maximum navigation time in milliseconds (default: 30000)

**Example:**
```typescript
await page.goto("https://example.com", {
  waitUntil: "networkidle0",
  timeout: 60000
});
```

**Best Practice:** Use `"networkidle0"` for dynamic content, `"load"` for static pages.

---

#### page.screenshot()

Capture a screenshot of the page.

**Signature:**
```typescript
await page.screenshot(options?: ScreenshotOptions): Promise<Buffer>
```

**Options:**
- `fullPage` (boolean) - Capture full scrollable page (default: false)
- `type` (string) - `"png"` or `"jpeg"` (default: `"png"`)
- `quality` (number) - JPEG quality 0-100 (only for jpeg)
- `clip` (object) - Capture specific region: `{ x, y, width, height }`

**Examples:**
```typescript
// Full page screenshot
const screenshot = await page.screenshot({ fullPage: true });

// JPEG with compression
const screenshot = await page.screenshot({
  type: "jpeg",
  quality: 80
});

// Specific region
const screenshot = await page.screenshot({
  clip: { x: 0, y: 0, width: 800, height: 600 }
});
```

---

#### page.pdf()

Generate a PDF of the page.

**Signature:**
```typescript
await page.pdf(options?: PDFOptions): Promise<Buffer>
```

**Options:**
- `format` (string) - Page format: `"Letter"`, `"A4"`, etc.
- `printBackground` (boolean) - Include background graphics (default: false)
- `margin` (object) - `{ top, right, bottom, left }` (e.g., `"1cm"`)
- `landscape` (boolean) - Landscape orientation (default: false)
- `scale` (number) - Scale factor 0.1-2 (default: 1)

**Example:**
```typescript
const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
});

return new Response(pdf, {
  headers: { "content-type": "application/pdf" }
});
```

---

#### page.content()

Get the full HTML content of the page.

**Signature:**
```typescript
await page.content(): Promise<string>
```

**Example:**
```typescript
const html = await page.content();
console.log(html); // Full HTML source
```

---

#### page.setContent()

Set custom HTML content.

**Signature:**
```typescript
await page.setContent(html: string, options?: NavigationOptions): Promise<void>
```

**Use Case:** Generate PDFs from custom HTML.

**Example:**
```typescript
await page.setContent(`
  <!DOCTYPE html>
  <html>
    <head><style>body { font-family: Arial; }</style></head>
    <body><h1>Hello World</h1></body>
  </html>
`);

const pdf = await page.pdf({ format: "A4" });
```

---

#### page.evaluate()

Execute JavaScript in the browser context.

**Signature:**
```typescript
await page.evaluate<T>(fn: () => T): Promise<T>
```

**Use Cases:**
- Extract data from the DOM
- Manipulate page content
- Workaround for XPath (not directly supported)

**Examples:**
```typescript
// Extract text content
const title = await page.evaluate(() => document.title);

// Extract structured data
const data = await page.evaluate(() => ({
  title: document.title,
  url: window.location.href,
  headings: Array.from(document.querySelectorAll("h1, h2")).map(el => el.textContent),
  links: Array.from(document.querySelectorAll("a")).map(el => el.href)
}));

// XPath workaround (XPath selectors not directly supported)
const innerHtml = await page.evaluate(() => {
  return new XPathEvaluator()
    .createExpression("/html/body/div/h1")
    .evaluate(document, XPathResult.FIRST_ORDERED_NODE_TYPE)
    .singleNodeValue.innerHTML;
});
```

---

#### page.waitForSelector()

Wait for an element to appear in the DOM.

**Signature:**
```typescript
await page.waitForSelector(selector: string, options?: WaitForOptions): Promise<ElementHandle>
```

**Options:**
- `timeout` (number) - Maximum wait time in milliseconds
- `visible` (boolean) - Wait for element to be visible

**Example:**
```typescript
await page.goto("https://example.com");
await page.waitForSelector("#content", { visible: true });
const screenshot = await page.screenshot();
```

---

#### page.type()

Type text into an input field.

**Signature:**
```typescript
await page.type(selector: string, text: string): Promise<void>
```

**Example:**
```typescript
await page.type('input[name="email"]', 'user@example.com');
```

---

#### page.click()

Click an element.

**Signature:**
```typescript
await page.click(selector: string): Promise<void>
```

**Example:**
```typescript
await page.click('button[type="submit"]');
await page.waitForNavigation();
```

---

## Playwright API Reference

Playwright provides a similar API to Puppeteer with slight differences.

### Installation

```bash
npm install @cloudflare/playwright
```

### Basic Example

```typescript
import { env } from "cloudflare:test";
import { chromium } from "@cloudflare/playwright";

interface Env {
  BROWSER: Fetcher;
}

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

### Key Differences from Puppeteer

| Feature | Puppeteer | Playwright |
|---------|-----------|------------|
| **Import** | `import puppeteer from "@cloudflare/puppeteer"` | `import { chromium } from "@cloudflare/playwright"` |
| **Launch** | `puppeteer.launch(env.MYBROWSER)` | `chromium.launch(env.BROWSER)` |
| **Session API** | ✅ Advanced (sessions, history, limits) | ⚠️ Basic |
| **Auto-waiting** | Manual `waitForSelector()` | Built-in auto-waiting |
| **Selectors** | CSS only | CSS, text, XPath (via evaluate workaround) |

**Recommendation**: Stick with Puppeteer unless you have existing Playwright tests to migrate.

---

## Session Management

### Why Session Management Matters

**Problem**: Launching new browsers is slow and consumes concurrency limits.

**Solution**: Reuse browser sessions across requests.

**Benefits:**
- ⚡ Faster (no cold start)
- 💰 Lower concurrency usage
- 📊 Better resource utilization

---

### Session Reuse Pattern

```typescript
import puppeteer from "@cloudflare/puppeteer";

async function getBrowser(env: Env): Promise<{ browser: Browser; launched: boolean }> {
  // Check for available sessions
  const sessions = await puppeteer.sessions(env.MYBROWSER);
  const freeSessions = sessions.filter(s => !s.connectionId);

  if (freeSessions.length > 0) {
    // Reuse existing session
    try {
      const browser = await puppeteer.connect(env.MYBROWSER, freeSessions[0].sessionId);
      return { browser, launched: false };
    } catch (e) {
      console.log("Failed to connect, launching new browser");
    }
  }

  // Launch new session
  const browser = await puppeteer.launch(env.MYBROWSER);
  return { browser, launched: true };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { browser, launched } = await getBrowser(env);

    try {
      const page = await browser.newPage();
      await page.goto("https://example.com");
      const screenshot = await page.screenshot();

      // Disconnect (don't close) to allow reuse
      await browser.disconnect();

      return new Response(screenshot, {
        headers: { "content-type": "image/png" }
      });
    } catch (error) {
      await browser.close(); // Close on error
      throw error;
    }
  }
};
```

**CRITICAL:**
- Use `browser.disconnect()` to keep session alive
- Use `browser.close()` on errors
- Always handle connection failures

---

### Incognito Browser Contexts

Use browser contexts to isolate cookies and cache while sharing a browser instance.

**Benefits:**
- Share browser (reduce concurrency)
- Isolate sessions (separate cookies/cache)
- Test multi-user scenarios

**Example:**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER);

// Create isolated contexts
const context1 = await browser.createBrowserContext();
const context2 = await browser.createBrowserContext();

// Each context has its own cookies/cache
const page1 = await context1.newPage();
const page2 = await context2.newPage();

await page1.goto("https://app.example.com"); // User 1
await page2.goto("https://app.example.com"); // User 2

await context1.close();
await context2.close();
await browser.close();
```

---

### Multiple Tabs vs Multiple Browsers

**Scenario**: Scrape 10 URLs

**❌ Bad (10 browsers):**
```typescript
for (const url of urls) {
  const browser = await puppeteer.launch(env.MYBROWSER); // 10 launches!
  // ... scrape ...
  await browser.close();
}
```

**✅ Good (1 browser, 10 tabs):**
```typescript
const browser = await puppeteer.launch(env.MYBROWSER);

const results = await Promise.all(
  urls.map(async (url) => {
    const page = await browser.newPage();
    await page.goto(url);
    const data = await page.evaluate(() => ({
      title: document.title,
      text: document.body.innerText
    }));
    await page.close();
    return { url, data };
  })
);

await browser.close();
```

**Benefit**: Uses 1 concurrent browser instead of 10.

---

## Common Patterns

### Pattern 1: Screenshot with KV Caching

Cache screenshots to reduce browser usage and improve performance.

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
  CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("Missing ?url parameter", { status: 400 });
    }

    const normalizedUrl = new URL(url).toString();

    // Check cache
    let screenshot = await env.CACHE.get(normalizedUrl, { type: "arrayBuffer" });

    if (!screenshot) {
      // Generate screenshot
      const browser = await puppeteer.launch(env.MYBROWSER);
      const page = await browser.newPage();
      await page.goto(normalizedUrl);
      screenshot = await page.screenshot();
      await browser.close();

      // Cache for 24 hours
      await env.CACHE.put(normalizedUrl, screenshot, {
        expirationTtl: 60 * 60 * 24
      });
    }

    return new Response(screenshot, {
      headers: { "content-type": "image/png" }
    });
  }
};
```

---

### Pattern 2: PDF Generation from HTML

Convert custom HTML to PDF.

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { html } = await request.json<{ html: string }>();

    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    // Set custom HTML
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm"
      }
    });

    await browser.close();

    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename=document.pdf"
      }
    });
  }
};
```

---

### Pattern 3: Web Scraping with Structured Data

Extract structured data from web pages.

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

interface ProductData {
  title: string;
  price: string;
  description: string;
  image: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.goto(url!, { waitUntil: "networkidle0" });

    // Extract structured data
    const data = await page.evaluate<ProductData>(() => {
      return {
        title: document.querySelector("h1")?.textContent || "",
        price: document.querySelector(".price")?.textContent || "",
        description: document.querySelector(".description")?.textContent || "",
        image: document.querySelector("img")?.src || ""
      };
    });

    await browser.close();

    return Response.json({ url, data });
  }
};
```

---

### Pattern 4: Batch Scraping Multiple URLs

Efficiently scrape multiple URLs using tabs.

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

async function scrapeUrl(browser: Browser, url: string): Promise<any> {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    const data = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      text: document.body.innerText.slice(0, 500) // First 500 chars
    }));

    await page.close();
    return { success: true, url, data };
  } catch (error) {
    await page.close();
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { urls } = await request.json<{ urls: string[] }>();

    if (!urls || urls.length === 0) {
      return new Response("Missing urls array", { status: 400 });
    }

    const browser = await puppeteer.launch(env.MYBROWSER);

    // Scrape all URLs in parallel (each in its own tab)
    const results = await Promise.all(
      urls.map(url => scrapeUrl(browser, url))
    );

    await browser.close();

    return Response.json({ results });
  }
};
```

---

### Pattern 5: AI-Enhanced Scraping

Combine Browser Rendering with Workers AI to extract structured data.

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    // Scrape page content
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.goto(url!, { waitUntil: "networkidle0" });

    const bodyContent = await page.$eval("body", el => el.innerHTML);
    await browser.close();

    // Extract structured data with AI
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "user",
          content: `Extract product information as JSON from this HTML. Include: name, price, description, availability.\n\nHTML:\n${bodyContent.slice(0, 4000)}`
        }
      ]
    });

    // Parse AI response
    let productData;
    try {
      productData = JSON.parse(response.response);
    } catch {
      productData = { raw: response.response };
    }

    return Response.json({ url, product: productData });
  }
};
```

---

### Pattern 6: Form Filling and Automation

Automate form submissions and multi-step workflows.

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { email, password } = await request.json<{
      email: string;
      password: string;
    }>();

    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    // Navigate to login page
    await page.goto("https://example.com/login");

    // Fill form
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);

    // Submit and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Extract result
    const result = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      loggedIn: document.querySelector(".user-profile") !== null
    }));

    await browser.close();

    return Response.json(result);
  }
};
```

---

## Pricing & Limits

### Free Tier (Workers Free)

| Feature | Limit |
|---------|-------|
| **Browser Duration** | 10 minutes per day |
| **Concurrent Browsers** | 3 per account |
| **New Browsers per Minute** | 3 per minute |
| **REST API Requests** | 6 per minute |
| **Browser Timeout** | 60 seconds (idle) |

### Paid Tier (Workers Paid)

| Feature | Included | Beyond Included |
|---------|----------|-----------------|
| **Browser Duration** | 10 hours per month | $0.09 per additional browser hour |
| **Concurrent Browsers** | 10 (monthly average) | $2.00 per additional concurrent browser |
| **New Browsers per Minute** | 30 per minute | Request higher limit |
| **REST API Requests** | 180 per minute | Request higher limit |
| **Browser Timeout** | 60 seconds (can extend to 10 minutes with `keep_alive`) | - |
| **Max Concurrent Browsers** | 30 per account | Request higher limit |

### Pricing Calculation

**Duration Charges:**
- Charged per browser hour
- Rounded to nearest hour at end of billing cycle
- Failed requests (timeouts) are NOT charged

**Concurrency Charges:**
- Monthly average of daily peak usage
- Example: 10 browsers for 15 days, 20 browsers for 15 days = (10×15 + 20×15) / 30 = 15 average
- 15 average - 10 included = 5 × $2.00 = $10.00

**Example Monthly Bill:**
- 50 browser hours used: (50 - 10) × $0.09 = $3.60
- 15 concurrent browsers average: (15 - 10) × $2.00 = $10.00
- **Total: $13.60**

### Rate Limiting

**Per-Second Rate:**
Rate limits are enforced per-second. Example:
- 180 requests per minute = 3 requests per second
- You cannot send all 180 at once; they must be spread evenly

**Handling Rate Limits:**
```typescript
async function launchWithRetry(env: Env, maxRetries = 3): Promise<Browser> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await puppeteer.launch(env.MYBROWSER);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Check if rate limited
      const limits = await puppeteer.limits(env.MYBROWSER);
      if (limits.allowedBrowserAcquisitions === 0) {
        // Wait before retry
        const delay = limits.timeUntilNextAllowedBrowserAcquisition || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error("Failed to launch browser");
}
```

---

## Known Issues Prevention

This skill prevents **6 documented issues**:

---

### Issue #1: XPath Selectors Not Supported

**Error:** "XPath selector not supported" or selector failures
**Source:** https://developers.cloudflare.com/browser-rendering/faq/#why-cant-i-use-an-xpath-selector-when-using-browser-rendering-with-puppeteer
**Why It Happens:** XPath poses a security risk to Workers
**Prevention:** Use CSS selectors or `page.evaluate()` with XPathEvaluator

**Solution:**
```typescript
// ❌ Don't use XPath directly (not supported)
// await page.$x('/html/body/div/h1')

// ✅ Use CSS selector
const heading = await page.$("div > h1");

// ✅ Or use XPath in page.evaluate()
const innerHtml = await page.evaluate(() => {
  return new XPathEvaluator()
    .createExpression("/html/body/div/h1")
    .evaluate(document, XPathResult.FIRST_ORDERED_NODE_TYPE)
    .singleNodeValue.innerHTML;
});
```

---

### Issue #2: Browser Binding Not Passed

**Error:** "Cannot read properties of undefined (reading 'fetch')"
**Source:** https://developers.cloudflare.com/browser-rendering/faq/#cannot-read-properties-of-undefined-reading-fetch
**Why It Happens:** `puppeteer.launch()` called without browser binding
**Prevention:** Always pass `env.MYBROWSER` to launch

**Solution:**
```typescript
// ❌ Missing browser binding
const browser = await puppeteer.launch(); // Error!

// ✅ Pass binding
const browser = await puppeteer.launch(env.MYBROWSER);
```

---

### Issue #3: Browser Timeout (60 seconds)

**Error:** Browser closes unexpectedly after 60 seconds
**Source:** https://developers.cloudflare.com/browser-rendering/platform/limits/#note-on-browser-timeout
**Why It Happens:** Default timeout is 60 seconds of inactivity
**Prevention:** Use `keep_alive` option to extend up to 10 minutes

**Solution:**
```typescript
// Extend timeout to 5 minutes for long-running tasks
const browser = await puppeteer.launch(env.MYBROWSER, {
  keep_alive: 300000 // 5 minutes = 300,000 ms
});
```

**Note:** Browser closes if no devtools commands for the specified duration.

---

### Issue #4: Concurrency Limits Reached

**Error:** "Rate limit exceeded" or new browser launch fails
**Source:** https://developers.cloudflare.com/browser-rendering/platform/limits/
**Why It Happens:** Exceeded concurrent browser limit (3 free, 10-30 paid)
**Prevention:** Reuse sessions, use tabs instead of multiple browsers, check limits before launching

**Solutions:**
```typescript
// 1. Check limits before launching
const limits = await puppeteer.limits(env.MYBROWSER);
if (limits.allowedBrowserAcquisitions === 0) {
  return new Response("Concurrency limit reached", { status: 429 });
}

// 2. Reuse sessions
const sessions = await puppeteer.sessions(env.MYBROWSER);
const freeSessions = sessions.filter(s => !s.connectionId);
if (freeSessions.length > 0) {
  const browser = await puppeteer.connect(env.MYBROWSER, freeSessions[0].sessionId);
}

// 3. Use tabs instead of multiple browsers
const browser = await puppeteer.launch(env.MYBROWSER);
const page1 = await browser.newPage();
const page2 = await browser.newPage(); // Same browser, different tabs
```

---

### Issue #5: Local Development Request Size Limit

**Error:** Request larger than 1MB fails in `wrangler dev`
**Source:** https://developers.cloudflare.com/browser-rendering/faq/#does-local-development-support-all-browser-rendering-features
**Why It Happens:** Local development limitation
**Prevention:** Use `remote: true` in browser binding for local dev

**Solution:**
```jsonc
// wrangler.jsonc for local development
{
  "browser": {
    "binding": "MYBROWSER",
    "remote": true  // Use real headless browser during dev
  }
}
```

---

### Issue #6: Bot Protection Always Triggered

**Error:** Website blocks requests as bot traffic
**Source:** https://developers.cloudflare.com/browser-rendering/faq/#will-browser-rendering-bypass-cloudflares-bot-protection
**Why It Happens:** Browser Rendering requests always identified as bots
**Prevention:** Cannot bypass; if scraping your own zone, create WAF skip rule

**Solution:**
```typescript
// ❌ Cannot bypass bot protection
// Requests will always be identified as bots

// ✅ If scraping your own Cloudflare zone:
// 1. Go to Security > WAF > Custom rules
// 2. Create skip rule with custom header:
//    Header: X-Custom-Auth
//    Value: your-secret-token
// 3. Pass header in your scraping requests

// Note: Automatic headers are included:
// - cf-biso-request-id
// - cf-biso-devtools
```

---

## Production Checklist

Before deploying Browser Rendering Workers to production:

### Configuration
- [ ] **Browser binding configured** in wrangler.jsonc
- [ ] **nodejs_compat flag enabled** (required for Browser Rendering)
- [ ] **Keep-alive timeout set** if tasks take > 60 seconds
- [ ] **Remote binding enabled** for local development if needed

### Error Handling
- [ ] **Retry logic implemented** for rate limits
- [ ] **Timeout handling** for page.goto()
- [ ] **Browser cleanup** in try-finally blocks
- [ ] **Concurrency limit checks** before launching browsers
- [ ] **Graceful degradation** when browser unavailable

### Performance
- [ ] **Session reuse implemented** for high-traffic routes
- [ ] **Multiple tabs used** instead of multiple browsers
- [ ] **Incognito contexts** for session isolation
- [ ] **KV caching** for repeated screenshots/PDFs
- [ ] **Batch operations** to maximize browser utilization

### Monitoring
- [ ] **Log browser session IDs** for debugging
- [ ] **Track browser duration** for billing estimates
- [ ] **Monitor concurrency usage** with puppeteer.limits()
- [ ] **Alert on rate limit errors**
- [ ] **Dashboard monitoring** at https://dash.cloudflare.com/?to=/:account/workers/browser-rendering

### Security
- [ ] **Input validation** for URLs (prevent SSRF)
- [ ] **Timeout limits** to prevent abuse
- [ ] **Rate limiting** on public endpoints
- [ ] **Authentication** for sensitive scraping endpoints
- [ ] **WAF rules** if scraping your own zone

### Testing
- [ ] **Test screenshot capture** with various page sizes
- [ ] **Test PDF generation** with custom HTML
- [ ] **Test scraping** with dynamic content (networkidle0)
- [ ] **Test error scenarios** (invalid URLs, timeouts)
- [ ] **Load test** concurrency limits

---

## Error Handling Template

Complete error handling for production use:

```typescript
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

async function withBrowser<T>(
  env: Env,
  fn: (browser: Browser) => Promise<T>
): Promise<T> {
  let browser: Browser | null = null;

  try {
    // Check limits
    const limits = await puppeteer.limits(env.MYBROWSER);
    if (limits.allowedBrowserAcquisitions === 0) {
      throw new Error("Rate limit reached. Retry after: " + limits.timeUntilNextAllowedBrowserAcquisition + "ms");
    }

    // Launch or connect
    const sessions = await puppeteer.sessions(env.MYBROWSER);
    const freeSessions = sessions.filter(s => !s.connectionId);

    if (freeSessions.length > 0) {
      try {
        browser = await puppeteer.connect(env.MYBROWSER, freeSessions[0].sessionId);
      } catch {
        browser = await puppeteer.launch(env.MYBROWSER);
      }
    } else {
      browser = await puppeteer.launch(env.MYBROWSER);
    }

    // Execute user function
    const result = await fn(browser);

    // Disconnect (keep session alive)
    await browser.disconnect();

    return result;
  } catch (error) {
    // Close on error
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const screenshot = await withBrowser(env, async (browser) => {
        const page = await browser.newPage();
        await page.goto("https://example.com", {
          waitUntil: "networkidle0",
          timeout: 30000
        });
        return await page.screenshot();
      });

      return new Response(screenshot, {
        headers: { "content-type": "image/png" }
      });
    } catch (error) {
      console.error("Browser error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  }
};
```

---

## Using Bundled Resources

### Templates (templates/)

Ready-to-use code templates for common patterns:

- `basic-screenshot.ts` - Minimal screenshot example
- `screenshot-with-kv-cache.ts` - Screenshot with KV caching
- `pdf-generation.ts` - Generate PDFs from HTML or URLs
- `web-scraper-basic.ts` - Basic web scraping pattern
- `web-scraper-batch.ts` - Batch scrape multiple URLs
- `session-reuse.ts` - Session reuse for performance
- `ai-enhanced-scraper.ts` - Scraping with Workers AI
- `playwright-example.ts` - Playwright alternative example
- `wrangler-browser-config.jsonc` - Browser binding configuration

**Usage:**
```bash
# Copy template to your project
cp ~/.claude/skills/cloudflare-browser-rendering/templates/basic-screenshot.ts src/index.ts
```

### References (references/)

Deep-dive documentation:

- `session-management.md` - Complete session reuse guide
- `pricing-and-limits.md` - Detailed pricing breakdown
- `common-errors.md` - All known issues and solutions
- `puppeteer-vs-playwright.md` - Feature comparison and migration

**When to load:** Reference when implementing advanced patterns or debugging specific issues.

---

## Dependencies

**Required:**
- `@cloudflare/puppeteer@1.0.4` - Puppeteer for Workers
- `wrangler@4.43.0+` - Cloudflare CLI

**Optional:**
- `@cloudflare/playwright@1.0.0` - Playwright for Workers (alternative)
- `@cloudflare/workers-types@4.20251014.0+` - TypeScript types

**Related Skills:**
- `cloudflare-worker-base` - Worker setup with Hono
- `cloudflare-kv` - KV caching for screenshots
- `cloudflare-r2` - R2 storage for generated files
- `cloudflare-workers-ai` - AI-enhanced scraping

---

## Official Documentation

- **Browser Rendering Docs**: https://developers.cloudflare.com/browser-rendering/
- **Puppeteer API**: https://pptr.dev/api/
- **Playwright API**: https://playwright.dev/docs/api/class-playwright
- **Cloudflare Puppeteer Fork**: https://github.com/cloudflare/puppeteer
- **Cloudflare Playwright Fork**: https://github.com/cloudflare/playwright
- **Pricing**: https://developers.cloudflare.com/browser-rendering/platform/pricing/
- **Limits**: https://developers.cloudflare.com/browser-rendering/platform/limits/

---

## Package Versions (Verified 2025-10-22)

```json
{
  "dependencies": {
    "@cloudflare/puppeteer": "^1.0.4"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20251014.0",
    "wrangler": "^4.43.0"
  }
}
```

**Alternative (Playwright):**
```json
{
  "dependencies": {
    "@cloudflare/playwright": "^1.0.0"
  }
}
```

---

## Troubleshooting

### Problem: "Cannot read properties of undefined (reading 'fetch')"
**Solution:** Pass browser binding to puppeteer.launch():
```typescript
const browser = await puppeteer.launch(env.MYBROWSER); // Not just puppeteer.launch()
```

### Problem: XPath selectors not working
**Solution:** Use CSS selectors or page.evaluate() with XPathEvaluator (see Issue #1)

### Problem: Browser closes after 60 seconds
**Solution:** Extend timeout with keep_alive:
```typescript
const browser = await puppeteer.launch(env.MYBROWSER, { keep_alive: 300000 });
```

### Problem: Rate limit reached
**Solution:** Reuse sessions, use tabs, check limits before launching (see Issue #4)

### Problem: Local dev request > 1MB fails
**Solution:** Enable remote binding in wrangler.jsonc:
```jsonc
{ "browser": { "binding": "MYBROWSER", "remote": true } }
```

### Problem: Website blocks as bot
**Solution:** Cannot bypass. If your own zone, create WAF skip rule (see Issue #6)

---

**Questions? Issues?**

1. Check `references/common-errors.md` for detailed solutions
2. Review `references/session-management.md` for performance optimization
3. Verify browser binding is configured in wrangler.jsonc
4. Check official docs: https://developers.cloudflare.com/browser-rendering/
5. Ensure `nodejs_compat` compatibility flag is enabled
