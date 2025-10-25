# Embeddings Guide

**Last Updated**: 2025-10-25

Complete guide to OpenAI's Embeddings API for semantic search, RAG, and clustering.

---

## Model Comparison

| Model | Default Dimensions | Custom Dimensions | Best For |
|-------|-------------------|-------------------|----------|
| text-embedding-3-large | 3072 | 256-3072 | Highest quality semantic search |
| text-embedding-3-small | 1536 | 256-1536 | Most applications, cost-effective |
| text-embedding-ada-002 | 1536 | Fixed | Legacy (use v3 models) |

---

## Dimension Selection

### Full Dimensions
- **text-embedding-3-small**: 1536 (default)
- **text-embedding-3-large**: 3072 (default)
- Use for maximum accuracy

### Reduced Dimensions
- **256 dims**: 4-12x storage reduction, minimal quality loss
- **512 dims**: 2-6x storage reduction, good quality
- Use for cost/storage optimization

```typescript
// Full dimensions (1536)
const full = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Sample text',
});

// Reduced dimensions (256)
const reduced = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Sample text',
  dimensions: 256,
});
```

---

## RAG (Retrieval-Augmented Generation) Pattern

### 1. Build Knowledge Base

```typescript
const documents = [
  'TypeScript is a superset of JavaScript',
  'Python is a high-level programming language',
  'React is a JavaScript library for UIs',
];

const embeddings = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: documents,
});

const knowledgeBase = documents.map((text, i) => ({
  text,
  embedding: embeddings.data[i].embedding,
}));
```

### 2. Query with Similarity Search

```typescript
// Embed user query
const queryEmbedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'What is TypeScript?',
});

// Find similar documents
const similarities = knowledgeBase.map(doc => ({
  text: doc.text,
  similarity: cosineSimilarity(queryEmbedding.data[0].embedding, doc.embedding),
}));

similarities.sort((a, b) => b.similarity - a.similarity);
const topResults = similarities.slice(0, 3);
```

### 3. Generate Answer with Context

```typescript
const context = topResults.map(r => r.text).join('\n\n');

const completion = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: `Answer using this context:\n\n${context}` },
    { role: 'user', content: 'What is TypeScript?' },
  ],
});
```

---

## Similarity Metrics

### Cosine Similarity (Recommended)

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### Euclidean Distance

```typescript
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}
```

---

## Batch Processing

```typescript
// Process up to 2048 documents
const embeddings = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: documents, // Array of strings
});

embeddings.data.forEach((item, index) => {
  console.log(`Doc ${index}: ${item.embedding.length} dimensions`);
});
```

**Limits**:
- Max tokens per input: 8192
- Max summed tokens across all inputs: 300,000
- Array dimension max: 2048

---

## Best Practices

✅ **Pre-processing**:
- Normalize text (lowercase, remove special chars)
- Be consistent across queries and documents
- Chunk long documents (max 8192 tokens)

✅ **Storage**:
- Use custom dimensions (256-512) for storage optimization
- Store embeddings in vector databases (Pinecone, Weaviate, Qdrant)
- Cache embeddings (deterministic for same input)

✅ **Search**:
- Use cosine similarity for comparison
- Normalize embeddings before storing (L2 normalization)
- Pre-filter with metadata before similarity search

❌ **Don't**:
- Mix models (incompatible dimensions)
- Exceed token limits (8192 per input)
- Skip normalization
- Use raw embeddings without similarity metric

---

## Use Cases

1. **Semantic Search**: Find similar documents
2. **RAG**: Retrieve context for generation
3. **Clustering**: Group similar content
4. **Recommendations**: Content-based recommendations
5. **Anomaly Detection**: Detect outliers
6. **Duplicate Detection**: Find similar/duplicate content

---

**See Also**: Official Embeddings Guide (https://platform.openai.com/docs/guides/embeddings)
