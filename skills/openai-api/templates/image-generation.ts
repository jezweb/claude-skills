/**
 * OpenAI Images API - DALL-E 3 Generation Examples
 *
 * This template demonstrates:
 * - Basic image generation
 * - Quality settings (standard vs HD)
 * - Style options (vivid vs natural)
 * - Different sizes and formats
 * - Base64 output
 * - Saving images to disk
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// BASIC IMAGE GENERATION
// =============================================================================

async function basicGeneration() {
  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt: 'A white siamese cat with striking blue eyes',
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    n: 1,
  });

  console.log('Generated image URL:', image.data[0].url);
  console.log('Revised prompt:', image.data[0].revised_prompt);

  return image.data[0].url;
}

// =============================================================================
// QUALITY COMPARISON
// =============================================================================

async function qualityComparison() {
  const prompt = 'A futuristic city at sunset with flying cars';

  // Standard quality (faster, cheaper)
  console.log('Generating standard quality image...');
  const standard = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    quality: 'standard',
  });

  console.log('Standard quality URL:', standard.data[0].url);

  // HD quality (finer details, more expensive)
  console.log('Generating HD quality image...');
  const hd = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    quality: 'hd',
  });

  console.log('HD quality URL:', hd.data[0].url);

  return { standard: standard.data[0].url, hd: hd.data[0].url };
}

// =============================================================================
// STYLE COMPARISON
// =============================================================================

async function styleComparison() {
  const prompt = 'A mountain landscape with a lake';

  // Vivid style (hyper-real, dramatic)
  console.log('Generating vivid style image...');
  const vivid = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    style: 'vivid',
  });

  console.log('Vivid style URL:', vivid.data[0].url);

  // Natural style (more realistic, less dramatic)
  console.log('Generating natural style image...');
  const natural = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    style: 'natural',
  });

  console.log('Natural style URL:', natural.data[0].url);

  return { vivid: vivid.data[0].url, natural: natural.data[0].url };
}

// =============================================================================
// DIFFERENT SIZES
// =============================================================================

async function differentSizes() {
  const prompt = 'A minimalist logo for a tech company';

  // Square
  const square = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
  });

  console.log('Square (1024x1024):', square.data[0].url);

  // Portrait
  const portrait = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1792',
  });

  console.log('Portrait (1024x1792):', portrait.data[0].url);

  // Landscape
  const landscape = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1792x1024',
  });

  console.log('Landscape (1792x1024):', landscape.data[0].url);

  return { square, portrait, landscape };
}

// =============================================================================
// BASE64 OUTPUT
// =============================================================================

async function base64Output() {
  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt: 'A cyberpunk street scene at night',
    response_format: 'b64_json',
  });

  const base64Data = image.data[0].b64_json;

  console.log('Base64 data length:', base64Data?.length);
  console.log('First 100 chars:', base64Data?.substring(0, 100));

  // Convert to buffer and save
  if (base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync('generated-image.png', buffer);
    console.log('Image saved to: generated-image.png');
  }

  return base64Data;
}

// =============================================================================
// DOWNLOAD AND SAVE IMAGE
// =============================================================================

async function downloadAndSave(url: string, filename: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync(filename, buffer);
  console.log(`Image saved to: ${filename}`);
}

async function generateAndSave() {
  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt: 'A serene Japanese garden with cherry blossoms',
    size: '1024x1024',
    quality: 'hd',
    style: 'natural',
  });

  const url = image.data[0].url;
  await downloadAndSave(url, 'japanese-garden.png');

  return url;
}

// =============================================================================
// DETAILED PROMPT EXAMPLES
// =============================================================================

async function detailedPrompts() {
  // Example 1: Specific art style
  const artStyle = await openai.images.generate({
    model: 'dall-e-3',
    prompt: 'An oil painting of a sunset over the ocean in the style of Claude Monet',
    style: 'natural',
  });

  console.log('Art style result:', artStyle.data[0].url);

  // Example 2: Detailed composition
  const detailed = await openai.images.generate({
    model: 'dall-e-3',
    prompt: 'A professional product photo of a smartwatch on a white marble surface, with soft studio lighting from the left, shallow depth of field, commercial photography style',
    quality: 'hd',
    style: 'natural',
  });

  console.log('Detailed composition:', detailed.data[0].url);

  // Example 3: Character design
  const character = await openai.images.generate({
    model: 'dall-e-3',
    prompt: 'A friendly robot character with round edges, bright blue and white colors, large expressive eyes, modern minimalist design, 3D render style',
    style: 'vivid',
  });

  console.log('Character design:', character.data[0].url);

  return { artStyle, detailed, character };
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

async function withErrorHandling() {
  try {
    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A beautiful landscape',
    });

    return image.data[0].url;
  } catch (error: any) {
    if (error.status === 400) {
      console.error('Bad request - check your prompt for policy violations');
    } else if (error.status === 401) {
      console.error('Invalid API key');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded - wait and retry');
    } else {
      console.error('Unexpected error:', error.message);
    }

    throw error;
  }
}

// =============================================================================
// BATCH GENERATION (Sequential)
// =============================================================================

async function batchGeneration() {
  const prompts = [
    'A red apple on a wooden table',
    'A blue butterfly on a flower',
    'A green forest path in autumn',
  ];

  const results = [];

  for (const prompt of prompts) {
    console.log(`Generating: ${prompt}`);

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
    });

    results.push({
      prompt,
      url: image.data[0].url,
      revised_prompt: image.data[0].revised_prompt,
    });

    // Wait 1 second between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Generated ${results.length} images`);
  return results;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI DALL-E 3 Image Generation Examples ===\n');

  // Example 1: Basic generation
  console.log('1. Basic Image Generation:');
  await basicGeneration();
  console.log();

  // Example 2: Quality comparison
  console.log('2. Quality Comparison (Standard vs HD):');
  await qualityComparison();
  console.log();

  // Example 3: Style comparison
  console.log('3. Style Comparison (Vivid vs Natural):');
  await styleComparison();
  console.log();

  // Example 4: Different sizes
  console.log('4. Different Sizes:');
  await differentSizes();
  console.log();

  // Example 5: Base64 output
  console.log('5. Base64 Output and Save:');
  await base64Output();
  console.log();

  // Example 6: Generate and save
  console.log('6. Generate and Save:');
  await generateAndSave();
  console.log();

  // Example 7: Detailed prompts
  console.log('7. Detailed Prompt Examples:');
  await detailedPrompts();
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicGeneration,
  qualityComparison,
  styleComparison,
  differentSizes,
  base64Output,
  generateAndSave,
  detailedPrompts,
  batchGeneration,
  withErrorHandling,
};
