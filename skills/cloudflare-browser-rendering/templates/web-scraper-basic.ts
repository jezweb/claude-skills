// Basic Web Scraper
// Extract structured data from web pages

import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

interface ScrapedData {
  url: string;
  title: string;
  description: string;
  headings: string[];
  links: Array<{ text: string; href: string }>;
  images: Array<{ alt: string; src: string }>;
  timestamp: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("Missing ?url parameter", { status: 400 });
    }

    const normalizedUrl = new URL(url).toString();
    const browser = await puppeteer.launch(env.MYBROWSER);

    try {
      const page = await browser.newPage();

      // Navigate to page
      await page.goto(normalizedUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait for body to be present
      await page.waitForSelector("body");

      // Extract structured data
      const data = await page.evaluate<ScrapedData>(() => {
        // Get all headings
        const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map(
          (el) => el.textContent?.trim() || ""
        );

        // Get all links
        const links = Array.from(document.querySelectorAll("a"))
          .filter((a) => a.href)
          .map((a) => ({
            text: a.textContent?.trim() || "",
            href: a.href,
          }))
          .slice(0, 50); // Limit to first 50 links

        // Get all images
        const images = Array.from(document.querySelectorAll("img"))
          .filter((img) => img.src)
          .map((img) => ({
            alt: img.alt || "",
            src: img.src,
          }))
          .slice(0, 20); // Limit to first 20 images

        return {
          url: window.location.href,
          title: document.title,
          description:
            document.querySelector('meta[name="description"]')?.getAttribute("content") ||
            "",
          headings,
          links,
          images,
          timestamp: new Date().toISOString(),
        };
      });

      await browser.close();

      return Response.json(data, {
        headers: {
          "cache-control": "public, max-age=3600",
        },
      });
    } catch (error) {
      await browser.close();
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Scraping failed",
          url: normalizedUrl,
        },
        { status: 500 }
      );
    }
  },
};

/**
 * Usage:
 *   GET /?url=https://example.com
 *
 * Response:
 *   {
 *     "url": "https://example.com",
 *     "title": "Example Domain",
 *     "description": "...",
 *     "headings": ["Example Domain"],
 *     "links": [{ "text": "More information...", "href": "..." }],
 *     "images": [],
 *     "timestamp": "2025-10-22T12:34:56.789Z"
 *   }
 */
