// Playwright Example
// Alternative to Puppeteer using @cloudflare/playwright

import { chromium } from "@cloudflare/playwright";

interface Env {
  BROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || "https://example.com";

    // Launch browser (note: chromium.launch instead of puppeteer.launch)
    const browser = await chromium.launch(env.BROWSER);

    try {
      // Create new page
      const page = await browser.newPage();

      // Navigate to URL
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        type: "png",
      });

      // Clean up
      await browser.close();

      return new Response(screenshot, {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=3600",
        },
      });
    } catch (error) {
      await browser.close();
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Screenshot failed",
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }
  },
};

/**
 * Playwright vs Puppeteer:
 *
 * Similarities:
 * - Very similar API (page.goto, page.screenshot, etc.)
 * - Both support Chromium on Workers
 * - Same use cases (screenshots, PDFs, scraping)
 *
 * Differences:
 *
 * | Feature | Puppeteer | Playwright |
 * |---------|-----------|------------|
 * | Import | `import puppeteer from "@cloudflare/puppeteer"` | `import { chromium } from "@cloudflare/playwright"` |
 * | Launch | `puppeteer.launch(env.MYBROWSER)` | `chromium.launch(env.BROWSER)` |
 * | Session Management | ✅ Advanced (sessions, history, limits) | ⚠️ Basic |
 * | Auto-waiting | Manual waitForSelector() | Built-in auto-waiting |
 * | Selectors | CSS only | CSS, text, XPath (via workaround) |
 * | Version | @cloudflare/puppeteer@1.0.4 | @cloudflare/playwright@1.0.0 |
 *
 * When to use Playwright:
 * - Already using Playwright for testing
 * - Prefer auto-waiting behavior
 * - Don't need advanced session management
 *
 * When to use Puppeteer:
 * - Need session reuse for performance
 * - Want to check limits before launching
 * - More familiar with Puppeteer API
 *
 * Installation:
 *   npm install @cloudflare/playwright
 *
 * Configuration (wrangler.jsonc):
 *   {
 *     "browser": { "binding": "BROWSER" },
 *     "compatibility_flags": ["nodejs_compat"]
 *   }
 *
 * Recommendation:
 *   Stick with Puppeteer for most use cases unless you have
 *   existing Playwright tests to migrate.
 */
