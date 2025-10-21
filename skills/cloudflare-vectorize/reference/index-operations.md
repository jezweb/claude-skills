# Index Operations Guide

Complete guide for creating and managing Vectorize indexes.

## Index Configuration

### Critical Decisions (Cannot Be Changed!)

When creating an index, these settings are **permanent**:

1. **Dimensions**: Vector width (must match embedding model)
2. **Distance Metric**: How similarity is calculated

Choose carefully - you cannot change these after creation!

### Dimensions

Dimensions must match your embedding model's output:

| Model | Provider | Dimensions | Recommended Metric |
|-------|----------|------------|-------------------|
| @cf/baai/bge-base-en-v1.5 | Workers AI | 768 | cosine |
| text-embedding-3-small | OpenAI | 1536 | cosine |
| text-embedding-3-large | OpenAI | 3072 | cosine |
| text-embedding-ada-002 | OpenAI (legacy) | 1536 | cosine |
| embed-english-v3.0 | Cohere | 1024 | cosine |

**Common Mistake**: Creating an index with 1536 dimensions but using a 768-dim model!

### Distance Metrics

Choose based on your embedding model and use case:

#### Cosine Similarity (`cosine`)
- **Best for**: Normalized embeddings (most common)
- **Range**: -1 (opposite) to 1 (identical)
- **Use when**: Embeddings are L2-normalized
- **Most common choice** - works with Workers AI, OpenAI, Cohere

```bash
npx wrangler vectorize create my-index \
  --dimensions=768 \
  --metric=cosine
```

#### Euclidean Distance (`euclidean`)
- **Best for**: Absolute distance matters
- **Range**: 0 (identical) to ∞ (different)
- **Use when**: Magnitude of vectors is important
- **Example**: Geographic coordinates, image features

```bash
npx wrangler vectorize create geo-index \
  --dimensions=2 \
  --metric=euclidean
```

#### Dot Product (`dot-product`)
- **Best for**: Non-normalized embeddings
- **Range**: -∞ to ∞
- **Use when**: Embeddings are not normalized
- **Less common** - most models produce normalized embeddings

```bash
npx wrangler vectorize create sparse-index \
  --dimensions=1024 \
  --metric=dot-product
```

## Creating Indexes

### Via Wrangler CLI

```bash
npx wrangler vectorize create <name> \
  --dimensions=<number> \
  --metric=<metric> \
  [--description="<text>"]
```

### Via REST API

```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'my-index',
      description: 'Production semantic search',
      config: {
        dimensions: 768,
        metric: 'cosine',
      },
    }),
  }
);
```

## Metadata Indexes

**⚠️ CRITICAL TIMING**: Create metadata indexes IMMEDIATELY after creating the main index, BEFORE inserting any vectors!

### Why Timing Matters

Vectorize builds metadata indexes **only for vectors inserted AFTER** the metadata index was created. Vectors inserted before won't be filterable!

### Best Practice Workflow

```bash
# 1. Create main index
npx wrangler vectorize create docs-search \
  --dimensions=768 \
  --metric=cosine

# 2. IMMEDIATELY create all metadata indexes
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=category --type=string

npx wrangler vectorize create-metadata-index docs-search \
  --property-name=timestamp --type=number

npx wrangler vectorize create-metadata-index docs-search \
  --property-name=published --type=boolean

# 3. Verify metadata indexes exist
npx wrangler vectorize list-metadata-index docs-search

# 4. NOW safe to start inserting vectors
```

### Metadata Index Limits

- **Max 10 metadata indexes** per Vectorize index
- **String type**: First 64 bytes indexed (UTF-8 boundaries)
- **Number type**: Float64 precision
- **Boolean type**: true/false

### Choosing What to Index

Only create metadata indexes for fields you'll **filter** on:

✅ **Good candidates**:
- `category` (string) - "docs", "tutorials", "guides"
- `language` (string) - "en", "es", "fr"
- `published_at` (number) - Unix timestamp
- `status` (string) - "published", "draft", "archived"
- `verified` (boolean) - true/false

❌ **Bad candidates** (don't need indexes):
- `title` (string) - only for display, not filtering
- `content` (string) - stored in metadata but not filtered
- `url` (string) - unless filtering by URL prefix

## Wrangler Binding

After creating an index, bind it to your Worker:

### wrangler.jsonc

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "vectorize": [
    {
      "binding": "VECTORIZE_INDEX",
      "index_name": "docs-search"
    }
  ]
}
```

### TypeScript Types

```typescript
export interface Env {
  VECTORIZE_INDEX: VectorizeIndex;
}
```

## Index Management Operations

### List All Indexes

```bash
npx wrangler vectorize list
```

### Get Index Details

```bash
npx wrangler vectorize get my-index
```

**Returns**:
```json
{
  "name": "my-index",
  "description": "Production search",
  "config": {
    "dimensions": 768,
    "metric": "cosine"
  },
  "created_on": "2024-01-15T10:30:00Z",
  "modified_on": "2024-01-15T10:30:00Z"
}
```

### Get Index Info (Vector Count)

```bash
npx wrangler vectorize info my-index
```

**Returns**:
```json
{
  "vectorsCount": 12543,
  "lastProcessedMutation": {
    "id": "abc123...",
    "timestamp": "2024-01-20T14:22:00Z"
  }
}
```

### Delete Index

```bash
# With confirmation
npx wrangler vectorize delete my-index

# Skip confirmation (use with caution!)
npx wrangler vectorize delete my-index --force
```

**⚠️ WARNING**: Deletion is **irreversible**! All vectors are permanently lost.

## Index Naming Best Practices

### Good Names

- `production-docs-search` - Environment + purpose
- `dev-product-recommendations` - Environment + use case
- `customer-support-rag` - Descriptive use case
- `en-knowledge-base` - Language + type

### Bad Names

- `index1` - Not descriptive
- `my_index` - Use dashes, not underscores
- `PRODUCTION` - Use lowercase
- `this-is-a-very-long-index-name-that-exceeds-limits` - Too long

### Naming Rules

- Lowercase letters and numbers only
- Dashes allowed (not underscores or spaces)
- Must start with a letter
- Max 32 characters
- No special characters

## Common Patterns

### Multi-Environment Setup

```bash
# Development
npx wrangler vectorize create dev-docs-search \
  --dimensions=768 --metric=cosine

# Staging
npx wrangler vectorize create staging-docs-search \
  --dimensions=768 --metric=cosine

# Production
npx wrangler vectorize create prod-docs-search \
  --dimensions=768 --metric=cosine
```

```jsonc
// wrangler.jsonc
{
  "env": {
    "dev": {
      "vectorize": [
        { "binding": "VECTORIZE", "index_name": "dev-docs-search" }
      ]
    },
    "staging": {
      "vectorize": [
        { "binding": "VECTORIZE", "index_name": "staging-docs-search" }
      ]
    },
    "production": {
      "vectorize": [
        { "binding": "VECTORIZE", "index_name": "prod-docs-search" }
      ]
    }
  }
}
```

### Multi-Tenant with Namespaces

Instead of creating separate indexes per customer, use one index with namespaces:

```bash
# Single index for all tenants
npx wrangler vectorize create multi-tenant-index \
  --dimensions=768 --metric=cosine
```

```typescript
// Insert with namespace
await env.VECTORIZE_INDEX.upsert([{
  id: 'doc-1',
  values: embedding,
  namespace: 'customer-abc123', // Isolates by customer
  metadata: { title: 'Customer document' }
}]);

// Query within namespace
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  topK: 5,
  namespace: 'customer-abc123' // Only search this customer's data
});
```

## Troubleshooting

### "Index name already exists"

```bash
# Check existing indexes
npx wrangler vectorize list

# Delete old index if needed
npx wrangler vectorize delete old-name --force
```

### "Cannot change dimensions"

**No fix** - must create new index and re-insert all vectors.

### "Wrangler version 3.71.0 required"

```bash
# Update Wrangler
npm install -g wrangler@latest

# Or use npx
npx wrangler@latest vectorize create ...
```

## See Also

- [Wrangler Commands](./wrangler-commands.md)
- [Vector Operations](./vector-operations.md)
- [Metadata Guide](./metadata-guide.md)
