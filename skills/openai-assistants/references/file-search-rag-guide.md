# File Search & RAG Guide

Complete guide to implementing Retrieval-Augmented Generation (RAG) with the Assistants API.

---

## What is File Search?

A built-in tool for semantic search over documents using vector stores:
- **Capacity**: Up to 10,000 files per assistant (vs 20 in v1)
- **Technology**: Vector + keyword search with reranking
- **Automatic**: Chunking, embedding, and indexing handled by OpenAI
- **Pricing**: $0.10/GB/day (first 1GB free)

---

## Architecture

```
Documents (PDF, DOCX, MD, etc.)
    ↓
Vector Store (chunking + embeddings)
    ↓
Assistant with file_search tool
    ↓
Semantic Search + Reranking
    ↓
Retrieved Context + LLM Generation
```

---

## Quick Setup

### 1. Create Vector Store

```typescript
const vectorStore = await openai.beta.vectorStores.create({
  name: "Product Documentation",
  expires_after: {
    anchor: "last_active_at",
    days: 30,
  },
});
```

### 2. Upload Documents

```typescript
const files = await Promise.all([
  openai.files.create({ file: fs.createReadStream("doc1.pdf"), purpose: "assistants" }),
  openai.files.create({ file: fs.createReadStream("doc2.md"), purpose: "assistants" }),
]);

const batch = await openai.beta.vectorStores.fileBatches.create(vectorStore.id, {
  file_ids: files.map(f => f.id),
});
```

### 3. Wait for Indexing

```typescript
let batch = await openai.beta.vectorStores.fileBatches.retrieve(vectorStore.id, batch.id);

while (batch.status === 'in_progress') {
  await new Promise(r => setTimeout(r, 2000));
  batch = await openai.beta.vectorStores.fileBatches.retrieve(vectorStore.id, batch.id);
}
```

### 4. Create Assistant

```typescript
const assistant = await openai.beta.assistants.create({
  name: "Knowledge Base Assistant",
  instructions: "Answer questions using the file search tool. Always cite your sources.",
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStore.id],
    },
  },
  model: "gpt-4o",
});
```

---

## Supported File Formats

- `.pdf` - PDFs (most common)
- `.docx` - Word documents
- `.md`, `.txt` - Plain text
- `.html` - HTML documents
- `.json` - JSON data
- `.py`, `.js`, `.ts`, `.cpp`, `.java` - Code files

**Size Limits**:
- **Per file**: 512 MB
- **Total per vector store**: Limited by pricing ($0.10/GB/day)

---

## Chunking Strategy

OpenAI automatically chunks documents using:
- **Max chunk size**: ~800 tokens (configurable internally)
- **Overlap**: Ensures context continuity
- **Hierarchy**: Preserves document structure (headers, sections)

### Optimize for Better Results

**Document Structure**:
```markdown
# Main Topic

## Subtopic 1
Content here...

## Subtopic 2
Content here...
```

**Clear Sections**: Use headers to organize content
**Concise Paragraphs**: Avoid very long paragraphs (500+ words)
**Self-Contained**: Each section should make sense independently

---

## Improving Search Quality

### 1. Better Instructions

```typescript
const assistant = await openai.beta.assistants.create({
  instructions: `You are a support assistant. When answering:
1. Use file_search to find relevant information
2. Synthesize information from multiple sources
3. Always provide citations with file names
4. If information isn't found, say so clearly
5. Don't make up information not in the documents`,
  tools: [{ type: "file_search" }],
  // ...
});
```

### 2. Query Refinement

Encourage users to be specific:
- ❌ "How do I install?"
- ✅ "How do I install the product on Windows 10?"

### 3. Multi-Document Answers

File Search automatically retrieves from multiple documents and combines information.

---

## Citations

### Accessing Citations

```typescript
const messages = await openai.beta.threads.messages.list(thread.id);
const response = messages.data[0];

for (const content of response.content) {
  if (content.type === 'text') {
    console.log('Answer:', content.text.value);

    // Citations
    if (content.text.annotations) {
      for (const annotation of content.text.annotations) {
        if (annotation.type === 'file_citation') {
          console.log('Source:', annotation.file_citation.file_id);
          console.log('Quote:', annotation.file_citation.quote);
        }
      }
    }
  }
}
```

### Displaying Citations

```typescript
let answer = response.content[0].text.value;

// Replace citation markers with clickable links
for (const annotation of response.content[0].text.annotations) {
  if (annotation.type === 'file_citation') {
    const citation = `[${annotation.text}](source: ${annotation.file_citation.file_id})`;
    answer = answer.replace(annotation.text, citation);
  }
}

console.log(answer);
```

---

## Cost Management

### Pricing Structure

- **Storage**: $0.10/GB/day
- **Free tier**: First 1GB
- **Example**: 5GB = $0.40/day = $12/month

### Optimization Strategies

1. **Auto-Expiration**:
```typescript
const vectorStore = await openai.beta.vectorStores.create({
  expires_after: {
    anchor: "last_active_at",
    days: 7, // Delete after 7 days of inactivity
  },
});
```

2. **Cleanup Old Stores**:
```typescript
async function cleanupOldVectorStores() {
  const stores = await openai.beta.vectorStores.list({ limit: 100 });

  for (const store of stores.data) {
    const ageDays = (Date.now() / 1000 - store.created_at) / (60 * 60 * 24);

    if (ageDays > 30) {
      await openai.beta.vectorStores.del(store.id);
    }
  }
}
```

3. **Monitor Usage**:
```typescript
const store = await openai.beta.vectorStores.retrieve(vectorStoreId);
const sizeGB = store.usage_bytes / (1024 * 1024 * 1024);
const costPerDay = Math.max(0, (sizeGB - 1) * 0.10);
console.log(`Daily cost: $${costPerDay.toFixed(4)}`);
```

---

## Advanced Patterns

### Pattern: Multi-Tenant Knowledge Bases

```typescript
// Separate vector store per tenant
const tenantStore = await openai.beta.vectorStores.create({
  name: `Tenant ${tenantId} KB`,
  metadata: { tenant_id: tenantId },
});

// Or: Single store with namespace simulation via file metadata
await openai.files.create({
  file: fs.createReadStream("doc.pdf"),
  purpose: "assistants",
  metadata: { tenant_id: tenantId }, // Coming soon
});
```

### Pattern: Versioned Documentation

```typescript
// Version 1.0
const v1Store = await openai.beta.vectorStores.create({
  name: "Docs v1.0",
  metadata: { version: "1.0" },
});

// Version 2.0
const v2Store = await openai.beta.vectorStores.create({
  name: "Docs v2.0",
  metadata: { version: "2.0" },
});

// Switch based on user preference
const storeId = userVersion === "1.0" ? v1Store.id : v2Store.id;
```

### Pattern: Hybrid Search (File Search + Code Interpreter)

```typescript
const assistant = await openai.beta.assistants.create({
  tools: [
    { type: "file_search" },
    { type: "code_interpreter" },
  ],
  tool_resources: {
    file_search: {
      vector_store_ids: [docsVectorStoreId],
    },
  },
});

// Assistant can search docs AND analyze attached data files
await openai.beta.threads.messages.create(thread.id, {
  content: "Compare this sales data against the targets in our planning docs",
  attachments: [{
    file_id: salesDataFileId,
    tools: [{ type: "code_interpreter" }],
  }],
});
```

---

## Troubleshooting

### No Results Found

**Causes**:
- Vector store not fully indexed
- Poor query formulation
- Documents lack relevant content

**Solutions**:
- Wait for `status: "completed"`
- Refine query to be more specific
- Check document quality and structure

### Irrelevant Results

**Causes**:
- Poor document structure
- Too much noise in documents
- Vague queries

**Solutions**:
- Add clear section headers
- Remove boilerplate/repetitive content
- Improve query specificity

### High Costs

**Causes**:
- Too many vector stores
- Large files that don't expire
- Duplicate content

**Solutions**:
- Set auto-expiration
- Deduplicate documents
- Delete unused stores

---

## Best Practices

1. **Structure documents** with clear headers and sections
2. **Wait for indexing** before using vector store
3. **Set auto-expiration** to manage costs
4. **Monitor storage** regularly
5. **Provide citations** in responses
6. **Refine queries** for better results
7. **Clean up** old vector stores

---

**Last Updated**: 2025-10-25
