# Workers AI Integration Example (@cf/baai/bge-base-en-v1.5)

Complete working example using Cloudflare Workers AI for embeddings with Vectorize.

## Model Specifications

- **Model**: `@cf/baai/bge-base-en-v1.5`
- **Dimensions**: 768
- **Metric**: cosine (recommended)
- **Max Input**: ~512 tokens (~2000 characters)
- **Cost**: Free
- **Latency**: ~50-200ms (edge-optimized)

## Setup

### 1. Create Vectorize Index

```bash
npx wrangler vectorize create docs-search \
  --dimensions=768 \
  --metric=cosine \
  --description="Documentation search with Workers AI"
```

### 2. Create Metadata Indexes

```bash
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=category --type=string

npx wrangler vectorize create-metadata-index docs-search \
  --property-name=published_at --type=number
```

### 3. Configure Wrangler

**wrangler.jsonc**:
```jsonc
{
  "name": "vectorize-workers-ai-example",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-21",
  "ai": {
    "binding": "AI"
  },
  "vectorize": [
    {
      "binding": "VECTORIZE_INDEX",
      "index_name": "docs-search"
    }
  ]
}
```

## Complete Worker Example

```typescript
export interface Env {
  AI: Ai;
  VECTORIZE_INDEX: VectorizeIndex;
}

interface Document {
  id: string;
  title: string;
  content: string;
  category?: string;
  url?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // INDEX DOCUMENTS
    if (url.pathname === '/index' && request.method === 'POST') {
      try {
        const { documents } = await request.json() as { documents: Document[] };

        if (!documents || !Array.isArray(documents)) {
          return Response.json({ error: 'Invalid documents array' }, { status: 400 });
        }

        // Extract text for embedding
        const texts = documents.map(doc => doc.content);

        // Generate embeddings (batch)
        const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: texts
        });

        // Prepare vectors
        const vectors = documents.map((doc, i) => ({
          id: doc.id,
          values: embeddings.data[i],
          metadata: {
            title: doc.title,
            content: doc.content,
            category: doc.category || 'general',
            url: doc.url,
            published_at: Math.floor(Date.now() / 1000),
          },
        }));

        // Upsert to Vectorize
        await env.VECTORIZE_INDEX.upsert(vectors);

        return Response.json({
          success: true,
          indexed: vectors.length,
          ids: vectors.map(v => v.id),
        });
      } catch (error) {
        return Response.json({
          error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    }

    // SEARCH
    if (url.pathname === '/search' && request.method === 'POST') {
      try {
        const { query, topK = 5, filter } = await request.json() as {
          query: string;
          topK?: number;
          filter?: Record<string, any>;
        };

        if (!query) {
          return Response.json({ error: 'Missing query' }, { status: 400 });
        }

        // Generate query embedding
        const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: query,
        });

        // Search Vectorize
        const results = await env.VECTORIZE_INDEX.query(
          queryEmbedding.data[0],
          {
            topK,
            filter,
            returnMetadata: 'all',
            returnValues: false,
          }
        );

        return Response.json({
          query,
          results: results.matches.map(match => ({
            id: match.id,
            score: match.score,
            title: match.metadata?.title,
            content: match.metadata?.content,
            category: match.metadata?.category,
            url: match.metadata?.url,
          })),
          count: results.count,
        });
      } catch (error) {
        return Response.json({
          error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    }

    // DEFAULT: API Documentation
    return Response.json({
      name: 'Vectorize + Workers AI Example',
      endpoints: {
        'POST /index': {
          description: 'Index documents',
          body: {
            documents: [
              {
                id: 'doc-1',
                title: 'Document Title',
                content: 'Document content for embedding',
                category: 'tutorials',
                url: '/docs/getting-started',
              },
            ],
          },
        },
        'POST /search': {
          description: 'Semantic search',
          body: {
            query: 'search query text',
            topK: 5,
            filter: { category: 'tutorials' },
          },
        },
      },
    });
  },
};
```

## Usage Examples

### 1. Index Documents

```bash
curl -X POST https://your-worker.workers.dev/index \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "workers-intro",
        "title": "Introduction to Cloudflare Workers",
        "content": "Cloudflare Workers allow you to deploy serverless code globally across Cloudflare's edge network. Workers run on V8 isolates providing fast cold starts.",
        "category": "documentation",
        "url": "/workers/getting-started"
      },
      {
        "id": "vectorize-intro",
        "title": "Introduction to Vectorize",
        "content": "Vectorize is a globally distributed vector database for semantic search and AI applications. It integrates seamlessly with Workers AI for embedding generation.",
        "category": "documentation",
        "url": "/vectorize/getting-started"
      },
      {
        "id": "d1-intro",
        "title": "Introduction to D1",
        "content": "D1 is Cloudflare's serverless SQL database built on SQLite. It provides familiar SQL semantics with global distribution.",
        "category": "documentation",
        "url": "/d1/getting-started"
      }
    ]
  }'
```

### 2. Search

```bash
curl -X POST https://your-worker.workers.dev/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I deploy serverless functions?",
    "topK": 3,
    "filter": { "category": "documentation" }
  }'
```

**Response**:
```json
{
  "query": "How do I deploy serverless functions?",
  "results": [
    {
      "id": "workers-intro",
      "score": 0.87,
      "title": "Introduction to Cloudflare Workers",
      "content": "Cloudflare Workers allow you to deploy...",
      "category": "documentation",
      "url": "/workers/getting-started"
    },
    {
      "id": "vectorize-intro",
      "score": 0.62,
      "title": "Introduction to Vectorize",
      "content": "Vectorize is a globally distributed...",
      "category": "documentation",
      "url": "/vectorize/getting-started"
    }
  ],
  "count": 2
}
```

## Performance Tips

### 1. Batch Embeddings

```typescript
// ✅ Good: Single API call for multiple texts
const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: [text1, text2, text3, ...] // Up to 100 texts
});

// ❌ Bad: Multiple API calls
for (const text of texts) {
  const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text
  });
}
```

### 2. Optimize Return Data

```typescript
// Only return what you need
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  topK: 5,
  returnValues: false,     // Don't return 768 floats per result
  returnMetadata: 'all',   // Return metadata only
});
```

### 3. Use Filters

```typescript
// Narrow search scope with metadata filters
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  topK: 5,
  filter: {
    category: 'documentation',
    published_at: { $gte: lastWeek }
  }
});
```

## Error Handling

```typescript
async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  try {
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: text.trim().slice(0, 2000) // Truncate to model limits
    });

    if (!response?.data?.[0]) {
      throw new Error('No embedding returned from Workers AI');
    }

    if (response.data[0].length !== 768) {
      throw new Error(`Expected 768 dimensions, got ${response.data[0].length}`);
    }

    return response.data[0];
  } catch (error) {
    console.error('Workers AI embedding error:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

## Testing Locally

```bash
# Install dependencies
npm install

# Run dev server
npx wrangler dev

# Test indexing
curl -X POST http://localhost:8787/index \
  -H "Content-Type: application/json" \
  -d '{"documents":[{"id":"test-1","title":"Test","content":"Test content"}]}'

# Test search
curl -X POST http://localhost:8787/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","topK":5}'
```

## Deployment

```bash
# Deploy to production
npx wrangler deploy

# View logs
npx wrangler tail
```

## Common Issues

### "Embedding dimensions don't match"
- **Cause**: Index created with wrong dimensions
- **Fix**: Ensure index has 768 dimensions for bge-base-en-v1.5

### "Text too long for model"
- **Cause**: Input text exceeds ~2000 characters
- **Fix**: Truncate or chunk text before embedding

### "Rate limiting"
- **Cause**: Too many concurrent requests
- **Fix**: Workers AI scales automatically, but add retry logic for safety

## See Also

- [Main Skill Documentation](../SKILL.md)
- [RAG Chat Template](../templates/rag-chat.ts)
- [Embedding Models Reference](../reference/embedding-models.md)
- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/)
