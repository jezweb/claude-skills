/**
 * Google Gemini API - Grounding with Google Search Example
 *
 * Demonstrates how to enable grounding to connect the model to real-time
 * web information, reducing hallucinations and providing up-to-date responses
 * with citations.
 *
 * Features:
 * - Basic grounding with Google Search (Gemini 2.5)
 * - Dynamic retrieval with threshold (Gemini 1.5)
 * - Chat with grounding
 * - Combining grounding with function calling
 * - Checking grounding metadata and citations
 *
 * Requirements:
 * - @google/genai@1.27.0+
 * - GEMINI_API_KEY environment variable
 * - Google Cloud project (grounding requires GCP project, not just API key)
 *
 * Note: Use `googleSearch` for Gemini 2.5 models (recommended)
 *       Use `googleSearchRetrieval` for Gemini 1.5 models (legacy)
 */

import { GoogleGenAI, DynamicRetrievalConfigMode } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function basicGrounding() {
  console.log('=== Basic Grounding Example (Gemini 2.5) ===\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Who won the euro 2024?',
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  console.log('Response:', response.text);

  // Check if grounding was used
  if (response.candidates[0].groundingMetadata) {
    console.log('\n✓ Search was performed!');
    console.log('\nGrounding Metadata:');
    console.log(JSON.stringify(response.candidates[0].groundingMetadata, null, 2));
  } else {
    console.log('\n✓ Model answered from its own knowledge (no search needed)');
  }

  console.log('\n=== Basic Grounding Complete ===');
}

async function dynamicRetrievalExample() {
  console.log('\n=== Dynamic Retrieval Example (Gemini 1.5) ===\n');

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: 'Who won the euro 2024?',
    config: {
      tools: [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: DynamicRetrievalConfigMode.MODE_DYNAMIC,
              dynamicThreshold: 0.7, // Search only if confidence < 70%
            },
          },
        },
      ],
    },
  });

  console.log('Response:', response.text);

  if (response.candidates[0].groundingMetadata) {
    console.log('\n✓ Search performed (confidence < 70%)');
  } else {
    console.log('\n✓ Answered from knowledge (confidence >= 70%)');
  }

  console.log('\n=== Dynamic Retrieval Complete ===');
}

async function chatWithGrounding() {
  console.log('\n=== Chat with Grounding Example ===\n');

  const chat = await ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  // First message
  console.log('User: What are the latest developments in quantum computing?');
  let response = await chat.sendMessage('What are the latest developments in quantum computing?');
  console.log(`\nAssistant: ${response.text}`);

  // Check and display sources
  if (response.candidates[0].groundingMetadata) {
    const sources = response.candidates[0].groundingMetadata.webPages || [];
    console.log(`\n📚 Sources used: ${sources.length}`);
    sources.forEach((source, i) => {
      console.log(`${i + 1}. ${source.title}`);
      console.log(`   ${source.url}`);
    });
  }

  // Follow-up question
  console.log('\n\nUser: Which company made the biggest breakthrough?');
  response = await chat.sendMessage('Which company made the biggest breakthrough?');
  console.log(`\nAssistant: ${response.text}`);

  if (response.candidates[0].groundingMetadata) {
    const sources = response.candidates[0].groundingMetadata.webPages || [];
    console.log(`\n📚 Sources used: ${sources.length}`);
    sources.forEach((source, i) => {
      console.log(`${i + 1}. ${source.title} - ${source.url}`);
    });
  }

  console.log('\n=== Chat with Grounding Complete ===');
}

async function groundingWithFunctionCalling() {
  console.log('\n=== Grounding + Function Calling Example ===\n');

  // Define weather function
  const weatherFunction = {
    name: 'get_current_weather',
    description: 'Get current weather for a location',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      },
      required: ['location'],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'What is the weather like in the city that won Euro 2024?',
    config: {
      tools: [{ googleSearch: {} }, { functionDeclarations: [weatherFunction] }],
    },
  });

  console.log('User query: What is the weather like in the city that won Euro 2024?');
  console.log('\nModel will:');
  console.log('1. Use Google Search to find Euro 2024 winner');
  console.log('2. Call get_current_weather function with the city');
  console.log('3. Combine both results in response\n');

  // Check for function calls
  const functionCall = response.candidates[0].content.parts.find((part) => part.functionCall);

  if (functionCall) {
    console.log('✓ Function call detected:');
    console.log(`  Function: ${functionCall.functionCall?.name}`);
    console.log(`  Arguments:`, functionCall.functionCall?.args);
  }

  if (response.candidates[0].groundingMetadata) {
    console.log('\n✓ Grounding was used');
    const sources = response.candidates[0].groundingMetadata.webPages || [];
    console.log(`  Sources: ${sources.length} web pages`);
  }

  console.log('\n=== Grounding + Function Calling Complete ===');
}

async function checkingGroundingUsage() {
  console.log('\n=== Checking Grounding Usage Example ===\n');

  // Query that doesn't need search
  console.log('Query 1: What is 2+2? (Should NOT need search)');
  const response1 = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'What is 2+2?',
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  console.log(`Answer: ${response1.text}`);
  console.log(
    `Grounding used: ${response1.candidates[0].groundingMetadata ? 'YES' : 'NO'}\n`
  );

  // Query that needs current information
  console.log('Query 2: What happened in the news today? (Should need search)');
  const response2 = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'What are the top news headlines today?',
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  console.log(`Answer: ${response2.text}`);
  console.log(`Grounding used: ${response2.candidates[0].groundingMetadata ? 'YES' : 'NO'}`);

  if (response2.candidates[0].groundingMetadata) {
    console.log('\nSearch queries performed:');
    const queries = response2.candidates[0].groundingMetadata.searchQueries || [];
    queries.forEach((q, i) => {
      console.log(`${i + 1}. ${q.text || q}`);
    });
  }

  console.log('\n=== Checking Grounding Usage Complete ===');
}

async function citationsExample() {
  console.log('\n=== Citations Example ===\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Tell me about the recent Mars rover discoveries',
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  console.log('Response:', response.text);

  if (response.candidates[0].groundingMetadata) {
    const metadata = response.candidates[0].groundingMetadata;

    console.log('\n📚 Web Pages:');
    const webPages = metadata.webPages || [];
    webPages.forEach((page, i) => {
      console.log(`\n${i + 1}. ${page.title}`);
      console.log(`   URL: ${page.url}`);
      if (page.snippet) {
        console.log(`   Snippet: ${page.snippet.substring(0, 100)}...`);
      }
    });

    console.log('\n🔗 Citations:');
    const citations = metadata.citations || [];
    citations.forEach((citation, i) => {
      console.log(`\n${i + 1}. Position: ${citation.startIndex}-${citation.endIndex}`);
      console.log(`   Source: ${citation.uri}`);
    });
  }

  console.log('\n=== Citations Example Complete ===');
}

// Run all examples
async function main() {
  await basicGrounding();
  await dynamicRetrievalExample();
  await chatWithGrounding();
  await groundingWithFunctionCalling();
  await checkingGroundingUsage();
  await citationsExample();
}

main().catch((error) => {
  console.error('Error:', error.message);
  if (error.message.includes('Google Cloud project')) {
    console.error(
      '\nNote: Grounding requires a Google Cloud project, not just an API key.'
    );
  }
  process.exit(1);
});
