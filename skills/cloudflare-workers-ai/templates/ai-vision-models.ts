/**
 * Cloudflare Workers AI - Vision Models Examples
 *
 * This template demonstrates:
 * - Llama 3.2 11B Vision Instruct for image understanding
 * - Image captioning and description
 * - Visual question answering
 * - Base64 image encoding
 * - Combining vision + text prompts
 */

import { Hono } from 'hono';

type Bindings = {
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Image Understanding
// ============================================================================

/**
 * Llama 3.2 11B Vision Instruct
 * - Understands images and answers questions
 * - Accepts base64-encoded images
 * - Rate limit: 720/min
 */

app.post('/vision/understand', async (c) => {
  try {
    const { image, question = 'What is in this image?' } = await c.req.json<{
      image: string; // Base64 data URL or base64 string
      question?: string;
    }>();

    // Ensure image has proper data URL prefix
    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    const response = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    return c.json({
      success: true,
      question,
      answer: response.response,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// Image Captioning
// ============================================================================

app.post('/vision/caption', async (c) => {
  try {
    const { image } = await c.req.json<{ image: string }>();

    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    const response = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a detailed caption for this image. Describe what you see, including objects, people, setting, mood, and any notable details.',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    return c.json({
      success: true,
      caption: response.response,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// Visual Question Answering
// ============================================================================

app.post('/vision/qa', async (c) => {
  try {
    const { image, questions } = await c.req.json<{
      image: string;
      questions: string[];
    }>();

    if (!questions || questions.length === 0) {
      return c.json({ error: 'questions array is required' }, 400);
    }

    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    // Answer all questions
    const answers = await Promise.all(
      questions.map(async (question) => {
        const response = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: question },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
        });

        return {
          question,
          answer: response.response,
        };
      })
    );

    return c.json({
      success: true,
      count: answers.length,
      results: answers,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// Image Analysis (Structured Output)
// ============================================================================

app.post('/vision/analyze', async (c) => {
  try {
    const { image } = await c.req.json<{ image: string }>();

    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    const response = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and return a JSON object with:
- objects: array of objects detected
- scene: description of the setting
- mood: emotional tone
- colors: dominant colors
- text: any visible text

Return ONLY valid JSON, no explanations.`,
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    // Parse JSON response
    try {
      const analysis = JSON.parse(response.response);
      return c.json({
        success: true,
        analysis,
      });
    } catch {
      return c.json({
        success: true,
        raw: response.response,
      });
    }
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// Image Comparison
// ============================================================================

app.post('/vision/compare', async (c) => {
  try {
    const { image1, image2, question = 'What are the differences between these images?' } =
      await c.req.json<{
        image1: string;
        image2: string;
        question?: string;
      }>();

    const imageUrl1 = image1.startsWith('data:')
      ? image1
      : `data:image/png;base64,${image1}`;
    const imageUrl2 = image2.startsWith('data:')
      ? image2
      : `data:image/png;base64,${image2}`;

    // Analyze first image
    const analysis1 = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            { type: 'image_url', image_url: { url: imageUrl1 } },
          ],
        },
      ],
    });

    // Analyze second image
    const analysis2 = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            { type: 'image_url', image_url: { url: imageUrl2 } },
          ],
        },
      ],
    });

    // Compare using text generation
    const comparison = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'user',
          content: `Compare these two images based on their descriptions:

Image 1: ${analysis1.response}

Image 2: ${analysis2.response}

Question: ${question}`,
        },
      ],
    });

    return c.json({
      success: true,
      image1Description: analysis1.response,
      image2Description: analysis2.response,
      comparison: comparison.response,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// Image Upload from URL
// ============================================================================

/**
 * Fetch image from URL, convert to base64, and analyze
 */

app.post('/vision/url', async (c) => {
  try {
    const { url, question = 'What is in this image?' } = await c.req.json<{
      url: string;
      question?: string;
    }>();

    // Fetch image
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      return c.json({ error: 'Failed to fetch image' }, 400);
    }

    // Convert to base64
    const imageBytes = await imageResponse.bytes();
    const base64 = btoa(String.fromCharCode(...imageBytes));
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const imageUrl = `data:${contentType};base64,${base64}`;

    // Analyze image
    const response = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    return c.json({
      success: true,
      sourceUrl: url,
      question,
      answer: response.response,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// Accessibility: Alt Text Generation
// ============================================================================

app.post('/vision/alt-text', async (c) => {
  try {
    const { image } = await c.req.json<{ image: string }>();

    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`;

    const response = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate a concise, descriptive alt text for this image for accessibility purposes. Keep it under 125 characters.',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    return c.json({
      success: true,
      altText: response.response.trim(),
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default app;
