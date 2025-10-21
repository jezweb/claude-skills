// Agent with Browser Rendering (Puppeteer)

import { Agent } from "agents";
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  BROWSER: Fetcher;  // Browser Rendering binding
  OPENAI_API_KEY?: string;
}

export class BrowserAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /scrape - Scrape single URL
    if (url.pathname === "/scrape") {
      const { url: targetUrl } = await request.json();

      const data = await this.scrapeUrl(targetUrl);

      return Response.json({ url: targetUrl, data });
    }

    // POST /screenshot - Capture screenshot
    if (url.pathname === "/screenshot") {
      const { url: targetUrl } = await request.json();

      const screenshot = await this.captureScreenshot(targetUrl);

      return new Response(screenshot, {
        headers: { 'Content-Type': 'image/png' }
      });
    }

    // POST /batch-scrape - Scrape multiple URLs
    if (url.pathname === "/batch-scrape") {
      const { urls } = await request.json();

      const results = await this.batchScrape(urls);

      return Response.json({ results });
    }

    return new Response("Not Found", { status: 404 });
  }

  // Scrape single URL
  async scrapeUrl(url: string): Promise<any> {
    const browser = await puppeteer.launch(this.env.BROWSER);
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Wait for body to load
      await page.waitForSelector("body");

      // Extract page content
      const data = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        text: document.body.innerText,
        html: document.body.innerHTML
      }));

      await browser.close();

      return data;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // Capture screenshot
  async captureScreenshot(url: string): Promise<Buffer> {
    const browser = await puppeteer.launch(this.env.BROWSER);
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });

      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png'
      });

      await browser.close();

      return screenshot;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // Batch scrape multiple URLs
  async batchScrape(urls: string[]): Promise<any[]> {
    const results = [];

    for (const url of urls) {
      try {
        const data = await this.scrapeUrl(url);
        results.push({ url, success: true, data });
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Extract structured data with AI
  async extractDataWithAI(url: string): Promise<any> {
    const browser = await puppeteer.launch(this.env.BROWSER);
    const page = await browser.newPage();

    try {
      await page.goto(url);
      await page.waitForSelector("body");

      const bodyContent = await page.$eval("body", el => el.innerHTML);

      await browser.close();

      // Use OpenAI to extract structured data
      if (this.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Extract product information as JSON from this HTML: ${bodyContent.slice(0, 4000)}`
            }],
            response_format: { type: "json_object" }
          })
        });

        const result = await response.json();
        return JSON.parse(result.choices[0].message.content);
      }

      return { html: bodyContent };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // Interactive browsing example
  async fillForm(url: string, formData: any): Promise<any> {
    const browser = await puppeteer.launch(this.env.BROWSER);
    const page = await browser.newPage();

    try {
      await page.goto(url);

      // Fill form fields
      if (formData.email) {
        await page.type('input[name="email"]', formData.email);
      }

      if (formData.password) {
        await page.type('input[name="password"]', formData.password);
      }

      // Click submit button
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation();

      const result = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title
      }));

      await browser.close();

      return result;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
}

export default BrowserAgent;
