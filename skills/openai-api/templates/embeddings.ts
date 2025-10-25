/**
 * OpenAI Embeddings API - Complete Examples
 *
 * This template demonstrates:
 * - Basic embeddings generation
 * - Custom dimensions for storage optimization
 * - Batch processing multiple texts
 * - RAG (Retrieval-Augmented Generation) pattern
 * - Cosine similarity for semantic search
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// BASIC EMBEDDINGS
// =============================================================================

async function basicEmbedding() {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'The food was delicious and the waiter was friendly.',
  });

  console.log('Embedding dimensions:', embedding.data[0].embedding.length);
  console.log('First 5 values:', embedding.data[0].embedding.slice(0, 5));
  console.log('Token usage:', embedding.usage);

  return embedding.data[0].embedding;
}

// =============================================================================
// CUSTOM DIMENSIONS (Storage Optimization)
// =============================================================================

async function customDimensions() {
  // Default: 1536 dimensions
  const fullEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'Sample text',
  });

  console.log('Full dimensions:', fullEmbedding.data[0].embedding.length);

  // Reduced: 256 dimensions (6x storage reduction)
  const reducedEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'Sample text',
    dimensions: 256,
  });

  console.log('Reduced dimensions:', reducedEmbedding.data[0].embedding.length);

  return reducedEmbedding.data[0].embedding;
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

async function batchEmbeddings() {
  const texts = [
    'First document about TypeScript',
    'Second document about Python',
    'Third document about JavaScript',
  ];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 512, // Optional: reduce dimensions
  });

  // Process results
  const embeddings = response.data.map((item, index) => ({
    text: texts[index],
    embedding: item.embedding,
  }));

  console.log(`Generated ${embeddings.length} embeddings`);
  console.log('Total tokens used:', response.usage.total_tokens);

  return embeddings;
}

// =============================================================================
// COSINE SIMILARITY
// =============================================================================

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// =============================================================================
// L2 NORMALIZATION
// =============================================================================

function normalizeL2(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

// =============================================================================
// SEMANTIC SEARCH
// =============================================================================

interface Document {
  text: string;
  embedding: number[];
}

async function semanticSearch(query: string, documents: Document[]) {
  // Embed the query
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const queryVector = queryEmbedding.data[0].embedding;

  // Calculate similarity scores
  const results = documents.map(doc => ({
    text: doc.text,
    similarity: cosineSimilarity(queryVector, doc.embedding),
  }));

  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);

  return results;
}

// =============================================================================
// RAG (Retrieval-Augmented Generation)
// =============================================================================

async function ragExample() {
  // 1. Create knowledge base
  const knowledgeBase = [
    'TypeScript is a superset of JavaScript that adds static typing.',
    'Python is a high-level programming language known for readability.',
    'React is a JavaScript library for building user interfaces.',
    'Node.js is a JavaScript runtime built on Chrome\'s V8 engine.',
  ];

  // 2. Generate embeddings for knowledge base
  const embeddingsResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: knowledgeBase,
  });

  const documents: Document[] = knowledgeBase.map((text, index) => ({
    text,
    embedding: embeddingsResponse.data[index].embedding,
  }));

  // 3. User query
  const userQuery = 'What is TypeScript?';

  // 4. Find relevant documents
  const searchResults = await semanticSearch(userQuery, documents);
  const topResults = searchResults.slice(0, 2); // Top 2 most relevant

  console.log('Most relevant documents:');
  topResults.forEach(result => {
    console.log(`- [${result.similarity.toFixed(3)}] ${result.text}`);
  });

  // 5. Generate answer using retrieved context
  const context = topResults.map(r => r.text).join('\n\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'system',
        content: `Answer the question using the following context:\n\n${context}`,
      },
      {
        role: 'user',
        content: userQuery,
      },
    ],
  });

  console.log('\nAnswer:', completion.choices[0].message.content);

  return completion.choices[0].message.content;
}

// =============================================================================
// DIMENSION REDUCTION (Post-Generation)
// =============================================================================

async function manualDimensionReduction() {
  // Get full embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'Testing 123',
  });

  const fullEmbedding = response.data[0].embedding;
  console.log('Full dimensions:', fullEmbedding.length);

  // Truncate to 256 dimensions
  const truncated = fullEmbedding.slice(0, 256);
  console.log('Truncated dimensions:', truncated.length);

  // Normalize (recommended after truncation)
  const normalized = normalizeL2(truncated);

  return normalized;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Embeddings Examples ===\n');

  // Example 1: Basic embedding
  console.log('1. Basic Embedding:');
  await basicEmbedding();
  console.log();

  // Example 2: Custom dimensions
  console.log('2. Custom Dimensions:');
  await customDimensions();
  console.log();

  // Example 3: Batch processing
  console.log('3. Batch Processing:');
  await batchEmbeddings();
  console.log();

  // Example 4: RAG pattern
  console.log('4. RAG (Retrieval-Augmented Generation):');
  await ragExample();
  console.log();

  // Example 5: Manual dimension reduction
  console.log('5. Manual Dimension Reduction:');
  await manualDimensionReduction();
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicEmbedding,
  customDimensions,
  batchEmbeddings,
  semanticSearch,
  ragExample,
  cosineSimilarity,
  normalizeL2,
};
