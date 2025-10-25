/**
 * Basic Text Generation with Gemini API (Node.js SDK)
 *
 * Demonstrates:
 * - Installing @google/genai (CORRECT SDK, NOT @google/generative-ai)
 * - Basic text generation with gemini-2.5-flash
 * - Accessing response text
 * - Error handling
 *
 * Prerequisites:
 * - npm install @google/genai@1.27.0
 * - export GEMINI_API_KEY="..."
 */

import { GoogleGenAI } from '@google/genai';

async function main() {
  // Initialize the Google GenAI client
  // ⚠️ IMPORTANT: Use @google/genai, NOT @google/generative-ai (deprecated)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Generate content with gemini-2.5-flash
    // Models available: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Explain quantum computing in simple terms for a 10-year-old'
    });

    // Access the generated text
    console.log('Generated text:');
    console.log(response.text);

    // Access full response metadata
    console.log('\nToken usage:');
    console.log('- Prompt tokens:', response.usageMetadata.promptTokenCount);
    console.log('- Response tokens:', response.usageMetadata.candidatesTokenCount);
    console.log('- Total tokens:', response.usageMetadata.totalTokenCount);

    // Check finish reason
    console.log('\nFinish reason:', response.candidates[0].finishReason);
    // Possible values: "STOP" (normal), "MAX_TOKENS", "SAFETY", "OTHER"

  } catch (error: any) {
    console.error('Error generating content:');

    if (error.status === 401) {
      console.error('❌ Invalid API key. Set GEMINI_API_KEY environment variable.');
    } else if (error.status === 429) {
      console.error('❌ Rate limit exceeded. Try again later or implement exponential backoff.');
    } else if (error.status === 404) {
      console.error('❌ Model not found. Use: gemini-2.5-pro, gemini-2.5-flash, or gemini-2.5-flash-lite');
    } else {
      console.error('❌', error.message);
    }
  }
}

main();
