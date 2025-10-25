# Top Errors and Solutions

15+ common Gemini API errors with solutions.

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

## Quick Debugging Checklist

- [ ] Using @google/genai (NOT @google/generative-ai)
- [ ] Model name is gemini-2.5-pro/flash/flash-lite
- [ ] API key is set correctly
- [ ] Input under 1,048,576 tokens
- [ ] Not using Flash-Lite for function calling
- [ ] System instruction at top level
- [ ] Streaming endpoint is streamGenerateContent
- [ ] MIME types are correct for multimodal

