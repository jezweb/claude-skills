# Common Errors and Solutions

Complete reference for all known Browser Rendering errors with sources, root causes, and solutions.

---

## Error 1: "Cannot read properties of undefined (reading 'fetch')"

**Full Error:**
```
TypeError: Cannot read properties of undefined (reading 'fetch')
```

**Source**: https://developers.cloudflare.com/browser-rendering/faq/#cannot-read-properties-of-undefined-reading-fetch

**Root Cause**: Browser binding not passed to `puppeteer.launch()`

**Why It Happens:**
```typescript
// ❌ Missing browser binding
const browser = await puppeteer.launch();
//                                    ^ undefined - no binding passed!
```

**Solution:**
```typescript
// ✅ Pass browser binding
const browser = await puppeteer.launch(env.MYBROWSER);
//                                    ^^^^^^^^^^^^^^^^ binding from env
```

**Prevention**: Always pass `env.MYBROWSER` (or your configured binding name) to `puppeteer.launch()`.

---

## Error 2: XPath Selector Not Supported

**Full Error:**
```
Error: XPath selectors are not supported in Browser Rendering
```

**Source**: https://developers.cloudflare.com/browser-rendering/faq/#why-cant-i-use-an-xpath-selector-when-using-browser-rendering-with-puppeteer

**Root Cause**: XPath poses security risk to Workers

**Why It Happens:**
```typescript
// ❌ XPath selectors not directly supported
const elements = await page.$x('/html/body/div/h1');
```

**Solution 1: Use CSS Selectors**
```typescript
// ✅ Use CSS selector instead
const element = await page.$("div > h1");
const elements = await page.$$("div > h1");
```

**Solution 2: Use XPath in page.evaluate()**
```typescript
// ✅ Use XPath inside page.evaluate()
const innerHtml = await page.evaluate(() => {
  return (
    // @ts-ignore - runs in browser context
    new XPathEvaluator()
      .createExpression("/html/body/div/h1")
      // @ts-ignore
      .evaluate(document, XPathResult.FIRST_ORDERED_NODE_TYPE)
      .singleNodeValue.innerHTML
  );
});
```

**Prevention**: Use CSS selectors by default. Only use XPath via `page.evaluate()` if absolutely necessary.

---

## Error 3: Browser Timeout

**Full Error:**
```
Error: Browser session closed due to inactivity
```

**Source**: https://developers.cloudflare.com/browser-rendering/platform/limits/#note-on-browser-timeout

**Root Cause**: Default 60 second idle timeout

**Why It Happens:**
- No devtools commands sent for 60 seconds
- Browser automatically closes to free resources

**Solution: Extend Timeout**
```typescript
// ✅ Extend timeout to 5 minutes
const browser = await puppeteer.launch(env.MYBROWSER, {
  keep_alive: 300000  // 5 minutes = 300,000 ms
});
```

**Maximum**: 600,000ms (10 minutes)

**Use Cases for Extended Timeout:**
- Multi-step workflows
- Long-running scraping
- Session reuse across requests

**Prevention**: Only extend if actually needed. Longer timeout = more billable hours.

---

## Error 4: Rate Limit Exceeded

**Full Error:**
```
Error: Rate limit exceeded. Too many concurrent browsers.
```

**Source**: https://developers.cloudflare.com/browser-rendering/platform/limits/

**Root Cause**: Exceeded concurrent browser limit

**Limits:**
- Free tier: 3 concurrent browsers
- Paid tier: 10-30 concurrent browsers

**Solution 1: Check Limits Before Launching**
```typescript
const limits = await puppeteer.limits(env.MYBROWSER);

if (limits.allowedBrowserAcquisitions === 0) {
  return new Response(
    JSON.stringify({
      error: "Rate limit reached",
      retryAfter: limits.timeUntilNextAllowedBrowserAcquisition
    }),
    { status: 429 }
  );
}

const browser = await puppeteer.launch(env.MYBROWSER);
```

**Solution 2: Reuse Sessions**
```typescript
// Try to connect to existing session first
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
```

**Solution 3: Use Multiple Tabs**
```typescript
// ❌ Bad: 10 browsers
for (const url of urls) {
  const browser = await puppeteer.launch(env.MYBROWSER);
  // ...
}

// ✅ Good: 1 browser, 10 tabs
const browser = await puppeteer.launch(env.MYBROWSER);
await Promise.all(urls.map(async url => {
  const page = await browser.newPage();
  // ...
  await page.close();
}));
await browser.close();
```

**Prevention**: Monitor concurrency usage, implement session reuse, use tabs instead of multiple browsers.

---

## Error 5: Local Development Request Size Limit

**Full Error:**
```
Error: Request payload too large (>1MB)
```

**Source**: https://developers.cloudflare.com/browser-rendering/faq/#does-local-development-support-all-browser-rendering-features

**Root Cause**: Local development limitation (requests >1MB fail)

**Solution: Use Remote Binding**
```jsonc
// wrangler.jsonc
{
  "browser": {
    "binding": "MYBROWSER",
    "remote": true  // ← Use real headless browser during dev
  }
}
```

**With Remote Binding:**
- Connects to actual Cloudflare browser (not local simulation)
- No 1MB request limit
- Counts toward your quota

**Prevention**: Enable `remote: true` for local development if working with large payloads.

---

## Error 6: Bot Protection Triggered

**Full Error:**
```
Blocked by bot protection / CAPTCHA challenge
```

**Source**: https://developers.cloudflare.com/browser-rendering/faq/#will-browser-rendering-bypass-cloudflares-bot-protection

**Root Cause**: Browser Rendering requests always identified as bots

**Why It Happens:**
- Cloudflare automatically identifies Browser Rendering traffic
- Cannot bypass bot protection
- Automatic headers added: `cf-biso-request-id`, `cf-biso-devtools`

**Solution (If Scraping Your Own Zone):**
Create WAF skip rule:

1. Go to Security > WAF > Custom rules
2. Create skip rule with custom header:
   - Header: `X-Custom-Auth`
   - Value: `your-secret-token`
3. Add header in your Worker:

```typescript
const browser = await puppeteer.launch(env.MYBROWSER);
const page = await browser.newPage();

// Set custom header
await page.setExtraHTTPHeaders({
  "X-Custom-Auth": "your-secret-token"
});

await page.goto(url);
```

**Solution (If Scraping External Sites):**
- Cannot bypass bot protection
- Some sites will block Browser Rendering traffic
- Consider using site's official API instead

**Prevention**: Use official APIs when available. Only scrape your own zones if possible.

---

## Error 7: Navigation Timeout

**Full Error:**
```
TimeoutError: Navigation timeout of 30000 ms exceeded
```

**Root Cause**: Page failed to load within timeout

**Why It Happens:**
- Slow website
- Large page assets
- Network issues
- Page never reaches desired load state

**Solution 1: Increase Timeout**
```typescript
await page.goto(url, {
  timeout: 60000  // 60 seconds
});
```

**Solution 2: Change Wait Condition**
```typescript
// ❌ Strict (waits for all network requests)
await page.goto(url, { waitUntil: "networkidle0" });

// ✅ More lenient (waits for DOMContentLoaded)
await page.goto(url, { waitUntil: "domcontentloaded" });

// ✅ Most lenient (waits for load event only)
await page.goto(url, { waitUntil: "load" });
```

**Solution 3: Handle Timeout Gracefully**
```typescript
try {
  await page.goto(url, { timeout: 30000 });
} catch (error) {
  if (error instanceof Error && error.name === "TimeoutError") {
    console.log("Navigation timeout, taking screenshot anyway");
    const screenshot = await page.screenshot();
    return screenshot;
  }
  throw error;
}
```

**Prevention**: Set appropriate timeouts for your use case. Use lenient wait conditions for slow sites.

---

## Error 8: Memory Limit Exceeded

**Full Error:**
```
Error: Browser exceeded its memory limit
```

**Root Cause**: Page too large or too many tabs open

**Why It Happens:**
- Opening many tabs simultaneously
- Large pages with many assets
- Memory leaks from not closing pages

**Solution 1: Close Pages**
```typescript
const page = await browser.newPage();
// ... use page ...
await page.close();  // ← Don't forget!
```

**Solution 2: Limit Concurrent Tabs**
```typescript
import PQueue from "p-queue";

const browser = await puppeteer.launch(env.MYBROWSER);
const queue = new PQueue({ concurrency: 5 }); // Max 5 tabs

await Promise.all(urls.map(url =>
  queue.add(async () => {
    const page = await browser.newPage();
    await page.goto(url);
    // ...
    await page.close();
  })
));
```

**Solution 3: Use Smaller Viewports**
```typescript
await page.setViewport({
  width: 1280,
  height: 720  // Smaller than default
});
```

**Prevention**: Always close pages when done. Limit concurrent tabs. Process URLs in batches.

---

## Error 9: Failed to Connect to Session

**Full Error:**
```
Error: Failed to connect to browser session
```

**Root Cause**: Session closed between `.sessions()` and `.connect()` calls

**Why It Happens:**
- Session timed out (60s idle)
- Session closed by another Worker
- Session terminated unexpectedly

**Solution: Handle Connection Failures**
```typescript
const sessions = await puppeteer.sessions(env.MYBROWSER);
const freeSession = sessions.find(s => !s.connectionId);

if (freeSession) {
  try {
    const browser = await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
    return browser;
  } catch (error) {
    console.log("Failed to connect to session, launching new browser");
  }
}

// Fall back to launching new browser
return await puppeteer.launch(env.MYBROWSER);
```

**Prevention**: Always wrap `puppeteer.connect()` in try-catch. Have fallback to `puppeteer.launch()`.

---

## Error 10: Too Many Requests Per Minute

**Full Error:**
```
Error: Too many browser launches per minute
```

**Root Cause**: Exceeded "new browsers per minute" limit

**Limits:**
- Free tier: 3 per minute (1 every 20 seconds)
- Paid tier: 30 per minute (1 every 2 seconds)

**Solution: Implement Rate Limiting**
```typescript
async function launchWithRateLimit(env: Env): Promise<Browser> {
  const limits = await puppeteer.limits(env.MYBROWSER);

  if (limits.allowedBrowserAcquisitions === 0) {
    const delay = limits.timeUntilNextAllowedBrowserAcquisition || 2000;
    console.log(`Rate limited, waiting ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return await puppeteer.launch(env.MYBROWSER);
}
```

**Prevention**: Check limits before launching. Implement exponential backoff. Reuse sessions instead of launching new browsers.

---

## Error 11: Binding Not Configured

**Full Error:**
```
Error: Browser binding not found
```

**Root Cause**: Browser binding not configured in wrangler.jsonc

**Solution: Add Browser Binding**
```jsonc
// wrangler.jsonc
{
  "browser": {
    "binding": "MYBROWSER"
  },
  "compatibility_flags": ["nodejs_compat"]
}
```

**Also Add to TypeScript Types:**
```typescript
interface Env {
  MYBROWSER: Fetcher;
}
```

**Prevention**: Always configure browser binding and nodejs_compat flag.

---

## Error 12: nodejs_compat Flag Missing

**Full Error:**
```
Error: Node.js APIs not available
```

**Root Cause**: `nodejs_compat` compatibility flag not enabled

**Solution: Add Compatibility Flag**
```jsonc
// wrangler.jsonc
{
  "compatibility_flags": ["nodejs_compat"]
}
```

**Why It's Required:**
Browser Rendering needs Node.js APIs and polyfills to work.

**Prevention**: Always include `nodejs_compat` when using Browser Rendering.

---

## Error Handling Template

Complete error handling for production use:

```typescript
import puppeteer, { Browser } from "@cloudflare/puppeteer";

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
      throw new Error(
        `Rate limit reached. Retry after ${limits.timeUntilNextAllowedBrowserAcquisition}ms`
      );
    }

    // Try to reuse session
    const sessions = await puppeteer.sessions(env.MYBROWSER);
    const freeSession = sessions.find(s => !s.connectionId);

    if (freeSession) {
      try {
        browser = await puppeteer.connect(env.MYBROWSER, freeSession.sessionId);
      } catch (error) {
        console.log("Failed to connect, launching new browser");
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

    // Re-throw with context
    if (error instanceof Error) {
      error.message = `Browser operation failed: ${error.message}`;
    }
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const screenshot = await withBrowser(env, async (browser) => {
        const page = await browser.newPage();

        try {
          await page.goto("https://example.com", {
            waitUntil: "networkidle0",
            timeout: 30000
          });
        } catch (error) {
          if (error instanceof Error && error.name === "TimeoutError") {
            console.log("Navigation timeout, taking screenshot anyway");
          } else {
            throw error;
          }
        }

        return await page.screenshot();
      });

      return new Response(screenshot, {
        headers: { "content-type": "image/png" }
      });
    } catch (error) {
      console.error("Request failed:", error);

      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" }
        }
      );
    }
  }
};
```

---

## Debugging Checklist

When encountering browser errors:

1. **Check browser binding**
   - [ ] Binding configured in wrangler.jsonc?
   - [ ] nodejs_compat flag enabled?
   - [ ] Binding passed to puppeteer.launch()?

2. **Check limits**
   - [ ] Within concurrent browser limit?
   - [ ] Within new browsers/minute limit?
   - [ ] Call puppeteer.limits() to verify?

3. **Check timeouts**
   - [ ] Navigation timeout appropriate?
   - [ ] Browser keep_alive set if needed?
   - [ ] Timeout errors handled gracefully?

4. **Check session management**
   - [ ] browser.close() called on errors?
   - [ ] Pages closed when done?
   - [ ] Session reuse implemented correctly?

5. **Check network**
   - [ ] Target URL accessible?
   - [ ] No CORS/bot protection issues?
   - [ ] Appropriate wait conditions used?

---

## References

- **FAQ**: https://developers.cloudflare.com/browser-rendering/faq/
- **Limits**: https://developers.cloudflare.com/browser-rendering/platform/limits/
- **GitHub Issues**: https://github.com/cloudflare/puppeteer/issues
- **Discord**: https://discord.cloudflare.com/

---

**Last Updated**: 2025-10-22
