import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Example 1: Single image analysis
async function analyzeSingleImage(imagePath: string) {
  // Read and encode image as base64
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString('base64');

  // Determine media type from file extension
  const ext = path.extname(imagePath).toLowerCase();
  const mediaTypeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  const mediaType = mediaTypeMap[ext] || 'image/jpeg';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'What is in this image? Describe it in detail.',
          },
        ],
      },
    ],
  });

  const textContent = message.content.find(block => block.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log('Claude:', textContent.text);
  }

  return message;
}

// Example 2: Multiple images comparison
async function compareImages(image1Path: string, image2Path: string) {
  const image1Data = fs.readFileSync(image1Path).toString('base64');
  const image2Data = fs.readFileSync(image2Path).toString('base64');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Compare these two images. What are the similarities and differences?',
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image1Data,
            },
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image2Data,
            },
          },
        ],
      },
    ],
  });

  const textContent = message.content.find(block => block.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log('Comparison:', textContent.text);
  }
}

// Example 3: Vision with tools
const searchTool: Anthropic.Tool = {
  name: 'search_product',
  description: 'Search for similar products',
  input_schema: {
    type: 'object',
    properties: {
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords to search for',
      },
    },
    required: ['keywords'],
  },
};

async function visionWithTools(imagePath: string) {
  const imageData = fs.readFileSync(imagePath).toString('base64');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    tools: [searchTool],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageData,
            },
          },
          {
            type: 'text',
            text: 'Identify the objects in this image and search for similar products',
          },
        ],
      },
    ],
  });

  console.log('Stop reason:', message.stop_reason);

  if (message.stop_reason === 'tool_use') {
    for (const block of message.content) {
      if (block.type === 'tool_use') {
        console.log('Tool requested:', block.name);
        console.log('Search keywords:', block.input);
      }
    }
  }
}

// Example 4: Multi-turn conversation with images
async function multiTurnVision(imagePath: string) {
  const imageData = fs.readFileSync(imagePath).toString('base64');

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageData,
          },
        },
        {
          type: 'text',
          text: 'What objects are visible in this image?',
        },
      ],
    },
  ];

  // First turn
  const response1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages,
  });

  const text1 = response1.content.find(b => b.type === 'text');
  if (text1 && text1.type === 'text') {
    console.log('Claude:', text1.text);
    messages.push({ role: 'assistant', content: text1.text });
  }

  // Second turn - follow-up question (image still in context)
  messages.push({
    role: 'user',
    content: 'What color is the largest object?',
  });

  const response2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages,
  });

  const text2 = response2.content.find(b => b.type === 'text');
  if (text2 && text2.type === 'text') {
    console.log('Claude:', text2.text);
  }
}

// Example 5: Vision with prompt caching
async function visionWithCaching(imagePath: string) {
  const imageData = fs.readFileSync(imagePath).toString('base64');

  // First request - cache the image
  const response1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageData,
            },
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: 'Describe the main objects in this image',
          },
        ],
      },
    ],
  });

  console.log('First request - cache creation:', response1.usage.cache_creation_input_tokens);

  const text1 = response1.content.find(b => b.type === 'text');
  if (text1 && text1.type === 'text') {
    console.log('Response 1:', text1.text);
  }

  // Second request - use cached image (within 5 minutes)
  const response2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageData, // Same image
            },
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: 'What colors are prominent in this image?',
          },
        ],
      },
    ],
  });

  console.log('Second request - cache read:', response2.usage.cache_read_input_tokens);
  console.log('Token savings: ~90%');
}

// Example 6: Image URL (if accessible)
async function analyzeImageFromURL(imageUrl: string) {
  // Note: Image must be publicly accessible
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: 'Analyze this image',
          },
        ],
      },
    ],
  });

  const textContent = message.content.find(block => block.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log('Analysis:', textContent.text);
  }
}

// Example 7: Image validation helper
function validateImage(filePath: string): { valid: boolean; error?: string } {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'File does not exist' };
  }

  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);

  if (fileSizeMB > 5) {
    return { valid: false, error: 'Image exceeds 5MB limit' };
  }

  const ext = path.extname(filePath).toLowerCase();
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  if (!supportedFormats.includes(ext)) {
    return { valid: false, error: `Unsupported format. Use: ${supportedFormats.join(', ')}` };
  }

  return { valid: true };
}

// Example 8: Batch image analysis
async function analyzeMultipleImages(imagePaths: string[]) {
  const results = [];

  for (const imagePath of imagePaths) {
    console.log(`\nAnalyzing: ${imagePath}`);

    const validation = validateImage(imagePath);
    if (!validation.valid) {
      console.error(`Error: ${validation.error}`);
      continue;
    }

    try {
      const result = await analyzeSingleImage(imagePath);
      results.push({ imagePath, result });
    } catch (error) {
      console.error(`Failed to analyze ${imagePath}:`, error);
    }

    // Rate limiting pause
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// Run examples (with placeholder paths)
if (require.main === module) {
  const exampleImagePath = './example-image.jpg';

  // Check if example image exists
  if (fs.existsSync(exampleImagePath)) {
    console.log('=== Single Image Analysis ===\n');
    analyzeSingleImage(exampleImagePath)
      .then(() => {
        console.log('\n=== Vision with Caching ===\n');
        return visionWithCaching(exampleImagePath);
      })
      .catch(console.error);
  } else {
    console.log('Example image not found. Create example-image.jpg to test.');
    console.log('\nValidation example:');
    const validation = validateImage('./non-existent.jpg');
    console.log(validation);
  }
}

export {
  analyzeSingleImage,
  compareImages,
  visionWithTools,
  multiTurnVision,
  visionWithCaching,
  analyzeImageFromURL,
  validateImage,
  analyzeMultipleImages,
};
