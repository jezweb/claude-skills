/**
 * Streaming Text Generation with Gemini API (Fetch - SSE Parsing)
 *
 * Demonstrates:
 * - Server-Sent Events (SSE) parsing with fetch
 * - Manual stream handling for Cloudflare Workers or edge runtimes
 * - Buffer management for incomplete chunks
 * - Error handling during streaming
 *
 * Prerequisites:
 * - Set GEMINI_API_KEY environment variable
 */

interface Env {
  GEMINI_API_KEY: string;
}

/**
 * Example for Cloudflare Workers with streaming response
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Create a TransformStream to stream tokens to the client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start streaming in the background
    (async () => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent`,
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
                    { text: 'Write a 200-word story about time travel' }
                  ]
                }
              ]
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Append new data to buffer
          buffer += decoder.decode(value, { stream: true });

          // Split by newlines (SSE format)
          const lines = buffer.split('\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            // Skip empty lines and metadata
            if (line.trim() === '' || line.startsWith('data: [DONE]')) {
              continue;
            }

            // Parse SSE format: "data: {json}"
            if (!line.startsWith('data: ')) {
              continue;
            }

            try {
              const jsonData = JSON.parse(line.slice(6)); // Remove "data: " prefix
              const text = jsonData.candidates[0]?.content?.parts[0]?.text;

              if (text) {
                // Write chunk to client
                await writer.write(encoder.encode(text));
              }
            } catch (e) {
              // Skip invalid JSON chunks
              console.error('Failed to parse chunk:', e);
            }
          }
        }

        // Close the stream
        await writer.close();

      } catch (error: any) {
        await writer.write(encoder.encode(`\n\nError: ${error.message}`));
        await writer.close();
      }
    })();

    // Return streaming response immediately
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent`,
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
              { text: 'Write a 200-word story about time travel' }
            ]
          }
        ]
      }),
    }
  );

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('data: [DONE]')) continue;
      if (!line.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(line.slice(6));
        const text = data.candidates[0]?.content?.parts[0]?.text;
        if (text) {
          process.stdout.write(text);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  console.log('\n');
}

// Uncomment to run in Node.js
// mainNodeJS();
