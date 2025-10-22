# Cloudflare Browser Rendering Skill

**Auto-Discovery Skill for Claude Code CLI**

Complete knowledge domain for Cloudflare Browser Rendering - Headless Chrome automation with Puppeteer and Playwright on Cloudflare Workers.

---

## Auto-Trigger Keywords

Claude will automatically suggest this skill when you mention any of these keywords:

### Primary Triggers (Technologies)
- browser rendering
- cloudflare browser rendering
- @cloudflare/puppeteer
- @cloudflare/playwright
- puppeteer workers
- playwright workers
- headless chrome workers
- headless browser cloudflare
- browser automation cloudflare
- browser binding
- puppeteer.launch
- chromium.launch

### Secondary Triggers (Use Cases)
- screenshot cloudflare
- screenshot workers
- take screenshot puppeteer
- pdf generation workers
- generate pdf puppeteer
- web scraping cloudflare
- scrape website workers
- crawl website puppeteer
- browser automation
- headless testing
- puppeteer screenshot
- playwright screenshot

### Commands & API Triggers
- puppeteer.launch
- puppeteer.connect
- puppeteer.sessions
- puppeteer.history
- puppeteer.limits
- browser.newPage
- browser.sessionId
- browser.close
- browser.disconnect
- browser.createBrowserContext
- page.goto
- page.screenshot
- page.pdf
- page.evaluate
- page.waitForSelector
- page.type
- page.click
- incognito context
- browser tabs
- session reuse

### Configuration Triggers
- wrangler browser binding
- nodejs_compat browser
- browser binding config
- remote browser binding
- keep_alive option

### Error-Based Triggers
- "Cannot read properties of undefined (reading 'fetch')"
- "XPath selector not supported"
- "XPath not supported"
- browser timeout
- browser closed unexpectedly
- concurrency limit reached
- rate limit browser
- too many browsers
- browser memory limit
- "statement too long" puppeteer
- "Network connection lost"
- bot protection triggered
- request larger than 1MB

---

## What This Skill Does

- ✅ Configures browser bindings in wrangler.jsonc with nodejs_compat
- ✅ Launches Puppeteer/Playwright browsers on Workers
- ✅ Captures screenshots (full page, regions, PNG/JPEG)
- ✅ Generates PDFs from HTML or URLs with custom formatting
- ✅ Scrapes web content with structured data extraction
- ✅ Manages browser sessions for performance optimization
- ✅ Implements session reuse to reduce concurrency usage
- ✅ Creates incognito contexts for session isolation
- ✅ Handles batch operations with multiple tabs
- ✅ Integrates with Workers AI for AI-enhanced scraping
- ✅ Provides error handling and retry logic patterns

---

## Known Issues Prevented

| Issue | Error Message | How Skill Prevents |
|-------|---------------|-------------------|
| **XPath Not Supported** | "XPath selector not supported" | Templates use CSS selectors or page.evaluate() workaround |
| **Missing Browser Binding** | "Cannot read properties of undefined (reading 'fetch')" | Always passes env.MYBROWSER to puppeteer.launch() |
| **Browser Timeout** | Browser closes after 60s | Documents keep_alive option to extend up to 10 minutes |
| **Concurrency Limits** | "Rate limit reached" | Session reuse patterns, limit checks before launching |
| **Local Dev Limit** | Requests > 1MB fail in dev | Documents remote: true for local development |
| **Bot Protection** | Website blocks requests | Explains bot identification, WAF skip rule workaround |

---

## Token Efficiency

### Manual Browser Rendering Setup (Without Skill):
- Configure browser binding: 600 tokens
- Learn Puppeteer API: 2,000 tokens
- Implement screenshots: 1,200 tokens
- Implement scraping: 1,500 tokens
- Add session management: 2,000 tokens
- Handle errors: 1,000 tokens
- Debug XPath issues: 800 tokens
- **Total: ~9,100 tokens**

### With cloudflare-browser-rendering Skill:
- Reference skill templates: 2,000 tokens
- Customize for your use case: 1,500 tokens
- **Total: ~3,500 tokens**

**Savings: ~62% token reduction** (5,600 tokens saved)

---

## When to Use This Skill

### ✅ Use When:
- Taking screenshots of websites or web applications
- Generating PDFs from HTML content or URLs
- Scraping dynamic websites that require JavaScript execution
- Crawling multi-page websites
- Automating browser workflows (form filling, navigation)
- Testing web applications with headless browsers
- Extracting structured data from web pages
- Monitoring website changes or visual regression testing
- Need session management for performance optimization
- Building screenshot-as-a-service APIs

### ❌ Don't Use When:
- Static HTML parsing → Use simple fetch() + HTML parser
- Need to bypass bot protection → Cannot bypass (always identified as bot)
- Simple HTTP requests → Use fetch() API
- Real-time browser control → Workers run on edge, not suitable for interactive use
- Need Firefox/Safari → Only Chromium supported
- Large-scale crawling → Consider rate limits and costs

---

## Quick Usage Example

```bash
# Configure wrangler.jsonc
{
  "browser": { "binding": "MYBROWSER" },
  "compatibility_flags": ["nodejs_compat"]
}

# Install
npm install @cloudflare/puppeteer
```

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

---

## File Structure

```
~/.claude/skills/cloudflare-browser-rendering/
├── SKILL.md                               # Complete reference
├── README.md                              # This file (auto-trigger keywords)
├── templates/
│   ├── basic-screenshot.ts                # Minimal screenshot example
│   ├── screenshot-with-kv-cache.ts        # Screenshot + KV caching
│   ├── pdf-generation.ts                  # PDF generation from HTML/URL
│   ├── web-scraper-basic.ts               # Basic web scraping
│   ├── web-scraper-batch.ts               # Batch scraping multiple URLs
│   ├── session-reuse.ts                   # Session reuse pattern
│   ├── ai-enhanced-scraper.ts             # Scraping + Workers AI
│   ├── playwright-example.ts              # Playwright alternative
│   └── wrangler-browser-config.jsonc      # Browser binding config
├── references/
│   ├── session-management.md              # Session optimization guide
│   ├── pricing-and-limits.md              # Complete pricing breakdown
│   ├── common-errors.md                   # All known issues + solutions
│   └── puppeteer-vs-playwright.md         # Feature comparison
└── scripts/
    └── check-versions.sh                  # Verify package versions
```

---

## Dependencies

- **Required**: cloudflare-worker-base skill (for Worker setup)
- **CLI**: wrangler@4.43.0+
- **Package**: @cloudflare/puppeteer@1.0.4 or @cloudflare/playwright@1.0.0
- **Types**: @cloudflare/workers-types@4.20251014.0+

---

## Related Skills

- `cloudflare-worker-base` - Base Worker + Hono setup
- `cloudflare-kv` - KV caching for screenshots
- `cloudflare-r2` - R2 storage for generated files
- `cloudflare-workers-ai` - AI-enhanced scraping
- `cloudflare-agents` - Agent SDK with browser rendering

---

## Common Patterns Included

1. **Basic Screenshot** - Simple screenshot capture
2. **Screenshot with KV Caching** - Production pattern with caching
3. **PDF Generation** - Convert HTML to PDF with custom formatting
4. **Web Scraping** - Extract structured data from web pages
5. **Batch Scraping** - Scrape multiple URLs efficiently with tabs
6. **Session Reuse** - Optimize performance by reusing browser sessions
7. **AI-Enhanced Scraping** - Combine browser rendering with Workers AI
8. **Playwright Alternative** - Playwright implementation examples

---

## Pricing Overview

**Free Tier:**
- 10 minutes browser time per day
- 3 concurrent browsers
- 60 second browser timeout

**Paid Tier:**
- 10 hours per month included
- 10 concurrent browsers included
- $0.09 per additional browser hour
- $2.00 per additional concurrent browser
- Timeout extendable to 10 minutes with keep_alive

See `references/pricing-and-limits.md` for detailed breakdown.

---

## Learn More

- **SKILL.md**: Complete Puppeteer/Playwright API reference
- **templates/**: 8 ready-to-use code templates
- **references/**: Deep-dive guides for advanced topics

---

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Maintainer**: Jeremy Dawes (Jezweb)
