// PDF Generation
// Generate PDFs from URLs or custom HTML content

import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

interface PDFRequest {
  url?: string;
  html?: string;
  options?: {
    format?: "Letter" | "A4" | "A3" | "Legal";
    landscape?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed. Use POST with JSON body.", {
        status: 405,
      });
    }

    const body = await request.json<PDFRequest>();
    const { url, html, options = {} } = body;

    if (!url && !html) {
      return new Response('Missing "url" or "html" in request body', {
        status: 400,
      });
    }

    const browser = await puppeteer.launch(env.MYBROWSER);

    try {
      const page = await browser.newPage();

      // Load content
      if (html) {
        await page.setContent(html, { waitUntil: "networkidle0" });
      } else if (url) {
        await page.goto(url, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });
      }

      // Generate PDF
      const pdf = await page.pdf({
        format: options.format || "A4",
        landscape: options.landscape || false,
        printBackground: true, // Include background colors/images
        margin: options.margin || {
          top: "1cm",
          right: "1cm",
          bottom: "1cm",
          left: "1cm",
        },
      });

      await browser.close();

      // Generate filename
      const filename = url
        ? `${new URL(url).hostname.replace(/\./g, "_")}.pdf`
        : "document.pdf";

      return new Response(pdf, {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      await browser.close();
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "PDF generation failed",
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
 * Usage Examples:
 *
 * 1. PDF from URL:
 *    POST /
 *    Content-Type: application/json
 *    {
 *      "url": "https://example.com"
 *    }
 *
 * 2. PDF from custom HTML:
 *    POST /
 *    {
 *      "html": "<!DOCTYPE html><html><body><h1>Invoice</h1></body></html>"
 *    }
 *
 * 3. PDF with custom options:
 *    POST /
 *    {
 *      "url": "https://example.com",
 *      "options": {
 *        "format": "Letter",
 *        "landscape": true,
 *        "margin": {
 *          "top": "2cm",
 *          "bottom": "2cm"
 *        }
 *      }
 *    }
 */
