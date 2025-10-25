# SDK Migration Guide

**From**: `@google/generative-ai` (DEPRECATED)
**To**: `@google/genai` (CURRENT)

**Deadline**: November 30, 2025 (deprecated SDK sunset)

---

## Why Migrate?

The `@google/generative-ai` SDK is deprecated and will stop receiving updates on **November 30, 2025**.

The new `@google/genai` SDK:
- ✅ Works with both Gemini API and Vertex AI
- ✅ Supports Gemini 2.0+ features
- ✅ Better TypeScript support
- ✅ Unified API across platforms
- ✅ Active development and updates

---

## Migration Steps

### 1. Update Package

```bash
# Remove deprecated SDK
npm uninstall @google/generative-ai

# Install current SDK
npm install @google/genai@1.27.0
```

### 2. Update Imports

**Old (DEPRECATED)**:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

**New (CURRENT)**:
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey });
// No need to get model separately
```

### 3. Update API Calls

**Old**:
```typescript
const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();
```

**New**:
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt
});
const text = response.text;
```

### 4. Update Streaming

**Old**:
```typescript
const result = await model.generateContentStream(prompt);
for await (const chunk of result.stream) {
  console.log(chunk.text());
}
```

**New**:
```typescript
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: prompt
});
for await (const chunk of response) {
  console.log(chunk.text);
}
```

### 5. Update Chat

**Old**:
```typescript
const chat = model.startChat({
  history: []
});
const result = await chat.sendMessage(message);
const response = await result.response;
console.log(response.text());
```

**New**:
```typescript
const chat = await ai.models.createChat({
  model: 'gemini-2.5-flash',
  history: []
});
const response = await chat.sendMessage(message);
console.log(response.text);
```

---

## Complete Before/After Example

### Before (Deprecated SDK)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Generate
const result = await model.generateContent('Hello');
const response = await result.response;
console.log(response.text());

// Stream
const streamResult = await model.generateContentStream('Write a story');
for await (const chunk of streamResult.stream) {
  console.log(chunk.text());
}

// Chat
const chat = model.startChat();
const chatResult = await chat.sendMessage('Hi');
const chatResponse = await chatResult.response;
console.log(chatResponse.text());
```

### After (Current SDK)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generate
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Hello'
});
console.log(response.text);

// Stream
const streamResponse = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a story'
});
for await (const chunk of streamResponse) {
  console.log(chunk.text);
}

// Chat
const chat = await ai.models.createChat({ model: 'gemini-2.5-flash' });
const chatResponse = await chat.sendMessage('Hi');
console.log(chatResponse.text);
```

---

## Key Differences

| Aspect | Old SDK | New SDK |
|--------|---------|---------|
| Package | `@google/generative-ai` | `@google/genai` |
| Class | `GoogleGenerativeAI` | `GoogleGenAI` |
| Model Init | `genAI.getGenerativeModel()` | Specify in each call |
| Text Access | `response.text()` (method) | `response.text` (property) |
| Stream Iteration | `result.stream` | Direct iteration |
| Chat Creation | `model.startChat()` | `ai.models.createChat()` |

---

## Troubleshooting

### Error: "Cannot find module '@google/generative-ai'"

**Cause**: Old import statement after migration

**Solution**: Update all imports to `@google/genai`

### Error: "Property 'text' does not exist"

**Cause**: Using `response.text()` (method) instead of `response.text` (property)

**Solution**: Remove parentheses: `response.text` not `response.text()`

### Error: "generateContent is not a function"

**Cause**: Trying to call methods on old model object

**Solution**: Use `ai.models.generateContent()` directly

---

## Automated Migration Script

```bash
# Find all files using old SDK
rg "@google/generative-ai" --type ts

# Replace import statements
find . -name "*.ts" -exec sed -i 's/@google\/generative-ai/@google\/genai/g' {} +

# Replace class name
find . -name "*.ts" -exec sed -i 's/GoogleGenerativeAI/GoogleGenAI/g' {} +
```

**⚠️ Note**: This script handles imports but NOT API changes. Manual review required!

---

## Official Resources

- **Migration Guide**: https://ai.google.dev/gemini-api/docs/migrate-to-genai
- **New SDK Docs**: https://github.com/googleapis/js-genai
- **Deprecated SDK**: https://github.com/google-gemini/deprecated-generative-ai-js

---

**Deadline Reminder**: November 30, 2025 - Deprecated SDK sunset
