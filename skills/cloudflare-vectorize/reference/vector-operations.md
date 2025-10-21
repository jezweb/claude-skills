# Vector Operations Guide

Complete guide for inserting, querying, updating, and deleting vectors in Vectorize.

## Insert vs Upsert

**Critical difference**:
- **insert()**: Keeps the FIRST vector if ID already exists
- **upsert()**: Overwrites with the LATEST vector if ID already exists

**Use upsert() for updates!**

```typescript
// ❌ Wrong: Updates won't work!
await env.VECTORIZE_INDEX.insert([
  { id: 'doc-1', values: newEmbedding, metadata: { version: 2 } }
]);
// If doc-1 exists, this does nothing!

// ✅ Right: Use upsert for updates
await env.VECTORIZE_INDEX.upsert([
  { id: 'doc-1', values: newEmbedding, metadata: { version: 2 } }
]);
// This WILL update doc-1
```

## Vector Format

```typescript
interface VectorizeVector {
  id: string;                    // Unique identifier
  values: number[] | Float32Array | Float64Array; // Embedding
  namespace?: string;             // Partition key (optional)
  metadata?: Record<string, any>; // Filterable data (optional)
}
```

### ID Guidelines

- **String** type
- **Unique** within namespace
- **Descriptive**: `doc-123`, `user-456-profile`, `chunk-789`
- **Avoid special chars**: Use alphanumeric + dashes
- **Max length**: No official limit, but keep reasonable (<256 chars)

### Values (Embeddings)

Accepted types:
- `number[]` - Most common (from AI APIs)
- `Float32Array` - Memory efficient
- `Float64Array` - High precision (stored as Float32)

**Must match index dimensions exactly!**

```typescript
// ❌ Wrong dimensions
await env.VECTORIZE_INDEX.upsert([{
  id: '1',
  values: [0.1, 0.2] // Index expects 768!
}]);
// Error: "Vector dimensions do not match"

// ✅ Correct dimensions
await env.VECTORIZE_INDEX.upsert([{
  id: '1',
  values: embedding.data[0] // 768 dimensions
}]);
```

## Inserting Vectors

### Single Vector

```typescript
await env.VECTORIZE_INDEX.upsert([{
  id: 'doc-1',
  values: [0.1, 0.2, 0.3, ...], // 768 dims
  metadata: {
    title: 'Getting Started',
    category: 'docs'
  }
}]);
```

### Batch Insert (Recommended)

```typescript
const vectors = documents.map((doc, i) => ({
  id: `doc-${doc.id}`,
  values: embeddings.data[i],
  metadata: {
    title: doc.title,
    content: doc.content,
    category: doc.category
  }
}));

// Insert in batches of 100-1000
const batchSize = 100;
for (let i = 0; i < vectors.length; i += batchSize) {
  const batch = vectors.slice(i, i + batchSize);
  await env.VECTORIZE_INDEX.upsert(batch);
}
```

### With Namespace

```typescript
await env.VECTORIZE_INDEX.upsert([{
  id: 'ticket-123',
  values: embedding,
  namespace: 'customer-abc', // Isolate by customer
  metadata: { type: 'support_ticket' }
}]);
```

## Querying Vectors

### Basic Query

```typescript
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  topK: 5,
});

// Returns: { matches: [...], count: number }
```

### Query with Options

```typescript
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  topK: 10,                    // Return top 10 matches
  returnValues: false,          // Don't return vector values (saves bandwidth)
  returnMetadata: 'all',       // Return all metadata
  namespace: 'customer-abc',   // Query specific namespace
  filter: {                    // Metadata filtering
    category: 'documentation',
    published: true
  }
});
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topK` | number | 10 | Number of results to return (1-100 recommended) |
| `returnValues` | boolean | false | Include vector values in response |
| `returnMetadata` | string | `'none'` | `'none'`, `'indexed'`, or `'all'` |
| `namespace` | string | undefined | Query specific namespace only |
| `filter` | object | undefined | Metadata filter conditions |

### Query Results

```typescript
interface VectorizeMatches {
  matches: Array<{
    id: string;
    score: number;           // Similarity score
    values?: number[];       // If returnValues: true
    metadata?: Record<string, any>; // If returnMetadata: 'all' or 'indexed'
    namespace?: string;
  }>;
  count: number;             // Total matches returned
}
```

### Score Interpretation

**Cosine metric** (most common):
- `1.0` = Identical vectors
- `0.5-0.9` = Similar
- `0.0-0.5` = Somewhat related
- `< 0.0` = Opposite direction
- `-1.0` = Completely opposite

**Euclidean metric**:
- `0.0` = Identical
- `< 1.0` = Very similar
- `1.0-10.0` = Similar
- `> 10.0` = Different

## Metadata Filtering in Queries

See [Metadata Guide](./metadata-guide.md) for complete reference.

### Common Patterns

```typescript
// Exact match
filter: { category: 'docs' }

// Not equals
filter: { status: { $ne: 'archived' } }

// In array
filter: { category: { $in: ['docs', 'tutorials'] } }

// Range (timestamp)
filter: {
  published_at: {
    $gte: 1704067200,
    $lt: 1735689600
  }
}

// Multiple conditions (AND)
filter: {
  category: 'docs',
  language: 'en',
  published: true
}

// Nested metadata
filter: { 'author.verified': true }
```

## Retrieving Vectors

### List Vector IDs

```typescript
const response = await env.VECTORIZE_INDEX.listVectors({
  limit: 100,
  cursor: null, // Or cursor from previous response
});

// Returns: { vectors: [{ id: '...' }, ...], cursor: '...' }
```

### Get Specific Vectors

```typescript
const vectors = await env.VECTORIZE_INDEX.getByIds([
  'doc-1',
  'doc-2',
  'doc-3'
]);

// Returns: Array<VectorizeVector>
```

## Deleting Vectors

### Delete by IDs

```typescript
await env.VECTORIZE_INDEX.deleteByIds([
  'doc-1',
  'doc-2',
  'old-chunk-123'
]);
```

### Delete All Vectors for a Document

```typescript
// If using doc-{id}-chunk-{index} pattern
const docId = 'doc-123';
const allVectors = await env.VECTORIZE_INDEX.listVectors({ limit: 1000 });

const chunkIds = allVectors.vectors
  .filter(v => v.id.startsWith(`${docId}-chunk-`))
  .map(v => v.id);

if (chunkIds.length > 0) {
  await env.VECTORIZE_INDEX.deleteByIds(chunkIds);
}
```

## Performance Tips

### Batch Operations

✅ **Good** - Batch insert/upsert:
```typescript
await env.VECTORIZE_INDEX.upsert(arrayOf100Vectors);
```

❌ **Bad** - Individual operations:
```typescript
for (const vector of vectors) {
  await env.VECTORIZE_INDEX.upsert([vector]); // Slow!
}
```

### Optimal Batch Sizes

- **Insert/Upsert**: 100-1000 vectors per batch
- **Delete**: 100-500 IDs per batch
- **Query**: topK = 3-10 for best latency

### Return Only What You Need

```typescript
// ✅ Efficient - no vector values
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  topK: 5,
  returnValues: false,    // Saves bandwidth
  returnMetadata: 'all'   // Only metadata needed
});

// ❌ Wasteful - returns 768 floats per match
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  topK: 5,
  returnValues: true,     // Unnecessary if not using values
  returnMetadata: 'all'
});
```

### Namespace for Multi-Tenancy

Use namespaces instead of separate indexes:

```typescript
// ✅ One index, isolated by namespace
await env.VECTORIZE_INDEX.upsert([{
  id: 'doc-1',
  values: embedding,
  namespace: `customer-${customerId}`,
  metadata: { ... }
}]);

// Query only customer's data
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  namespace: `customer-${customerId}`,
  topK: 5
});
```

## Common Errors

### "Vector dimensions do not match"

```typescript
// Check your embedding dimensions
const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: 'test'
});
console.log(embedding.data[0].length); // Should match index dimensions (768)
```

### "Metadata property not indexed"

```typescript
// Create metadata index first!
// npx wrangler vectorize create-metadata-index my-index --property-name=category --type=string

// Then you can filter
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  filter: { category: 'docs' } // Now works!
});
```

### "Insert vs Upsert not working"

```typescript
// Use upsert for updates, not insert
await env.VECTORIZE_INDEX.upsert([{ // ✅ Use upsert
  id: 'existing-doc',
  values: newEmbedding,
  metadata: { version: 2 }
}]);
```

## See Also

- [Metadata Guide](./metadata-guide.md)
- [Wrangler Commands](./wrangler-commands.md)
- [Embedding Models](./embedding-models.md)
