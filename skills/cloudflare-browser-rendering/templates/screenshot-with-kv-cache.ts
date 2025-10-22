// Screenshot with KV Caching
// Production-ready screenshot service with KV caching to reduce browser usage

import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
  SCREENSHOT_CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const refresh = searchParams.get("refresh") === "true";

    if (!url) {
      return new Response("Missing ?url parameter", { status: 400 });
    }

    const normalizedUrl = new URL(url).toString();

    // Check cache (unless refresh requested)
    if (!refresh) {
      const cached = await env.SCREENSHOT_CACHE.get(normalizedUrl, {
        type: "arrayBuffer",
      });

      if (cached) {
        return new Response(cached, {
          headers: {
            "content-type": "image/png",
            "x-cache": "HIT",
            "cache-control": "public, max-age=3600",
          },
        });
      }
    }

    // Generate screenshot
    const browser = await puppeteer.launch(env.MYBROWSER);

    try {
      const page = await browser.newPage();

      await page.goto(normalizedUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const screenshot = await page.screenshot({
        fullPage: true,
        type: "png",
      });

      await browser.close();

      // Cache for 24 hours
      await env.SCREENSHOT_CACHE.put(normalizedUrl, screenshot, {
        expirationTtl: 60 * 60 * 24, // 24 hours
      });

      return new Response(screenshot, {
        headers: {
          "content-type": "image/png",
          "x-cache": "MISS",
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
 * Setup:
 *   1. Create KV namespace:
 *      npx wrangler kv namespace create SCREENSHOT_CACHE
 *      npx wrangler kv namespace create SCREENSHOT_CACHE --preview
 *
 *   2. Add to wrangler.jsonc:
 *      {
 *        "browser": { "binding": "MYBROWSER" },
 *        "compatibility_flags": ["nodejs_compat"],
 *        "kv_namespaces": [
 *          {
 *            "binding": "SCREENSHOT_CACHE",
 *            "id": "YOUR_KV_ID",
 *            "preview_id": "YOUR_PREVIEW_ID"
 *          }
 *        ]
 *      }
 *
 * Usage:
 *   New screenshot: ?url=https://example.com
 *   Force refresh: ?url=https://example.com&refresh=true
 */
