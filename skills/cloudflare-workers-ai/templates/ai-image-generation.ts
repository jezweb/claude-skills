/**
 * Cloudflare Workers AI - Image Generation Examples
 *
 * This template demonstrates:
 * - Text-to-image with Flux models (highest quality)
 * - Stable Diffusion XL
 * - Image storage in R2
 * - Base64 and binary responses
 * - Custom prompts and parameters
 */

import { Hono } from 'hono';

type Bindings = {
  AI: Ai;
  BUCKET?: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Flux - Text-to-Image (Highest Quality)
// ============================================================================

/**
 * Flux 1 Schnell - Fast, high-quality image generation
 * Best for: Photorealistic images, detailed artwork
 * Rate limit: 720/min
 */

app.post('/generate/flux', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const imageStream = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt,
    });

    return new Response(imageStream, {
      headers: { 'content-type': 'image/png' },
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
// Stable Diffusion XL
// ============================================================================

app.post('/generate/sdxl', async (c) => {
  try {
    const { prompt, num_steps = 20, guidance = 7.5 } = await c.req.json<{
      prompt: string;
      num_steps?: number;
      guidance?: number;
    }>();

    const imageStream = await c.env.AI.run(
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      {
        prompt,
        num_steps, // More steps = higher quality, slower
        guidance, // CFG scale: higher = more prompt adherence
      }
    );

    return new Response(imageStream, {
      headers: { 'content-type': 'image/png' },
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
// DreamShaper (Artistic/Stylized)
// ============================================================================

app.post('/generate/dreamshaper', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const imageStream = await c.env.AI.run('@cf/lykon/dreamshaper-8-lcm', {
      prompt,
    });

    return new Response(imageStream, {
      headers: { 'content-type': 'image/png' },
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
// Generate and Store in R2
// ============================================================================

app.post('/generate/save', async (c) => {
  try {
    const { prompt, filename } = await c.req.json<{
      prompt: string;
      filename?: string;
    }>();

    if (!c.env.BUCKET) {
      return c.json({ error: 'R2 bucket not configured' }, 500);
    }

    // Generate image
    const imageStream = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt,
    });

    const imageBytes = await new Response(imageStream).bytes();

    // Generate filename
    const key = filename || `images/${Date.now()}.png`;

    // Store in R2
    await c.env.BUCKET.put(key, imageBytes, {
      httpMetadata: {
        contentType: 'image/png',
      },
      customMetadata: {
        prompt,
        generatedAt: new Date().toISOString(),
      },
    });

    return c.json({
      success: true,
      message: 'Image generated and saved',
      key,
      url: `https://your-domain.com/${key}`, // Update with your R2 public URL
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
// Return Base64 Encoded Image
// ============================================================================

app.post('/generate/base64', async (c) => {
  try {
    const { prompt } = await c.req.json<{ prompt: string }>();

    const imageStream = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt,
    });

    const imageBytes = await new Response(imageStream).bytes();
    const base64 = btoa(String.fromCharCode(...imageBytes));

    return c.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
      prompt,
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
// Image-to-Image (Stable Diffusion)
// ============================================================================

/**
 * Transform existing images based on prompts
 * Requires base64-encoded input image
 */

app.post('/generate/img2img', async (c) => {
  try {
    const { prompt, image, strength = 0.8 } = await c.req.json<{
      prompt: string;
      image: string; // Base64 encoded
      strength?: number; // 0.0-1.0, higher = more transformation
    }>();

    // Decode base64 image to array
    const imageData = Uint8Array.from(atob(image.replace(/^data:image\/\w+;base64,/, '')), (c) =>
      c.charCodeAt(0)
    );

    const result = await c.env.AI.run('@cf/runwayml/stable-diffusion-v1-5-img2img', {
      prompt,
      image: Array.from(imageData),
      strength,
    });

    return new Response(result, {
      headers: { 'content-type': 'image/png' },
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
// Batch Generation
// ============================================================================

app.post('/generate/batch', async (c) => {
  try {
    const { prompts } = await c.req.json<{ prompts: string[] }>();

    if (!prompts || prompts.length === 0) {
      return c.json({ error: 'prompts array is required' }, 400);
    }

    if (prompts.length > 5) {
      return c.json({ error: 'Maximum 5 prompts per batch' }, 400);
    }

    const images = await Promise.all(
      prompts.map(async (prompt) => {
        const imageStream = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt,
        });

        const imageBytes = await new Response(imageStream).bytes();
        const base64 = btoa(String.fromCharCode(...imageBytes));

        return {
          prompt,
          image: `data:image/png;base64,${base64}`,
        };
      })
    );

    return c.json({
      success: true,
      count: images.length,
      images,
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
// Prompt Enhancement
// ============================================================================

/**
 * Use LLM to enhance user prompts for better image quality
 */

app.post('/generate/enhanced', async (c) => {
  try {
    const { userPrompt } = await c.req.json<{ userPrompt: string }>();

    // Step 1: Enhance prompt with LLM
    const enhancement = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content:
            'You are a Stable Diffusion prompt expert. Enhance the user prompt for image generation. Add details about style, lighting, quality, composition. Return ONLY the enhanced prompt, no explanations.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const enhancedPrompt = enhancement.response.trim();

    // Step 2: Generate image with enhanced prompt
    const imageStream = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: enhancedPrompt,
    });

    const imageBytes = await new Response(imageStream).bytes();
    const base64 = btoa(String.fromCharCode(...imageBytes));

    return c.json({
      success: true,
      originalPrompt: userPrompt,
      enhancedPrompt,
      image: `data:image/png;base64,${base64}`,
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
// List Generated Images (from R2)
// ============================================================================

app.get('/images', async (c) => {
  try {
    if (!c.env.BUCKET) {
      return c.json({ error: 'R2 bucket not configured' }, 500);
    }

    const listed = await c.env.BUCKET.list({
      prefix: 'images/',
      limit: 100,
    });

    const images = listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      url: `https://your-domain.com/${obj.key}`,
    }));

    return c.json({
      success: true,
      count: images.length,
      images,
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
