# OpenAI Embeddings Integration Example

Complete working example using OpenAI embeddings (text-embedding-3-small/large) with Vectorize.

## Model Specifications

### text-embedding-3-small
- **Dimensions**: 1536
- **Metric**: cosine (recommended)
- **Max Input**: 8191 tokens (~32K characters)
- **Cost**: $0.02 per 1M tokens
- **Best for**: High-quality embeddings at affordable cost

### text-embedding-3-large
- **Dimensions**: 3072
- **Metric**: cosine (recommended)
- **Max Input**: 8191 tokens (~32K characters)
- **Cost**: $0.13 per 1M tokens
- **Best for**: Maximum accuracy

## Setup

### 1. Install OpenAI SDK

```bash
npm install openai
```

### 2. Store API Key

```bash
# Set as Cloudflare secret
npx wrangler secret put OPENAI_API_KEY
# Paste your API key when prompted
```

### 3. Create Vectorize Index

**For text-embedding-3-small**:
```bash
npx wrangler vectorize create openai-search \
  --dimensions=1536 \
  --metric=cosine \
  --description="Semantic search with OpenAI embeddings"
```

**For text-embedding-3-large**:
```bash
npx wrangler vectorize create openai-high-accuracy \
  --dimensions=3072 \
  --metric=cosine
```

### 4. Create Metadata Indexes

```bash
npx wrangler vectorize create-metadata-index openai-search \
  --property-name=category --type=string

npx wrangler vectorize create-metadata-index openai-search \
  --property-name=timestamp --type=number
```

### 5. Configure Wrangler

**wrangler.jsonc**:
```jsonc
{
  "name": "vectorize-openai-example",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-21",
  "vectorize": [
    {
      "binding": "VECTORIZE_INDEX",
      "index_name": "openai-search"
    }
  ],
  "vars": {
    "EMBEDDING_MODEL": "text-embedding-3-small"
  }
}
```

**Note**: OPENAI_API_KEY is stored as a secret, not in wrangler.jsonc!

## Complete Worker Example

```typescript
import OpenAI from 'openai';

export interface Env {
  OPENAI_API_KEY: string;
  VECTORIZE_INDEX: VectorizeIndex;
  EMBEDDING_MODEL?: string; // From wrangler.jsonc vars
}

interface Document {
  id: string;
  title: string;
  content: string;
  category?: string;
  metadata?: Record<string, any>;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    const embeddingModel = env.EMBEDDING_MODEL || 'text-embedding-3-small';
    const url = new URL(request.url);

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // INDEX DOCUMENTS
    if (url.pathname === '/index' && request.method === 'POST') {
      try {
        const { documents } = await request.json() as { documents: Document[] };

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
          return Response.json({ error: 'Invalid documents array' }, { status: 400 });
        }

        // Generate embeddings (batch)
        const response = await openai.embeddings.create({
          model: embeddingModel,
          input: documents.map(doc => doc.content),
          encoding_format: 'float',
        });

        // Prepare vectors
        const vectors = documents.map((doc, i) => ({
          id: doc.id,
          values: response.data[i].embedding,
          metadata: {
            title: doc.title,
            content: doc.content,
            category: doc.category || 'general',
            timestamp: Math.floor(Date.now() / 1000),
            model: embeddingModel,
            ...doc.metadata,
          },
        }));

        // Batch upsert (100 at a time)
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
          const batch = vectors.slice(i, i + batchSize);
          await env.VECTORIZE_INDEX.upsert(batch);
        }

        return Response.json({
          success: true,
          indexed: vectors.length,
          model: embeddingModel,
          usage: {
            prompt_tokens: response.usage.prompt_tokens,
            total_tokens: response.usage.total_tokens,
          },
        }, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      } catch (error) {
        console.error('Indexing error:', error);

        // Handle OpenAI-specific errors
        if (error instanceof OpenAI.APIError) {
          return Response.json({
            error: 'OpenAI API error',
            message: error.message,
            status: error.status,
            code: error.code,
          }, { status: error.status || 500 });
        }

        return Response.json({
          error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    }

    // SEARCH
    if (url.pathname === '/search' && request.method === 'POST') {
      try {
        const { query, topK = 5, filter, namespace } = await request.json() as {
          query: string;
          topK?: number;
          filter?: Record<string, any>;
          namespace?: string;
        };

        if (!query) {
          return Response.json({ error: 'Missing query' }, { status: 400 });
        }

        // Generate query embedding
        const response = await openai.embeddings.create({
          model: embeddingModel,
          input: query,
          encoding_format: 'float',
        });

        // Search Vectorize
        const results = await env.VECTORIZE_INDEX.query(
          response.data[0].embedding,
          {
            topK,
            filter,
            namespace,
            returnMetadata: 'all',
            returnValues: false,
          }
        );

        return Response.json({
          query,
          model: embeddingModel,
          results: results.matches.map(match => ({
            id: match.id,
            score: match.score,
            title: match.metadata?.title,
            content: match.metadata?.content,
            category: match.metadata?.category,
          })),
          count: results.count,
          usage: {
            prompt_tokens: response.usage.prompt_tokens,
          },
        }, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      } catch (error) {
        console.error('Search error:', error);

        if (error instanceof OpenAI.APIError) {
          return Response.json({
            error: 'OpenAI API error',
            message: error.message,
            status: error.status,
          }, { status: error.status || 500 });
        }

        return Response.json({
          error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    }

    // DEFAULT: API Documentation
    return Response.json({
      name: 'Vectorize + OpenAI Embeddings',
      model: embeddingModel,
      endpoints: {
        'POST /index': {
          description: 'Index documents with OpenAI embeddings',
          body: {
            documents: [
              {
                id: 'doc-1',
                title: 'Document Title',
                content: 'Document content (up to 8191 tokens)',
                category: 'tutorials',
              },
            ],
          },
        },
        'POST /search': {
          description: 'Semantic search',
          body: {
            query: 'search query',
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
        "id": "legal-doc-1",
        "title": "Terms of Service",
        "content": "This Terms of Service agreement governs your use of our platform. By accessing or using the service, you agree to be bound by these terms. The service is provided as-is without warranties...",
        "category": "legal",
        "metadata": {
          "version": "2.1",
          "effective_date": "2024-01-01"
        }
      },
      {
        "id": "legal-doc-2",
        "title": "Privacy Policy",
        "content": "We collect and process personal data in accordance with GDPR and other applicable regulations. This policy describes what data we collect, how we use it, and your rights regarding your data...",
        "category": "legal"
      }
    ]
  }'
```

### 2. Search with High Accuracy

```bash
curl -X POST https://your-worker.workers.dev/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are my rights under your privacy policy?",
    "topK": 3,
    "filter": { "category": "legal" }
  }'
```

## Cost Estimation

### text-embedding-3-small ($0.02/1M tokens)

```
1 page ≈ 500 tokens
10,000 pages = 5M tokens = $0.10
100,000 pages = 50M tokens = $1.00
1M pages = 500M tokens = $10.00
```

### text-embedding-3-large ($0.13/1M tokens)

```
10,000 pages = 5M tokens = $0.65
100,000 pages = 50M tokens = $6.50
1M pages = 500M tokens = $65.00
```

## Error Handling

### Rate Limiting

```typescript
async function generateEmbeddingWithRetry(
  text: string,
  openai: OpenAI,
  model: string,
  maxRetries = 3
): Promise<number[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      if (error instanceof OpenAI.APIError && error.status === 429) {
        // Rate limited - exponential backoff
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### API Key Validation

```typescript
if (!env.OPENAI_API_KEY) {
  return Response.json({
    error: 'OpenAI API key not configured',
    message: 'Set OPENAI_API_KEY using: npx wrangler secret put OPENAI_API_KEY',
  }, { status: 500 });
}
```

### Dimension Validation

```typescript
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'test',
});

const dimensions = response.data[0].embedding.length;
console.log(`Embedding dimensions: ${dimensions}`); // Should be 1536

if (dimensions !== 1536) {
  throw new Error(`Expected 1536 dimensions, got ${dimensions}`);
}
```

## Switching Between Models

### Update wrangler.jsonc

```jsonc
{
  "vars": {
    "EMBEDDING_MODEL": "text-embedding-3-large"
  }
}
```

### Create New Index

```bash
# Create index with 3072 dimensions for text-embedding-3-large
npx wrangler vectorize create openai-large \
  --dimensions=3072 \
  --metric=cosine

# Update binding
# wrangler.jsonc:
{
  "vectorize": [
    {
      "binding": "VECTORIZE_INDEX",
      "index_name": "openai-large"
    }
  ]
}
```

## Testing Locally

```bash
# Set API key for local dev
export OPENAI_API_KEY=sk-...

# Run dev server
npx wrangler dev

# Test
curl -X POST http://localhost:8787/index \
  -H "Content-Type: application/json" \
  -d '{"documents":[{"id":"test","title":"Test","content":"Test content"}]}'
```

## Performance Tips

1. **Batch requests**: Up to 2048 inputs per API call
2. **Monitor usage**: Track token consumption in response
3. **Cache embeddings**: Store in Vectorize, don't regenerate
4. **Use smaller model**: text-embedding-3-small is 6.5x cheaper

## Migration from Workers AI

If migrating from Workers AI to OpenAI:

1. Create new index with 1536 or 3072 dimensions
2. Re-generate embeddings with OpenAI
3. Update queries to use same model
4. **Don't mix models!** Always use the same model for index and query

## See Also

- [Main Skill Documentation](../SKILL.md)
- [Embedding Models Reference](../reference/embedding-models.md)
- [Workers AI Example](./workers-ai-bge-base.md)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
