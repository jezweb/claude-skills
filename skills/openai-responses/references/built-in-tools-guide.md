# Built-in Tools Guide

**Last Updated**: 2025-10-25

Comprehensive guide to using Responses API built-in tools.

---

## Available Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| **Code Interpreter** | Execute Python code | Data analysis, calculations, charts |
| **File Search** | RAG without vector stores | Search uploaded files |
| **Web Search** | Real-time web info | Current events, fact-checking |
| **Image Generation** | DALL-E integration | Create images from descriptions |
| **MCP** | Connect external tools | Stripe, databases, custom APIs |

---

## Code Interpreter

**Execute Python code server-side:**

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Calculate mean, median, mode of: 10, 20, 30, 40, 50',
  tools: [{ type: 'code_interpreter' }],
});
```

**Features:**
- Sandboxed Python environment
- Automatic chart generation
- File processing support
- Timeout: 30s (use `background: true` for longer)

---

## File Search

**RAG without building vector stores:**

```typescript
// 1. Upload file
const file = await openai.files.create({
  file: fs.createReadStream('./document.pdf'),
  purpose: 'assistants',
});

// 2. Search
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'What does the document say about pricing?',
  tools: [{ type: 'file_search', file_ids: [file.id] }],
});
```

**Supported formats:**
- PDFs, Word docs, text files
- Markdown, HTML, code files
- Max: 512MB per file

---

## Web Search

**Real-time web information:**

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'What are the latest AI news?',
  tools: [{ type: 'web_search' }],
});
```

**Features:**
- No cutoff date limitations
- Automatic source citations
- Real-time data access

---

## Image Generation

**DALL-E integration:**

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Create an image of a futuristic cityscape at sunset',
  tools: [{ type: 'image_generation' }],
});

// Find image in output
response.output.forEach(item => {
  if (item.type === 'image_generation_call') {
    console.log('Image URL:', item.output.url);
  }
});
```

**Models:** DALL-E 3 (default)

---

## Combining Tools

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Find current Bitcoin price and calculate what $1000 would be worth',
  tools: [
    { type: 'web_search' },       // Get price
    { type: 'code_interpreter' }, // Calculate
  ],
});
```

Model automatically uses the right tool for each subtask.

---

**Official Docs**: https://platform.openai.com/docs/guides/responses
