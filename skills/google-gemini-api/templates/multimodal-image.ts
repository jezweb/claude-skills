/**
 * Multimodal Image Understanding with Gemini API
 *
 * Demonstrates:
 * - Image analysis with vision capabilities
 * - Base64 encoding of images
 * - Combining text and image inputs
 * - Multiple images in one request
 *
 * Prerequisites:
 * - npm install @google/genai@1.27.0
 * - export GEMINI_API_KEY="..."
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Example 1: Analyze a single image
    console.log('Example 1: Analyze Single Image\n');

    // Load image from file
    const imagePath = '/path/to/image.jpg'; // Replace with actual path
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');

    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'Describe this image in detail. What objects, people, or scenes do you see?' },
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg' // or 'image/png', 'image/webp', etc.
              }
            }
          ]
        }
      ]
    });

    console.log(response1.text);
    console.log('\n---\n');

    // Example 2: Compare two images
    console.log('Example 2: Compare Two Images\n');

    const imagePath2 = '/path/to/image2.jpg'; // Replace with actual path
    const imageData2 = fs.readFileSync(imagePath2);
    const base64Image2 = imageData2.toString('base64');

    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'Compare these two images. What are the similarities and differences?' },
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { inlineData: { data: base64Image2, mimeType: 'image/jpeg' } }
          ]
        }
      ]
    });

    console.log(response2.text);
    console.log('\n---\n');

    // Example 3: Specific questions about image
    console.log('Example 3: Specific Questions\n');

    const response3 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'How many people are in this image? What are they wearing?' },
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
          ]
        }
      ]
    });

    console.log(response3.text);

  } catch (error: any) {
    console.error('Error:', error.message);

    if (error.message.includes('ENOENT')) {
      console.error('\n⚠️ Image file not found. Update the imagePath variable with a valid path.');
    }
  }
}

/**
 * Supported image formats:
 * - JPEG (.jpg, .jpeg)
 * - PNG (.png)
 * - WebP (.webp)
 * - HEIC (.heic)
 * - HEIF (.heif)
 *
 * Max size: 20MB per image
 *
 * Tips:
 * - Use specific, detailed prompts for better results
 * - You can analyze multiple images in one request
 * - gemini-2.5-flash and gemini-2.5-pro both support vision
 */

main();
