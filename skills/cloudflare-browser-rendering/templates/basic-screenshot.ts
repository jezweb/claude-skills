// Basic Screenshot Example
// Minimal example for taking screenshots with Cloudflare Browser Rendering

import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("Missing ?url parameter. Example: ?url=https://example.com", {
        status: 400,
      });
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = new URL(url).toString();
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    // Launch browser
    const browser = await puppeteer.launch(env.MYBROWSER);

    try {
      // Create new page
      const page = await browser.newPage();

      // Navigate to URL
      await page.goto(normalizedUrl, {
        waitUntil: "networkidle0", // Wait for network to be idle
        timeout: 30000, // 30 second timeout
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: true, // Capture full scrollable page
        type: "png",
      });

      // Clean up
      await browser.close();

      return new Response(screenshot, {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=3600", // Cache for 1 hour
        },
      });
    } catch (error) {
      // Always close browser on error
      await browser.close();
      throw error;
    }
  },
};

/**
 * Deploy:
 *   npx wrangler deploy
 *
 * Test:
 *   https://your-worker.workers.dev/?url=https://example.com
 *
 * Configuration (wrangler.jsonc):
 *   {
 *     "browser": { "binding": "MYBROWSER" },
 *     "compatibility_flags": ["nodejs_compat"]
 *   }
 */
