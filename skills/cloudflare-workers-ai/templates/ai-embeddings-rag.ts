/**
 * Cloudflare Workers AI - Embeddings & RAG Examples
 *
 * This template demonstrates:
 * - Generating text embeddings with BGE models
 * - Storing embeddings in Vectorize
 * - Semantic search with vector similarity
 * - Complete RAG (Retrieval Augmented Generation) pattern
 * - Document chunking strategies
 */

import { Hono } from 'hono';

type Bindings = {
  AI: Ai;
  VECTORIZE: Vectorize;
  DB?: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============================================================================
// Generate Embeddings
// ============================================================================

/**
 * Generate embeddings for text
 * BGE-base: 768 dimensions, good balance
 * BGE-large: 1024 dimensions, higher accuracy
 * BGE-small: 384 dimensions, faster/smaller
 */

app.post('/embeddings', async (c) => {
  try {
    const { text } = await c.req.json<{ text: string | string[] }>();

    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: Array.isArray(text) ? text : [text],
    });

    return c.json({
      success: true,
      shape: embeddings.shape, // [batch_size, dimensions]
      data: embeddings.data, // Array of vectors
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
// Batch Embeddings
// ============================================================================

/**
 * Generate embeddings for multiple texts in one request
 * More efficient than individual requests
 */

app.post('/embeddings/batch', async (c) => {
  try {
    const { texts } = await c.req.json<{ texts: string[] }>();

    if (!texts || texts.length === 0) {
      return c.json({ error: 'texts array is required' }, 400);
    }

    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: texts,
    });

    return c.json({
      success: true,
      count: texts.length,
      shape: embeddings.shape,
      embeddings: embeddings.data,
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
// Store Embeddings in Vectorize
// ============================================================================

app.post('/documents', async (c) => {
  try {
    const { id, text, metadata } = await c.req.json<{
      id: string;
      text: string;
      metadata?: Record<string, any>;
    }>();

    // Generate embedding
    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [text],
    });

    const vector = embeddings.data[0];

    // Store in Vectorize
    await c.env.VECTORIZE.upsert([
      {
        id,
        values: vector,
        metadata: {
          text,
          ...metadata,
          createdAt: Date.now(),
        },
      },
    ]);

    return c.json({
      success: true,
      message: 'Document indexed',
      id,
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
// Semantic Search
// ============================================================================

app.post('/search', async (c) => {
  try {
    const { query, topK = 5 } = await c.req.json<{
      query: string;
      topK?: number;
    }>();

    // Convert query to embedding
    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [query],
    });

    const vector = embeddings.data[0];

    // Search Vectorize
    const results = await c.env.VECTORIZE.query(vector, {
      topK,
      returnMetadata: true,
    });

    return c.json({
      success: true,
      query,
      results: results.matches.map((match) => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.text,
        metadata: match.metadata,
      })),
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
// RAG Pattern: Query with Context
// ============================================================================

app.post('/rag/ask', async (c) => {
  try {
    const { question, topK = 3 } = await c.req.json<{
      question: string;
      topK?: number;
    }>();

    // Step 1: Convert question to embedding
    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [question],
    });

    const vector = embeddings.data[0];

    // Step 2: Find relevant documents
    const results = await c.env.VECTORIZE.query(vector, {
      topK,
      returnMetadata: true,
    });

    // Step 3: Build context from matches
    const context = results.matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n');

    // Step 4: Generate answer with context
    const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `Answer the question using ONLY the following context. If the context doesn't contain relevant information, say "I don't have enough information to answer that."\n\nContext:\n${context}`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      stream: true,
    });

    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'x-sources': JSON.stringify(
          results.matches.map((m) => ({ id: m.id, score: m.score }))
        ),
      },
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
// Document Chunking
// ============================================================================

/**
 * Split long documents into chunks for better embedding quality
 * Recommended: 200-500 tokens per chunk
 */

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }

  return chunks;
}

app.post('/documents/long', async (c) => {
  try {
    const { id, text, chunkSize = 500 } = await c.req.json<{
      id: string;
      text: string;
      chunkSize?: number;
    }>();

    // Split into chunks
    const chunks = chunkText(text, chunkSize);

    // Generate embeddings for all chunks
    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: chunks,
    });

    // Store each chunk in Vectorize
    const vectors = chunks.map((chunk, index) => ({
      id: `${id}-chunk-${index}`,
      values: embeddings.data[index],
      metadata: {
        documentId: id,
        chunkIndex: index,
        text: chunk,
        totalChunks: chunks.length,
      },
    }));

    await c.env.VECTORIZE.upsert(vectors);

    return c.json({
      success: true,
      message: 'Document indexed with chunks',
      documentId: id,
      chunks: chunks.length,
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
// RAG with Citations
// ============================================================================

app.post('/rag/ask-with-citations', async (c) => {
  try {
    const { question } = await c.req.json<{ question: string }>();

    // Find relevant chunks
    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [question],
    });

    const results = await c.env.VECTORIZE.query(embeddings.data[0], {
      topK: 5,
      returnMetadata: true,
    });

    // Build context with citations
    const context = results.matches
      .map(
        (match, i) =>
          `[Source ${i + 1}] ${match.metadata?.text} (Relevance: ${(match.score * 100).toFixed(1)}%)`
      )
      .join('\n\n');

    // Generate answer
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `Answer the question using the provided sources. Cite sources using [Source N] format.

${context}`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
    });

    return c.json({
      success: true,
      answer: response.response,
      sources: results.matches.map((m, i) => ({
        id: i + 1,
        documentId: m.metadata?.documentId,
        text: m.metadata?.text,
        score: m.score,
      })),
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
// Hybrid Search (Keyword + Semantic)
// ============================================================================

/**
 * Combine keyword search (D1) with semantic search (Vectorize)
 * for better recall
 */

app.post('/search/hybrid', async (c) => {
  try {
    const { query } = await c.req.json<{ query: string }>();

    // Semantic search
    const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [query],
    });

    const vectorResults = await c.env.VECTORIZE.query(embeddings.data[0], {
      topK: 5,
      returnMetadata: true,
    });

    // Keyword search (if D1 available)
    let keywordResults: any[] = [];
    if (c.env.DB) {
      const { results } = await c.env.DB.prepare(
        'SELECT id, text FROM documents WHERE text LIKE ? LIMIT 5'
      )
        .bind(`%${query}%`)
        .all();

      keywordResults = results || [];
    }

    // Combine and deduplicate
    const combined = [
      ...vectorResults.matches.map((m) => ({
        id: m.id,
        text: m.metadata?.text,
        score: m.score,
        source: 'vector',
      })),
      ...keywordResults.map((r) => ({
        id: r.id,
        text: r.text,
        score: 1.0,
        source: 'keyword',
      })),
    ];

    // Deduplicate by ID
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

    return c.json({
      success: true,
      query,
      results: unique,
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
// Delete Documents
// ============================================================================

app.delete('/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Delete from Vectorize
    await c.env.VECTORIZE.deleteByIds([id]);

    return c.json({
      success: true,
      message: 'Document deleted',
      id,
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
