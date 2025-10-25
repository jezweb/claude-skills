# Migration from Assistants API v1 to v2

**v1 Deprecated**: December 18, 2024 (no longer accessible)
**v2 Status**: Production (Deprecated H1 2026 in favor of Responses API)

---

## Breaking Changes

### 1. Retrieval Tool → File Search

**v1:**
```typescript
{
  tools: [{ type: "retrieval" }],
  file_ids: ["file_abc123", "file_def456"]
}
```

**v2:**
```typescript
{
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: {
      vector_store_ids: ["vs_abc123"]
    }
  }
}
```

**Action**: Create vector stores and migrate files.

### 2. File Attachments

**v1**: Files attached at assistant level
**v2**: Files attached at message level

**v1:**
```typescript
const assistant = await openai.beta.assistants.create({
  file_ids: ["file_abc123"],
});
```

**v2:**
```typescript
await openai.beta.threads.messages.create(thread.id, {
  content: "...",
  attachments: [{
    file_id: "file_abc123",
    tools: [{ type: "code_interpreter" }]
  }],
});
```

### 3. Instructions Character Limit

- **v1**: 32,000 characters
- **v2**: 256,000 characters (8x increase)

---

## Migration Steps

### Step 1: Create Vector Stores

```typescript
// Old v1 approach
const assistant = await openai.beta.assistants.create({
  tools: [{ type: "retrieval" }],
  file_ids: fileIds, // Direct attachment
});

// New v2 approach
const vectorStore = await openai.beta.vectorStores.create({
  name: "Knowledge Base",
});

await openai.beta.vectorStores.fileBatches.create(vectorStore.id, {
  file_ids: fileIds,
});

const assistant = await openai.beta.assistants.create({
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStore.id],
    },
  },
});
```

### Step 2: Update File Attachments

```typescript
// Move file attachments from assistant to messages
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "Analyze this file",
  attachments: [{
    file_id: "file_abc123",
    tools: [{ type: "code_interpreter" }],
  }],
});
```

### Step 3: Test Thoroughly

- Verify file search returns expected results
- Check Code Interpreter file handling
- Test streaming if used
- Validate function calling patterns

---

## New v2 Features

### 1. Massive File Capacity

- **v1**: ~20 files per assistant
- **v2**: 10,000 files per assistant (500x increase)

### 2. Better Search Performance

- Vector + keyword search
- Parallel query processing
- Advanced reranking

### 3. Auto-Expiration

```typescript
const vectorStore = await openai.beta.vectorStores.create({
  expires_after: {
    anchor: "last_active_at",
    days: 30,
  },
});
```

### 4. Batch File Operations

```typescript
const batch = await openai.beta.vectorStores.fileBatches.create(vectorStoreId, {
  file_ids: ["file_1", "file_2", "file_3"],
});
```

---

## Cost Implications

### v1 (Deprecated)
- No separate storage costs for retrieval

### v2
- **Storage**: $0.10/GB/day for vector stores
- **Free tier**: First 1GB
- **Optimization**: Use auto-expiration

---

## Recommended Path Forward

**For existing v1 applications:**
1. Migrate to v2 immediately (v1 no longer works)
2. Plan migration to Responses API (v2 sunset in H1 2026)

**For new applications:**
- ✅ Use [Responses API](../../openai-responses/SKILL.md)
- ❌ Don't use Assistants API (being deprecated)

---

## Migration Checklist

- [ ] Update to openai SDK 6.7.0+
- [ ] Create vector stores for file search
- [ ] Migrate file attachments to message level
- [ ] Test file search results
- [ ] Update to `file_search` from `retrieval`
- [ ] Implement vector store cleanup
- [ ] Monitor storage costs
- [ ] Plan migration to Responses API

---

**Last Updated**: 2025-10-25
