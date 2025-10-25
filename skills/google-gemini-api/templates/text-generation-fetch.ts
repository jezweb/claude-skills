/**
 * Basic Text Generation with Gemini API (Fetch - Cloudflare Workers)
 *
 * Demonstrates:
 * - Direct REST API calls using fetch (no SDK dependencies)
 * - Perfect for Cloudflare Workers, Deno, Bun, or edge runtimes
 * - Manual JSON parsing
 * - Error handling with fetch
 *
 * Prerequisites:
 * - Set GEMINI_API_KEY environment variable (or use env.GEMINI_API_KEY in Workers)
 */

/**
 * Example for Cloudflare Workers
 */
interface Env {
  GEMINI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Make direct API call to Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Explain quantum computing in simple terms for a 10-year-old'
                  }
                ]
              }
            ]
          }),
        }
      );

      // Check for HTTP errors
      if (!response.ok) {
        const errorData = await response.json();
        return new Response(
          JSON.stringify({
            error: errorData.error?.message || 'Unknown error',
            status: response.status
          }),
          { status: response.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Parse response
      const data = await response.json();

      // Extract text from response structure
      const generatedText = data.candidates[0]?.content?.parts[0]?.text;
      const usageMetadata = data.usageMetadata;
      const finishReason = data.candidates[0]?.finishReason;

      return new Response(
        JSON.stringify({
          text: generatedText,
          usage: {
            promptTokens: usageMetadata.promptTokenCount,
            responseTokens: usageMetadata.candidatesTokenCount,
            totalTokens: usageMetadata.totalTokenCount
          },
          finishReason
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};

/**
 * Example for Node.js/Standalone
 */
async function mainNodeJS() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Explain quantum computing in simple terms' }
            ]
          }
        ]
      }),
    }
  );

  const data = await response.json();
  console.log(data.candidates[0].content.parts[0].text);
}

// Uncomment to run in Node.js
// mainNodeJS();
