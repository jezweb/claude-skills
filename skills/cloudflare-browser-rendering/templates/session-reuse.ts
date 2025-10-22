// Session Reuse Pattern
// Optimize performance by reusing browser sessions instead of launching new ones

import puppeteer, { Browser } from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

/**
 * Get or create a browser instance
 * Tries to connect to existing session first, launches new one if needed
 */
async function getBrowser(env: Env): Promise<{ browser: Browser; launched: boolean }> {
  // Check for available sessions
  const sessions = await puppeteer.sessions(env.MYBROWSER);

  // Find sessions without active connections
  const freeSessions = sessions.filter((s) => !s.connectionId);

  if (freeSessions.length > 0) {
    // Try to connect to existing session
    try {
      console.log("Connecting to existing session:", freeSessions[0].sessionId);
      const browser = await puppeteer.connect(env.MYBROWSER, freeSessions[0].sessionId);
      return { browser, launched: false };
    } catch (error) {
      console.log("Failed to connect, launching new browser:", error);
    }
  }

  // Check limits before launching
  const limits = await puppeteer.limits(env.MYBROWSER);
  if (limits.allowedBrowserAcquisitions === 0) {
    throw new Error(
      `Rate limit reached. Retry after ${limits.timeUntilNextAllowedBrowserAcquisition}ms`
    );
  }

  // Launch new session
  console.log("Launching new browser session");
  const browser = await puppeteer.launch(env.MYBROWSER);
  return { browser, launched: true };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || "https://example.com";

    try {
      // Get or create browser
      const { browser, launched } = await getBrowser(env);
      const sessionId = browser.sessionId();

      console.log({
        sessionId,
        launched,
        message: launched ? "New browser launched" : "Reused existing session",
      });

      // Do work
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const screenshot = await page.screenshot();
      await page.close();

      // IMPORTANT: Disconnect (don't close) to keep session alive for reuse
      await browser.disconnect();

      return new Response(screenshot, {
        headers: {
          "content-type": "image/png",
          "x-session-id": sessionId,
          "x-session-reused": launched ? "false" : "true",
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
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
 * Key Concepts:
 *
 * 1. puppeteer.sessions() - List all active sessions
 * 2. puppeteer.connect() - Connect to existing session
 * 3. browser.disconnect() - Disconnect WITHOUT closing (keeps session alive)
 * 4. browser.close() - Terminate session completely
 * 5. puppeteer.limits() - Check rate limits before launching
 *
 * Benefits:
 * - Faster response times (no cold start)
 * - Lower concurrency usage
 * - Better resource utilization
 *
 * Trade-offs:
 * - Sessions time out after 60s idle (extend with keep_alive)
 * - Must handle connection failures gracefully
 * - Need to track which sessions are available
 *
 * Response Headers:
 * - x-session-id: Browser session ID
 * - x-session-reused: true if reused existing session
 */
