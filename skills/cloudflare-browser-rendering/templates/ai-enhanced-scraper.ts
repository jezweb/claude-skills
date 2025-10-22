// AI-Enhanced Web Scraper
// Combine Browser Rendering with Workers AI to extract structured data intelligently

import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
  AI: Ai;
}

interface ProductData {
  name: string;
  price: string;
  description: string;
  availability: string;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("Missing ?url parameter", { status: 400 });
    }

    // Step 1: Scrape page content with browser
    const browser = await puppeteer.launch(env.MYBROWSER);

    try {
      const page = await browser.newPage();

      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Extract raw HTML content
      const bodyContent = await page.$eval("body", (el) => el.innerHTML);

      await browser.close();

      // Truncate to fit AI context (4000 chars)
      const truncatedContent = bodyContent.slice(0, 4000);

      // Step 2: Extract structured data with AI
      const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content:
              "You are a data extraction assistant. Extract product information from HTML and return ONLY valid JSON.",
          },
          {
            role: "user",
            content: `Extract product information from this HTML. Return JSON with these fields: name, price, description, availability. If any field is not found, use empty string.\n\nHTML:\n${truncatedContent}`,
          },
        ],
        stream: false,
      });

      // Parse AI response
      let productData: ProductData;
      try {
        const responseText = (aiResponse as any).response;
        // Try to extract JSON from response (AI might wrap it in markdown)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          productData = JSON.parse(jsonMatch[0]);
        } else {
          productData = JSON.parse(responseText);
        }
      } catch {
        productData = {
          name: "",
          price: "",
          description: "",
          availability: "",
          raw: (aiResponse as any).response,
        };
      }

      return Response.json({
        url,
        product: productData,
        extractedAt: new Date().toISOString(),
      });
    } catch (error) {
      await browser.close();
      return Response.json(
        {
          error: error instanceof Error ? error.message : "AI-enhanced scraping failed",
        },
        { status: 500 }
      );
    }
  },
};

/**
 * Setup:
 *   Add AI binding to wrangler.jsonc:
 *   {
 *     "browser": { "binding": "MYBROWSER" },
 *     "ai": { "binding": "AI" },
 *     "compatibility_flags": ["nodejs_compat"]
 *   }
 *
 * Usage:
 *   GET /?url=https://example.com/product
 *
 * Response:
 *   {
 *     "url": "https://example.com/product",
 *     "product": {
 *       "name": "Example Product",
 *       "price": "$99.99",
 *       "description": "Product description...",
 *       "availability": "In Stock"
 *     },
 *     "extractedAt": "2025-10-22T12:34:56.789Z"
 *   }
 *
 * Benefits:
 * - No need to write custom CSS selectors for each site
 * - AI adapts to different page structures
 * - Extracts semantic information, not just raw HTML
 * - Handles variations in HTML structure
 *
 * Limitations:
 * - AI context limited to ~4000 chars of HTML
 * - May hallucinate if data not present
 * - Requires AI binding (uses neurons quota)
 *
 * See also:
 * - cloudflare-workers-ai skill for more AI patterns
 * - web-scraper-basic.ts for traditional CSS selector approach
 */
