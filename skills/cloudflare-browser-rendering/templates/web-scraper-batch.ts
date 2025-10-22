// Batch Web Scraper
// Scrape multiple URLs efficiently using browser tabs

import puppeteer, { Browser } from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

interface ScrapeResult {
  url: string;
  success: boolean;
  data?: {
    title: string;
    description: string;
    textContent: string; // First 500 chars
  };
  error?: string;
}

async function scrapePage(browser: Browser, url: string): Promise<ScrapeResult> {
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const data = await page.evaluate(() => ({
      title: document.title,
      description:
        document.querySelector('meta[name="description"]')?.getAttribute("content") ||
        "",
      textContent: document.body.innerText.slice(0, 500), // First 500 chars
    }));

    await page.close();

    return {
      url,
      success: true,
      data,
    };
  } catch (error) {
    await page.close();

    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed. Use POST with JSON body.", {
        status: 405,
      });
    }

    const { urls } = await request.json<{ urls: string[] }>();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response('Missing "urls" array in request body', {
        status: 400,
      });
    }

    // Limit batch size
    if (urls.length > 20) {
      return new Response("Maximum 20 URLs per batch", { status: 400 });
    }

    // Launch single browser
    const browser = await puppeteer.launch(env.MYBROWSER);

    try {
      // Scrape all URLs in parallel (each in its own tab)
      const results = await Promise.all(urls.map((url) => scrapePage(browser, url)));

      await browser.close();

      const summary = {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      };

      return Response.json({
        summary,
        results,
      });
    } catch (error) {
      await browser.close();
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Batch scraping failed",
        },
        { status: 500 }
      );
    }
  },
};

/**
 * Usage:
 *   POST /
 *   Content-Type: application/json
 *   {
 *     "urls": [
 *       "https://example.com",
 *       "https://example.org",
 *       "https://example.net"
 *     ]
 *   }
 *
 * Response:
 *   {
 *     "summary": {
 *       "total": 3,
 *       "successful": 3,
 *       "failed": 0
 *     },
 *     "results": [
 *       {
 *         "url": "https://example.com",
 *         "success": true,
 *         "data": { "title": "...", "description": "...", "textContent": "..." }
 *       }
 *     ]
 *   }
 *
 * Note: Uses 1 browser with multiple tabs instead of multiple browsers.
 *       This reduces concurrency usage and is more efficient.
 */
