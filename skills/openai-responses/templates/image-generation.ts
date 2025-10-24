/**
 * Image Generation Example
 *
 * Demonstrates integrated DALL-E image generation in the Responses API.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicImageGeneration() {
  console.log('=== Basic Image Generation ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Create an image of a futuristic cityscape at sunset',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Response:', response.output_text);

  // Find image in output
  response.output.forEach((item) => {
    if (item.type === 'image_generation_call') {
      console.log('\nPrompt used:', item.prompt);
      console.log('Image URL:', item.output.url);
      console.log('Image expires in 1 hour');
    }
  });
}

async function conversationalImageGeneration() {
  console.log('=== Conversational Image Generation ===\n');

  // Create conversation
  const conv = await openai.conversations.create();

  // First request
  const response1 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'Create an image of a cartoon cat wearing a wizard hat',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Turn 1:', response1.output_text);

  // Modification request (model remembers previous image)
  const response2 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'Make it more colorful and add a magic wand',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Turn 2:', response2.output_text);
  // Model generates new image with modifications
}

async function multipleImages() {
  console.log('=== Multiple Images ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Create 3 different logo designs for a tech startup',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Response:', response.output_text);

  // Collect all images
  const images: string[] = [];
  response.output.forEach((item) => {
    if (item.type === 'image_generation_call') {
      images.push(item.output.url);
    }
  });

  console.log(`\nGenerated ${images.length} images:`);
  images.forEach((url, idx) => {
    console.log(`Image ${idx + 1}: ${url}`);
  });
}

async function imageWithSpecifications() {
  console.log('=== Image with Specifications ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Create an image with these specifications:
- Subject: Modern minimalist office space
- Style: Photorealistic
- Lighting: Natural daylight from large windows
- Colors: Neutral tones (white, gray, wood)
- Details: Include plants and modern furniture`,
    tools: [{ type: 'image_generation' }],
  });

  console.log('Response:', response.output_text);
}

async function imageForPresentation() {
  console.log('=== Image for Presentation ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Create a professional infographic showing the growth of AI adoption from 2020 to 2025',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Response:', response.output_text);
}

async function saveImageToFile() {
  console.log('=== Save Image to File ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Create an image of a mountain landscape',
    tools: [{ type: 'image_generation' }],
  });

  // Find and download image
  for (const item of response.output) {
    if (item.type === 'image_generation_call') {
      const imageUrl = item.output.url;
      console.log('Downloading image from:', imageUrl);

      // Download image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Save to file
      const fs = await import('fs');
      fs.writeFileSync('./generated-image.png', Buffer.from(imageBuffer));

      console.log('Image saved to: ./generated-image.png');
    }
  }
}

async function iterativeImageRefinement() {
  console.log('=== Iterative Image Refinement ===\n');

  const conv = await openai.conversations.create();

  // Initial image
  const response1 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'Create a logo for a coffee shop',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Initial design:', response1.output_text);

  // Refinement 1
  const response2 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'Make the colors warmer and add a coffee bean illustration',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Refinement 1:', response2.output_text);

  // Refinement 2
  const response3 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'Perfect! Can you make it circular instead of square?',
    tools: [{ type: 'image_generation' }],
  });

  console.log('Final design:', response3.output_text);
}

async function handleImageGenerationErrors() {
  console.log('=== Error Handling ===\n');

  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input: 'Create an image [multiple requests]',
      tools: [{ type: 'image_generation' }],
    });

    console.log('Success:', response.output_text);
  } catch (error: any) {
    if (error.type === 'rate_limit_error') {
      console.error('DALL-E rate limit exceeded');
      console.error('Retry after:', error.headers?.['retry-after']);

      // Implement exponential backoff
      const delay = parseInt(error.headers?.['retry-after'] || '5') * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry request
      const retryResponse = await openai.responses.create({
        model: 'gpt-5',
        input: 'Create an image',
        tools: [{ type: 'image_generation' }],
      });

      console.log('Retry success:', retryResponse.output_text);
    } else if (error.type === 'content_policy_violation') {
      console.error('Image prompt violates content policy');
      console.error('Please revise prompt to comply with guidelines');
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function combinedImageAndAnalysis() {
  console.log('=== Image Generation + Code Interpreter ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Create a chart showing sales growth from 2020-2025, then generate an image visualization',
    tools: [
      { type: 'code_interpreter' },
      { type: 'image_generation' },
    ],
  });

  console.log('Response:', response.output_text);

  // Model uses code interpreter for data, then image generation for visualization
}

// Run examples
basicImageGeneration();
// conversationalImageGeneration();
// multipleImages();
// imageWithSpecifications();
// saveImageToFile();
// iterativeImageRefinement();
