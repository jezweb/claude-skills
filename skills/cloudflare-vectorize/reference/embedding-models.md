# Embedding Models Reference

Complete guide for generating vector embeddings with Workers AI and OpenAI.

## Model Comparison

| Model | Provider | Dimensions | Metric | Cost | Performance |
|-------|----------|------------|--------|------|-------------|
| @cf/baai/bge-base-en-v1.5 | Workers AI | 768 | cosine | Free | Fast, edge-optimized |
| text-embedding-3-small | OpenAI | 1536 | cosine | $0.02/1M tokens | High quality, affordable |
| text-embedding-3-large | OpenAI | 3072 | cosine | $0.13/1M tokens | Highest accuracy |
| text-embedding-ada-002 | OpenAI (legacy) | 1536 | cosine | $0.10/1M tokens | Deprecated |

## Workers AI (@cf/baai/bge-base-en-v1.5)

**Best for**: Production apps requiring free, fast embeddings with good quality.

### Configuration

```bash
# Create index with 768 dimensions
npx wrangler vectorize create my-index \
  --dimensions=768 \
  --metric=cosine
```

### Wrangler Binding

```jsonc
{
  "ai": {
    "binding": "AI"
  },
  "vectorize": [
    {
      "binding": "VECTORIZE_INDEX",
      "index_name": "my-index"
    }
  ]
}
```

### Single Text

```typescript
const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: "Cloudflare Workers are serverless functions."
});

// embedding.data[0] is number[] with 768 dimensions
await env.VECTORIZE_INDEX.upsert([{
  id: 'doc-1',
  values: embedding.data[0],
  metadata: { title: 'Workers Intro' }
}]);
```

### Batch Embeddings

```typescript
const texts = [
  "Document 1 content",
  "Document 2 content",
  "Document 3 content"
];

const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: texts  // Array of strings
});

// embeddings.data is number[][] (array of 768-dim vectors)
const vectors = texts.map((text, i) => ({
  id: `doc-${i}`,
  values: embeddings.data[i],
  metadata: { content: text }
}));

await env.VECTORIZE_INDEX.upsert(vectors);
```

### Error Handling

```typescript
try {
  const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: userQuery
  });

  if (!embedding?.data?.[0]) {
    throw new Error('No embedding returned');
  }

  // Use embedding
} catch (error) {
  console.error('Embedding generation failed:', error);
  // Fallback logic
}
```

### Limits

- **Max input length**: ~512 tokens (~2000 characters)
- **Batch size**: Up to 100 texts per request
- **Rate limits**: Generous (Workers AI scales automatically)
- **Cost**: Free!

## OpenAI Embeddings

**Best for**: Higher quality embeddings, larger context windows, or specific use cases.

### API Key Setup

Store API key as environment variable:

```bash
npx wrangler secret put OPENAI_API_KEY
```

### text-embedding-3-small (1536 dimensions)

**Best for**: Cost-effective high quality embeddings.

#### Configuration

```bash
# Create index with 1536 dimensions
npx wrangler vectorize create my-index \
  --dimensions=1536 \
  --metric=cosine
```

#### Worker Code

```typescript
import OpenAI from 'openai';

export interface Env {
  OPENAI_API_KEY: string;
  VECTORIZE_INDEX: VectorizeIndex;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // Single embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "Text to embed",
      encoding_format: "float" // Default
    });

    await env.VECTORIZE_INDEX.upsert([{
      id: 'doc-1',
      values: response.data[0].embedding,  // 1536 dimensions
      metadata: { model: 'openai-3-small' }
    }]);

    return Response.json({ success: true });
  }
};
```

#### Batch Embeddings

```typescript
const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: [
    "Document 1",
    "Document 2",
    "Document 3"
  ]
});

const vectors = response.data.map((item, i) => ({
  id: `doc-${i}`,
  values: item.embedding,
  metadata: { index: i }
}));

await env.VECTORIZE_INDEX.upsert(vectors);
```

### text-embedding-3-large (3072 dimensions)

**Best for**: Maximum accuracy, research, or high-stakes applications.

```bash
# Create index with 3072 dimensions
npx wrangler vectorize create high-accuracy-index \
  --dimensions=3072 \
  --metric=cosine
```

```typescript
const response = await openai.embeddings.create({
  model: "text-embedding-3-large",
  input: "Text requiring high accuracy embedding"
});

await env.VECTORIZE_INDEX.upsert([{
  id: 'doc-1',
  values: response.data[0].embedding,  // 3072 dimensions
  metadata: { model: 'openai-3-large' }
}]);
```

### OpenAI Error Handling

```typescript
try {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });

  return response.data[0].embedding;
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limited');
    // Implement retry with backoff
  } else if (error.status === 401) {
    console.error('Invalid API key');
  } else {
    console.error('OpenAI error:', error);
  }
  throw error;
}
```

### OpenAI Limits

- **text-embedding-3-small**: 8191 tokens input
- **text-embedding-3-large**: 8191 tokens input
- **Batch size**: Up to 2048 inputs per request
- **Rate limits**: Varies by tier (check OpenAI dashboard)

## Model Selection Guide

### Use Workers AI (@cf/baai/bge-base-en-v1.5) when:

✅ Building production apps with budget constraints
✅ Need fast, edge-optimized embeddings
✅ Working with English text
✅ Don't need extremely high accuracy
✅ Want zero per-request costs

### Use OpenAI text-embedding-3-small when:

✅ Need higher quality than Workers AI
✅ Budget allows ($0.02/1M tokens is affordable)
✅ Working with multilingual content
✅ Need longer context (8191 tokens)
✅ Willing to pay for better accuracy

### Use OpenAI text-embedding-3-large when:

✅ Accuracy is critical (legal, medical, research)
✅ Large budget ($0.13/1M tokens)
✅ Need best possible search quality
✅ Working with complex or nuanced content

## Embedding Best Practices

### 1. Consistent Model Usage

**Always use the SAME model for indexing and querying!**

```typescript
// ❌ Wrong: Different models
// Index with Workers AI
const indexEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: document
});

// Query with OpenAI (WRONG!)
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: query
});
// This won't work - different embedding spaces!

// ✅ Right: Same model
const indexEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: document
});
const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: query
});
```

### 2. Text Preprocessing

```typescript
function preprocessText(text: string): string {
  return text
    .trim()                    // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .slice(0, 8000);           // Truncate to model limits
}

const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: preprocessText(rawText)
});
```

### 3. Batch for Efficiency

```typescript
// ✅ Good: Batch processing
const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: arrayOf100Texts
});

// ❌ Bad: Individual requests
for (const text of texts) {
  const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text
  });
}
```

### 4. Cache Embeddings

```typescript
// Store embeddings, don't regenerate
await env.VECTORIZE_INDEX.upsert([{
  id: 'doc-1',
  values: embedding,
  metadata: {
    content: text,           // Store original
    model: 'bge-base-en-v1.5',
    generated_at: Date.now()
  }
}]);

// Later: Retrieve embedding instead of regenerating
const vectors = await env.VECTORIZE_INDEX.getByIds(['doc-1']);
const cachedEmbedding = vectors[0].values; // Reuse!
```

### 5. Handle Failures Gracefully

```typescript
async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  try {
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text });
    return response.data[0];
  } catch (error) {
    console.error('Primary embedding failed, trying fallback');

    // Fallback to OpenAI if Workers AI fails
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const fallback = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });

    return fallback.data[0].embedding;
  }
}
```

## Testing Embedding Quality

### Compare Similarity Scores

```typescript
// Test known similar texts
const text1 = "Cloudflare Workers are serverless functions";
const text2 = "Workers are serverless code running on Cloudflare's edge";
const text3 = "Unrelated content about cooking recipes";

const [emb1, emb2, emb3] = await Promise.all([
  env.AI.run('@cf/baai/bge-base-en-v1.5', { text: text1 }),
  env.AI.run('@cf/baai/bge-base-en-v1.5', { text: text2 }),
  env.AI.run('@cf/baai/bge-base-en-v1.5', { text: text3 }),
]);

const similar = cosineSimilarity(emb1.data[0], emb2.data[0]); // Should be high (>0.7)
const different = cosineSimilarity(emb1.data[0], emb3.data[0]); // Should be low (<0.3)
```

### Cosine Similarity Helper

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}
```

## Dimension Mismatch Debugging

```typescript
// Check actual dimensions before upserting
const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: "test"
});

console.log('Embedding dimensions:', embedding.data[0].length);

// Verify against index
const indexInfo = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/my-index`,
  { headers: { 'Authorization': `Bearer ${apiToken}` } }
);
const indexConfig = await indexInfo.json();
console.log('Index dimensions:', indexConfig.result.config.dimensions);

// Must match!
if (embedding.data[0].length !== indexConfig.result.config.dimensions) {
  throw new Error('Dimension mismatch!');
}
```

## See Also

- [Vector Operations](./vector-operations.md)
- [Index Operations](./index-operations.md)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/#text-embeddings)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
