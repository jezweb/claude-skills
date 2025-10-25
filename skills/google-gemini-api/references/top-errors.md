# Top Errors and Solutions

22 common Gemini API errors with solutions (Phase 1 + Phase 2).

---

## 1. Using Deprecated SDK

**Error**: `Cannot find module '@google/generative-ai'`

**Cause**: Using old SDK after migration

**Solution**: Install `@google/genai` instead

---

## 2. Wrong Context Window Claims

**Error**: Input exceeds model capacity

**Cause**: Assuming 2M tokens for Gemini 2.5

**Solution**: Gemini 2.5 has 1,048,576 input tokens (NOT 2M!)

---

## 3. Model Not Found

**Error**: `models/gemini-3.0-flash is not found`

**Cause**: Wrong model name

**Solution**: Use: `gemini-2.5-pro`, `gemini-2.5-flash`, or `gemini-2.5-flash-lite`

---

## 4. Function Calling on Flash-Lite

**Error**: Function calling not working

**Cause**: Flash-Lite doesn't support function calling

**Solution**: Use `gemini-2.5-flash` or `gemini-2.5-pro`

---

## 5. Invalid API Key (401)

**Error**: `API key not valid`

**Cause**: Missing or wrong `GEMINI_API_KEY`

**Solution**: Set environment variable correctly

---

## 6. Rate Limit Exceeded (429)

**Error**: `Resource has been exhausted`

**Cause**: Too many requests

**Solution**: Implement exponential backoff

---

## 7. Streaming Parse Errors

**Error**: Invalid JSON in SSE stream

**Cause**: Incomplete chunk parsing

**Solution**: Use buffer to handle partial chunks

---

## 8. Multimodal Format Errors

**Error**: Invalid base64 or MIME type

**Cause**: Wrong image encoding

**Solution**: Use correct base64 encoding and MIME type

---

## 9. Context Length Exceeded

**Error**: `Request payload size exceeds the limit`

**Cause**: Input too large

**Solution**: Reduce input size (max 1,048,576 tokens)

---

## 10. Chat Not Working with Fetch

**Error**: No chat helper available

**Cause**: Chat helpers are SDK-only

**Solution**: Manually manage conversation history or use SDK

---

## 11. Thinking Mode Not Supported

**Error**: Trying to disable thinking mode

**Cause**: Thinking mode always enabled on 2.5

**Solution**: You can only configure budget, not disable

---

## 12. Parameter Conflicts

**Error**: Unsupported parameters

**Cause**: Using wrong config options

**Solution**: Use only supported parameters (see generation-config.md)

---

## 13. System Instruction Placement

**Error**: System instruction not working

**Cause**: Placed inside contents array

**Solution**: Place at top level, not in contents

---

## 14. Token Counting Errors

**Error**: Unexpected token usage

**Cause**: Multimodal inputs use more tokens

**Solution**: Images/video/audio count toward token limit

---

## 15. Parallel Function Call Errors

**Error**: Functions not executing in parallel

**Cause**: Dependencies between functions

**Solution**: Gemini auto-detects; ensure functions are independent

---

## Phase 2 Errors

### 16. Invalid Model Version for Caching

**Error**: `Invalid model name for caching`

**Cause**: Using `gemini-2.5-flash` instead of `gemini-2.5-flash-001`

**Solution**: Must use explicit version suffix when creating caches

```typescript
// ✅ Correct
model: 'gemini-2.5-flash-001'

// ❌ Wrong
model: 'gemini-2.5-flash'
```

**Source**: https://ai.google.dev/gemini-api/docs/caching

---

### 17. Cache Expired or Not Found

**Error**: `Cache not found` or `Cache expired`

**Cause**: Trying to use cache after TTL expiration

**Solution**: Check expiration before use or recreate cache

```typescript
const cache = await ai.caches.get({ name: cacheName });
if (new Date(cache.expireTime) < new Date()) {
  // Recreate cache
  cache = await ai.caches.create({ ... });
}
```

---

### 18. Cannot Update Expired Cache TTL

**Error**: `Cannot update expired cache`

**Cause**: Trying to extend TTL after cache already expired

**Solution**: Update TTL before expiration or create new cache

```typescript
// Update TTL before expiration
await ai.caches.update({
  name: cache.name,
  config: { ttl: '7200s' }
});
```

---

### 19. Code Execution Timeout

**Error**: `Execution timed out after 30 seconds` with `OUTCOME_FAILED`

**Cause**: Python code taking too long to execute

**Solution**: Simplify computation or reduce data size

```typescript
// Check outcome before using results
if (part.codeExecutionResult?.outcome === 'OUTCOME_FAILED') {
  console.error('Execution failed:', part.codeExecutionResult.output);
}
```

**Source**: https://ai.google.dev/gemini-api/docs/code-execution

---

### 20. Python Package Not Available

**Error**: `ModuleNotFoundError: No module named 'requests'`

**Cause**: Trying to import package not in sandbox

**Solution**: Use only available packages (numpy, pandas, matplotlib, seaborn, scipy)

**Available Packages**:
- Standard library: math, statistics, json, csv, datetime
- Data science: numpy, pandas, scipy
- Visualization: matplotlib, seaborn

---

### 21. Code Execution on Flash-Lite

**Error**: Code execution not working

**Cause**: `gemini-2.5-flash-lite` doesn't support code execution

**Solution**: Use `gemini-2.5-flash` or `gemini-2.5-pro`

```typescript
// ✅ Correct
model: 'gemini-2.5-flash' // Supports code execution

// ❌ Wrong
model: 'gemini-2.5-flash-lite' // NO code execution support
```

---

### 22. Grounding Requires Google Cloud Project

**Error**: `Grounding requires Google Cloud project configuration`

**Cause**: Using API key not associated with GCP project

**Solution**: Set up Google Cloud project and enable Generative Language API

**Steps**:
1. Create Google Cloud project
2. Enable Generative Language API
3. Configure billing
4. Use API key from that project

**Source**: https://ai.google.dev/gemini-api/docs/grounding

---

## Quick Debugging Checklist

### Phase 1 (Core)
- [ ] Using @google/genai (NOT @google/generative-ai)
- [ ] Model name is gemini-2.5-pro/flash/flash-lite
- [ ] API key is set correctly
- [ ] Input under 1,048,576 tokens
- [ ] Not using Flash-Lite for function calling
- [ ] System instruction at top level
- [ ] Streaming endpoint is streamGenerateContent
- [ ] MIME types are correct for multimodal

### Phase 2 (Advanced)
- [ ] Caching: Using explicit model version (e.g., gemini-2.5-flash-001)
- [ ] Caching: Cache not expired (check expireTime)
- [ ] Code Execution: Not using Flash-Lite
- [ ] Code Execution: Using only available Python packages
- [ ] Grounding: Google Cloud project configured
- [ ] Grounding: Checking groundingMetadata for search results

