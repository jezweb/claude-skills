/**
 * Google Gemini API - Context Caching Example
 *
 * Demonstrates how to create and use context caching to reduce costs by up to 90%
 * when using the same large context (documents, videos, system instructions) repeatedly.
 *
 * Features:
 * - Create cache with large document
 * - Use cache for multiple queries
 * - Update cache TTL
 * - List and delete caches
 *
 * Requirements:
 * - @google/genai@1.27.0+
 * - GEMINI_API_KEY environment variable
 *
 * Note: You must use explicit model version suffixes like 'gemini-2.5-flash-001',
 * not just 'gemini-2.5-flash' when creating caches.
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function contextCachingExample() {
  console.log('=== Context Caching Example ===\n');

  // Example: Large document content
  const largeDocument = `
    This is a large legal document that will be analyzed multiple times.

    Article 1: ...
    Article 2: ...
    ... (imagine thousands of lines of legal text)
  `.trim();

  // 1. Create a cache with large content
  console.log('1. Creating cache...');
  const cache = await ai.caches.create({
    model: 'gemini-2.5-flash-001', // Must use explicit version suffix!
    config: {
      displayName: 'legal-doc-cache',
      systemInstruction: 'You are an expert legal analyst. Analyze documents and provide clear summaries.',
      contents: largeDocument,
      ttl: '3600s', // Cache for 1 hour
    },
  });

  console.log(`✓ Cache created: ${cache.name}`);
  console.log(`  Display name: ${cache.displayName}`);
  console.log(`  Expires at: ${cache.expireTime}\n`);

  // 2. Use cache for multiple queries (saves tokens!)
  console.log('2. Using cache for first query...');
  const response1 = await ai.models.generateContent({
    model: cache.name, // Use cache name as model
    contents: 'Summarize the key points of Article 1',
  });
  console.log(`Response: ${response1.text}\n`);

  console.log('3. Using cache for second query...');
  const response2 = await ai.models.generateContent({
    model: cache.name,
    contents: 'What are the legal implications of Article 2?',
  });
  console.log(`Response: ${response2.text}\n`);

  // 3. Update cache TTL to extend lifetime
  console.log('4. Extending cache TTL to 2 hours...');
  await ai.caches.update({
    name: cache.name,
    config: {
      ttl: '7200s', // Extend to 2 hours
    },
  });
  console.log('✓ Cache TTL updated\n');

  // 4. List all caches
  console.log('5. Listing all caches...');
  const caches = await ai.caches.list();
  caches.forEach((c) => {
    console.log(`  - ${c.displayName}: ${c.name}`);
  });
  console.log();

  // 5. Delete cache when done
  console.log('6. Deleting cache...');
  await ai.caches.delete({ name: cache.name });
  console.log('✓ Cache deleted\n');

  console.log('=== Context Caching Complete ===');
}

async function videoCachingExample() {
  console.log('\n=== Video Caching Example ===\n');

  // Upload a video file
  console.log('1. Uploading video file...');
  const videoFile = await ai.files.upload({
    file: fs.createReadStream('./example-video.mp4'),
  });

  console.log('2. Waiting for video processing...');
  let processedFile = videoFile;
  while (processedFile.state.name === 'PROCESSING') {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    processedFile = await ai.files.get({ name: videoFile.name });
  }
  console.log(`✓ Video processed: ${processedFile.uri}\n`);

  // Create cache with video
  console.log('3. Creating cache with video...');
  const cache = await ai.caches.create({
    model: 'gemini-2.5-flash-001',
    config: {
      displayName: 'video-analysis-cache',
      systemInstruction: 'You are an expert video analyzer.',
      contents: [processedFile],
      ttl: '300s', // 5 minutes
    },
  });
  console.log(`✓ Cache created: ${cache.name}\n`);

  // Use cache for multiple video queries
  console.log('4. Query 1: What happens in the first minute?');
  const response1 = await ai.models.generateContent({
    model: cache.name,
    contents: 'What happens in the first minute?',
  });
  console.log(`Response: ${response1.text}\n`);

  console.log('5. Query 2: Describe the main characters');
  const response2 = await ai.models.generateContent({
    model: cache.name,
    contents: 'Describe the main characters',
  });
  console.log(`Response: ${response2.text}\n`);

  // Clean up
  await ai.caches.delete({ name: cache.name });
  await ai.files.delete({ name: videoFile.name });
  console.log('✓ Cache and video file deleted');

  console.log('\n=== Video Caching Complete ===');
}

// Run examples
contextCachingExample()
  .then(() => videoCachingExample())
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
