# Streaming Patterns

Complete guide to implementing streaming with Gemini API.

---

## SDK Approach (Async Iteration)

```typescript
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a story'
});

for await (const chunk of response) {
  process.stdout.write(chunk.text);
}
```

**Pros**: Simple, automatic parsing
**Cons**: Requires Node.js or compatible runtime

---

## Fetch Approach (SSE Parsing)

```typescript
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent',
  { /* ... */ }
);

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    
    const data = JSON.parse(line.slice(6));
    const text = data.candidates[0]?.content?.parts[0]?.text;
    if (text) process.stdout.write(text);
  }
}
```

**Pros**: Works in any environment
**Cons**: Manual SSE parsing required

---

## SSE Format

```
data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}
data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}
data: [DONE]
```

---

## Best Practices

- Always use `streamGenerateContent` endpoint
- Handle incomplete chunks in buffer
- Skip empty lines and `[DONE]` markers
- Use streaming for better UX on long responses

---

## Official Docs

https://ai.google.dev/gemini-api/docs/streaming
