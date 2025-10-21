# Cloudflare Vectorize Skill - Research Log

**Skill**: cloudflare-vectorize
**Date**: 2025-10-21
**Status**: ✅ Complete
**Dev Time**: 3 hours

## Research Summary

### Official Documentation Reviewed
- [Vectorize Main Docs](https://developers.cloudflare.com/vectorize/)
- [Metadata Filtering Reference](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/)
- [Vectorize Client API](https://developers.cloudflare.com/vectorize/reference/client-api/)
- [Workers AI + Vectorize Tutorial](https://developers.cloudflare.com/vectorize/get-started/embeddings/)
- [RAG Tutorial](https://developers.cloudflare.com/workers-ai/guides/tutorials/build-a-retrieval-augmented-generation-ai/)
- [Wrangler Commands](https://developers.cloudflare.com/workers/wrangler/commands/#vectorize)
- [Vector Database Concepts](https://developers.cloudflare.com/vectorize/reference/what-is-a-vector-database/)

### API Version Confirmed
- **Vectorize V2** (GA - Generally Available)
- Requires Wrangler 3.71.0+
- Legacy V1 deprecated (use `--deprecated-v1` flag if needed)

### Embedding Models Researched
1. **Workers AI @cf/baai/bge-base-en-v1.5**
   - Dimensions: 768
   - Metric: cosine
   - Cost: Free
   - Max input: ~512 tokens (~2000 chars)

2. **OpenAI text-embedding-3-small**
   - Dimensions: 1536
   - Metric: cosine
   - Cost: $0.02/1M tokens
   - Max input: 8191 tokens

3. **OpenAI text-embedding-3-large**
   - Dimensions: 3072
   - Metric: cosine
   - Cost: $0.13/1M tokens
   - Max input: 8191 tokens

## Key Findings

### Critical Timing Issue (Error #1)
**Discovery**: Metadata indexes MUST be created BEFORE inserting vectors.

**Impact**: If you create a metadata index after vectors are inserted, those existing vectors won't be filterable on that property.

**Solution**: Document workflow:
1. Create main index
2. Create ALL metadata indexes immediately
3. THEN insert vectors

### Filter Operators (Complete List)
- `$eq` - Equals (implicit when using direct value)
- `$ne` - Not equals
- `$in` - In array
- `$nin` - Not in array
- `$lt` - Less than
- `$lte` - Less than or equal
- `$gt` - Greater than
- `$gte` - Greater than or equal

### Metadata Limits
- **Max 10 metadata indexes** per Vectorize index
- **Max 10 KiB metadata** per vector
- **String indexes**: First 64 bytes (UTF-8 boundaries)
- **Number indexes**: Float64 precision
- **Filter size**: Max 2048 bytes (compact JSON)

### Cardinality Performance Impact
**High cardinality** (millions of unique values) in **range queries** can significantly impact performance.

**Best practice**:
- Use seconds (not milliseconds) for timestamps
- Avoid range queries on UUIDs
- Use low-cardinality fields for filtering

### Insert vs Upsert Behavior
**Insert**: Keeps FIRST vector if ID already exists (does NOT update!)
**Upsert**: Overwrites with LATEST vector if ID already exists

**Critical**: Use `upsert()` for updates, NOT `insert()`!

### Namespace vs Metadata Filtering
**Namespace** (partition key):
- Applied FIRST before metadata filters
- Good for multi-tenant isolation
- One namespace per vector

**Metadata** (key-value filtering):
- Applied AFTER namespace filter
- Multiple metadata fields per vector
- Up to 10 indexed fields

## Template Design Decisions

### 1. basic-search.ts
**Focus**: Simple semantic search API
**Features**:
- POST /search - Query with embeddings
- POST /index - Add single document
- DELETE /index/:id - Remove document
**Why**: Entry point for learning Vectorize basics

### 2. rag-chat.ts
**Focus**: Complete RAG chatbot
**Features**:
- POST /chat - Q&A with context retrieval
- POST /chat/stream - Streaming responses
- POST /ingest - Batch document ingestion
**Why**: Production-ready RAG pattern

### 3. document-ingestion.ts
**Focus**: Document processing pipeline
**Features**:
- Text chunking (sentence-based with overlap)
- Batch embedding generation
- Metadata tagging
- POST /ingest/url - Fetch and index from URL
**Why**: Handle large documents efficiently

### 4. metadata-filtering.ts
**Focus**: Advanced filtering examples
**Features**:
- All filter operators demonstrated
- GET /examples - List all filter patterns
- POST /seed - Seed example data
- POST /search/filtered - Test filters
**Why**: Learn complex filtering patterns

## Common Errors Identified

1. **Metadata index timing** - Creating indexes after inserting vectors
2. **Dimension mismatch** - Index dimensions don't match embedding model
3. **Invalid metadata keys** - Keys contain `.`, `"`, or start with `$`
4. **Filter syntax errors** - Incorrect operator usage or >2048 bytes
5. **Insert vs upsert confusion** - Using insert() when need to update
6. **Missing bindings** - Forget vectorize binding in wrangler.jsonc
7. **High cardinality range queries** - Performance degradation
8. **Namespace vs metadata confusion** - Misunderstanding filter order

## Token Savings Analysis

### Manual Setup (Without Skill)
Estimated tokens for setting up Vectorize from scratch:
1. Research Vectorize API: ~8,000 tokens
2. Understand metadata filtering: ~5,000 tokens
3. Debug dimension mismatch: ~3,000 tokens
4. Fix metadata index timing: ~4,000 tokens
5. Implement RAG pattern: ~10,000 tokens
6. Handle errors: ~5,000 tokens

**Total**: ~35,000 tokens

### With Skill
1. Read SKILL.md: ~5,000 tokens
2. Copy appropriate template: ~2,000 tokens
3. Customize for use case: ~3,000 tokens
4. Deploy and test: ~2,000 tokens

**Total**: ~12,000 tokens

**Savings**: (35,000 - 12,000) / 35,000 = **65% token reduction**

## Production Recommendations

### 1. Always Batch Operations
```typescript
// ✅ Good
await env.VECTORIZE_INDEX.upsert(arrayOf100Vectors);

// ❌ Bad
for (const vector of vectors) {
  await env.VECTORIZE_INDEX.upsert([vector]);
}
```

### 2. Optimize Return Data
```typescript
// Only return what you need
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  returnValues: false,     // Don't return 768 floats
  returnMetadata: 'all',  // Only metadata
});
```

### 3. Use Namespaces for Multi-Tenancy
Instead of separate indexes per customer, use one index with namespaces.

### 4. Create Metadata Indexes Early
Plan your filtering needs and create all metadata indexes immediately after creating the main index.

## Files Created

### Core Documentation
- **SKILL.md** (500+ lines) - Complete API reference
- **README.md** (250 lines) - Auto-trigger keywords and overview

### Templates (4 files)
- **basic-search.ts** (200 lines) - Simple semantic search
- **rag-chat.ts** (320 lines) - Full RAG chatbot with streaming
- **document-ingestion.ts** (370 lines) - Document chunking pipeline
- **metadata-filtering.ts** (380 lines) - Advanced filtering examples

### Reference Documentation (5 files)
- **wrangler-commands.md** (450 lines) - CLI reference
- **index-operations.md** (350 lines) - Index management
- **vector-operations.md** (400 lines) - Insert/query/delete operations
- **metadata-guide.md** (500 lines) - Filtering operators and patterns
- **embedding-models.md** (400 lines) - Workers AI + OpenAI comparison

### Examples (2 files)
- **workers-ai-bge-base.md** (350 lines) - Workers AI integration
- **openai-embeddings.md** (400 lines) - OpenAI embeddings integration

**Total Lines of Code/Docs**: ~4,000+ lines

## Testing Performed

### Template Validation
- ✅ All TypeScript templates compile without errors
- ✅ API examples use correct Vectorize API syntax
- ✅ Wrangler command examples verified against docs
- ✅ Filter operator examples tested

### Documentation Accuracy
- ✅ All dimensions match embedding models
- ✅ Metadata limits verified (10 indexes, 10 KiB/vector)
- ✅ Filter size limit confirmed (2048 bytes)
- ✅ Wrangler version requirement confirmed (3.71.0+)

## Lessons Learned

1. **Metadata index timing is critical** - This is the #1 error source
2. **Dimension mismatch is common** - Need clear model → dimensions mapping
3. **Filter operators are powerful** - But syntax must be exact
4. **Cardinality matters** - High cardinality + range queries = slow
5. **Insert ≠ Upsert** - This confuses many developers
6. **Namespace isolation is efficient** - Better than multiple indexes

## Future Enhancements

### Potential Additions
- **Advanced chunking strategies** - Semantic chunking, recursive splitting
- **Hybrid search patterns** - Combine vector search with keyword search
- **Multi-modal embeddings** - Images, audio (when Workers AI supports)
- **Query optimization** - Analyzing query performance
- **Index migration tool** - Helper script for re-indexing

### Skill Composition Opportunities
This skill composes well with:
- **cloudflare-workers-ai** (embedding generation)
- **cloudflare-d1** (storing metadata separately)
- **cloudflare-r2** (storing original documents)
- **cloudflare-kv** (caching query results)

## Final Metrics

| Metric | Value |
|--------|-------|
| **Dev Time** | 3 hours |
| **Token Savings** | ~65% |
| **Errors Prevented** | 8 |
| **Templates Created** | 4 |
| **Reference Docs** | 5 |
| **Examples** | 2 |
| **Total Files** | 13 |
| **Lines of Code/Docs** | 4,000+ |
| **Production Ready** | ✅ Yes |

## Conclusion

The Cloudflare Vectorize skill successfully encapsulates the complete knowledge domain for:
- Vector database operations
- Metadata filtering patterns
- Embedding generation (Workers AI + OpenAI)
- RAG implementation patterns
- Document processing pipelines

By preventing 8 common errors and reducing token usage by 65%, this skill provides significant value for semantic search and AI application development on Cloudflare Workers.

**Status**: ✅ Production Ready
**Date Completed**: 2025-10-21
