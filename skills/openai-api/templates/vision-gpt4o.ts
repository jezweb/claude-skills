/**
 * OpenAI Vision API - GPT-4o Image Understanding
 *
 * This template demonstrates:
 * - Image via URL
 * - Image via base64
 * - Multiple images in one request
 * - Detailed image analysis
 * - OCR / text extraction
 * - Object detection
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// IMAGE VIA URL
// =============================================================================

async function imageViaUrl() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What is in this image?' },
          {
            type: 'image_url',
            image_url: {
              url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg',
            },
          },
        ],
      },
    ],
  });

  console.log('Image description:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// IMAGE VIA BASE64
// =============================================================================

async function imageViaBase64() {
  // Read image file
  const imageBuffer = fs.readFileSync('./image.jpg');
  const base64Image = imageBuffer.toString('base64');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image in detail' },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  console.log('Description:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// MULTIPLE IMAGES
// =============================================================================

async function multipleImages() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Compare these two images. What are the differences?' },
          {
            type: 'image_url',
            image_url: {
              url: 'https://example.com/image1.jpg',
            },
          },
          {
            type: 'image_url',
            image_url: {
              url: 'https://example.com/image2.jpg',
            },
          },
        ],
      },
    ],
  });

  console.log('Comparison:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// DETAILED IMAGE ANALYSIS
// =============================================================================

async function detailedAnalysis(imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert image analyst. Provide detailed, structured analysis of images.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image in detail. Include:
1. Main subject/objects
2. Colors and composition
3. Lighting and mood
4. Background elements
5. Any text visible
6. Estimated context/setting`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  });

  console.log('Detailed analysis:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// OCR / TEXT EXTRACTION
// =============================================================================

async function extractText(imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all text visible in this image' },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  });

  console.log('Extracted text:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// OBJECT DETECTION
// =============================================================================

async function detectObjects(imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'List all objects visible in this image with their approximate locations' },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  });

  console.log('Objects detected:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// IMAGE CLASSIFICATION
// =============================================================================

async function classifyImage(imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Classify this image into categories: nature, urban, people, objects, abstract, other',
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  });

  console.log('Classification:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// STRUCTURED OUTPUT WITH VISION
// =============================================================================

async function structuredVisionOutput(imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this image and return structured data' },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'image_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            main_subject: { type: 'string' },
            objects: {
              type: 'array',
              items: { type: 'string' },
            },
            colors: {
              type: 'array',
              items: { type: 'string' },
            },
            mood: { type: 'string' },
            setting: { type: 'string' },
            has_text: { type: 'boolean' },
          },
          required: ['main_subject', 'objects', 'colors', 'mood', 'setting', 'has_text'],
          additionalProperties: false,
        },
      },
    },
  });

  const analysis = JSON.parse(completion.choices[0].message.content!);
  console.log('Structured analysis:', JSON.stringify(analysis, null, 2));

  return analysis;
}

// =============================================================================
// MULTI-TURN CONVERSATION WITH VISION
// =============================================================================

async function conversationWithVision() {
  const messages: any[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://example.com/image.jpg',
          },
        },
      ],
    },
  ];

  // First turn
  const response1 = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
  });

  console.log('Turn 1:', response1.choices[0].message.content);
  messages.push(response1.choices[0].message);

  // Follow-up question
  messages.push({
    role: 'user',
    content: 'Can you describe the colors in more detail?',
  });

  const response2 = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
  });

  console.log('Turn 2:', response2.choices[0].message.content);

  return messages;
}

// =============================================================================
// BATCH IMAGE ANALYSIS
// =============================================================================

async function batchAnalysis(imageUrls: string[]) {
  const results = [];

  for (const url of imageUrls) {
    console.log(`Analyzing: ${url}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Briefly describe this image' },
            { type: 'image_url', image_url: { url } },
          ],
        },
      ],
    });

    results.push({
      url,
      description: completion.choices[0].message.content,
    });

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Analyzed ${results.length} images`);
  return results;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

async function withErrorHandling(imageUrl: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    if (error.message.includes('invalid image')) {
      console.error('Image URL is invalid or inaccessible');
    } else if (error.message.includes('base64')) {
      console.error('Base64 encoding error');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded');
    } else {
      console.error('Vision API error:', error.message);
    }

    throw error;
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Vision (GPT-4o) Examples ===\n');

  // Example 1: Image via URL
  console.log('1. Image via URL:');
  await imageViaUrl();
  console.log();

  // Example 2: Image via base64 (uncomment when you have image.jpg)
  // console.log('2. Image via Base64:');
  // await imageViaBase64();
  // console.log();

  // Example 3: Multiple images
  // console.log('3. Multiple Images:');
  // await multipleImages();
  // console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  imageViaUrl,
  imageViaBase64,
  multipleImages,
  detailedAnalysis,
  extractText,
  detectObjects,
  classifyImage,
  structuredVisionOutput,
  conversationWithVision,
  batchAnalysis,
  withErrorHandling,
};
