# Vector Stores - Complete Reference

In-depth guide to OpenAI's Vector Stores for the Assistants API.

---

## Overview

Vector Stores provide scalable semantic search infrastructure for the file_search tool:
- **Capacity**: Up to 10,000 files per assistant
- **Automatic**: Chunking, embedding, indexing
- **Search**: Vector + keyword hybrid with reranking
- **Pricing**: $0.10/GB/day (first 1GB free)

---

## Creating Vector Stores

### Basic Creation

```typescript
const vectorStore = await openai.beta.vectorStores.create({
  name: "Company Knowledge Base",
});
```

### With Auto-Expiration

```typescript
const vectorStore = await openai.beta.vectorStores.create({
  name: "Temporary KB",
  expires_after: {
    anchor: "last_active_at",
    days: 7,
  },
});
```

**Anchors**:
- `last_active_at`: Expires N days after last use (recommended)
- `created_at`: Expires N days after creation (not yet available)

### With Metadata

```typescript
const vectorStore = await openai.beta.vectorStores.create({
  name: "Q4 2025 Documentation",
  metadata: {
    department: "sales",
    quarter: "Q4-2025",
    version: "1.0",
  },
});
```

---

## Adding Files

### Single File Upload

```typescript
// 1. Upload file to OpenAI
const file = await openai.files.create({
  file: fs.createReadStream("document.pdf"),
  purpose: "assistants",
});

// 2. Add to vector store
await openai.beta.vectorStores.files.create(vectorStore.id, {
  file_id: file.id,
});
```

### Batch Upload (Recommended)

```typescript
// Upload multiple files
const files = await Promise.all([
  openai.files.create({ file: fs.createReadStream("doc1.pdf"), purpose: "assistants" }),
  openai.files.create({ file: fs.createReadStream("doc2.md"), purpose: "assistants" }),
  openai.files.create({ file: fs.createReadStream("doc3.docx"), purpose: "assistants" }),
]);

// Batch add to vector store
const batch = await openai.beta.vectorStores.fileBatches.create(vectorStore.id, {
  file_ids: files.map(f => f.id),
});

// Monitor progress
let batchStatus = batch;
while (batchStatus.status === 'in_progress') {
  await new Promise(r => setTimeout(r, 1000));
  batchStatus = await openai.beta.vectorStores.fileBatches.retrieve(
    vectorStore.id,
    batch.id
  );
  console.log(`${batchStatus.file_counts.completed}/${batchStatus.file_counts.total}`);
}
```

**Benefits of Batch Upload**:
- Faster processing (parallel indexing)
- Single operation to track
- Better error handling

---

## Vector Store States

| State | Description |
|-------|-------------|
| `in_progress` | Files being indexed |
| `completed` | All files indexed successfully |
| `failed` | Indexing failed |
| `expired` | Auto-expiration triggered |

**Important**: Wait for `completed` before using with assistants.

---

## File Management

### List Files in Vector Store

```typescript
const files = await openai.beta.vectorStores.files.list(vectorStore.id, {
  limit: 100,
});

for (const file of files.data) {
  console.log(`${file.id}: ${file.status}`);
}
```

### Remove File from Vector Store

```typescript
await openai.beta.vectorStores.files.del(vectorStore.id, fileId);
```

**Note**: This removes the file from the vector store but doesn't delete the file from OpenAI's storage.

### Check File Status

```typescript
const file = await openai.beta.vectorStores.files.retrieve(vectorStore.id, fileId);

console.log(file.status); // "in_progress", "completed", "failed"

if (file.status === 'failed') {
  console.error(file.last_error);
}
```

---

## Pricing & Cost Management

### Pricing Structure

- **Storage**: $0.10 per GB per day
- **Free tier**: First 1GB
- **Calculation**: Total vector store size (not original file size)

**Example Costs**:
| Original Files | Vector Store Size | Daily Cost | Monthly Cost |
|----------------|-------------------|------------|--------------|
| 500 MB | 0.5 GB | $0.00 | $0.00 (free tier) |
| 2 GB | 2 GB | $0.10 | $3.00 |
| 10 GB | 10 GB | $0.90 | $27.00 |
| 50 GB | 50 GB | $4.90 | $147.00 |

### Monitor Usage

```typescript
const store = await openai.beta.vectorStores.retrieve(vectorStoreId);

const sizeGB = store.usage_bytes / (1024 * 1024 * 1024);
const costPerDay = Math.max(0, (sizeGB - 1) * 0.10);
const costPerMonth = costPerDay * 30;

console.log(`Storage: ${sizeGB.toFixed(2)} GB`);
console.log(`Cost: $${costPerDay.toFixed(4)}/day ($${costPerMonth.toFixed(2)}/month)`);
```

### Cost Optimization

**1. Auto-Expiration**:
```typescript
expires_after: {
  anchor: "last_active_at",
  days: 30,
}
```

**2. Regular Cleanup**:
```typescript
async function cleanupUnusedVectorStores() {
  const stores = await openai.beta.vectorStores.list({ limit: 100 });

  for (const store of stores.data) {
    const ageDays = (Date.now() / 1000 - store.created_at) / (60 * 60 * 24);

    if (ageDays > 90) { // 90 days old
      await openai.beta.vectorStores.del(store.id);
      console.log(`Deleted: ${store.name}`);
    }
  }
}
```

**3. Deduplicate Content**:
- Remove duplicate files before upload
- Combine similar documents
- Archive old versions

---

## Using with Assistants

### Attach to Assistant

```typescript
const assistant = await openai.beta.assistants.create({
  name: "Support Bot",
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStore.id],
    },
  },
  model: "gpt-4o",
});
```

### Multiple Vector Stores

```typescript
// Combine multiple knowledge bases
tool_resources: {
  file_search: {
    vector_store_ids: [generalKBId, productDocsId, policyDocsId],
  },
}
```

**Limit**: Maximum of 1 vector store per assistant in current API (subject to change).

---

## Advanced Operations

### Update Metadata

```typescript
const updated = await openai.beta.vectorStores.update(vectorStoreId, {
  name: "Updated Name",
  metadata: {
    version: "2.0",
    last_updated: new Date().toISOString(),
  },
});
```

### Retrieve Vector Store Details

```typescript
const store = await openai.beta.vectorStores.retrieve(vectorStoreId);

console.log({
  id: store.id,
  name: store.name,
  status: store.status,
  usage_bytes: store.usage_bytes,
  file_counts: store.file_counts,
  created_at: new Date(store.created_at * 1000),
  expires_at: store.expires_at ? new Date(store.expires_at * 1000) : null,
  metadata: store.metadata,
});
```

### List All Vector Stores

```typescript
const stores = await openai.beta.vectorStores.list({
  limit: 20,
  order: "desc",
});

for (const store of stores.data) {
  console.log(`${store.name}: ${store.file_counts.completed} files`);
}
```

---

## Best Practices

### 1. Pre-Process Documents

- Remove headers/footers
- Clean formatting
- Extract text from images (OCR separately)
- Organize with clear structure

### 2. Monitor Indexing

```typescript
async function waitForIndexing(vectorStoreId: string, batchId: string) {
  let batch;
  const startTime = Date.now();

  do {
    batch = await openai.beta.vectorStores.fileBatches.retrieve(vectorStoreId, batchId);

    if (batch.status === 'failed') {
      throw new Error('Batch indexing failed');
    }

    console.log(`Progress: ${batch.file_counts.completed}/${batch.file_counts.total}`);

    await new Promise(r => setTimeout(r, 2000));

    // Timeout after 10 minutes
    if (Date.now() - startTime > 600000) {
      throw new Error('Indexing timeout');
    }
  } while (batch.status === 'in_progress');

  return batch;
}
```

### 3. Set Reasonable Expiration

```typescript
// For temporary projects
expires_after: { anchor: "last_active_at", days: 7 }

// For active knowledge bases
expires_after: { anchor: "last_active_at", days: 90 }

// For permanent KB (no expiration)
// Don't set expires_after
```

### 4. Tag with Metadata

```typescript
metadata: {
  project: "project-alpha",
  environment: "production",
  version: "1.0",
  owner: "team@company.com",
}
```

---

## Troubleshooting

### Files Not Indexing

**Check file status**:
```typescript
const file = await openai.beta.vectorStores.files.retrieve(vectorStoreId, fileId);

if (file.status === 'failed') {
  console.error(file.last_error);
}
```

**Common causes**:
- Unsupported file format
- Corrupted file
- File too large (>512 MB)

### Vector Store Shows `failed` Status

**Check batch details**:
```typescript
const batch = await openai.beta.vectorStores.fileBatches.retrieve(vectorStoreId, batchId);
console.log(batch.file_counts); // Check failed count
```

**Solutions**:
- Remove failed files
- Re-upload with correct format
- Check error messages

### High Storage Costs

**Audit vector stores**:
```typescript
const stores = await openai.beta.vectorStores.list({ limit: 100 });
let totalGB = 0;

for (const store of stores.data) {
  const sizeGB = store.usage_bytes / (1024 * 1024 * 1024);
  totalGB += sizeGB;
  console.log(`${store.name}: ${sizeGB.toFixed(2)} GB`);
}

console.log(`Total: ${totalGB.toFixed(2)} GB = $${((totalGB - 1) * 0.10).toFixed(2)}/day`);
```

---

## Limits

| Resource | Limit |
|----------|-------|
| Files per vector store | 10,000 |
| Vector stores per account | Not documented |
| File size | 512 MB |
| Storage (billable) | Unlimited (pay per GB) |
| Indexing time | Varies by size |

---

**Last Updated**: 2025-10-25
