# Generation Configuration Reference

Complete reference for all generation parameters.

---

## All Parameters

```typescript
config: {
  temperature: number,        // 0.0-2.0 (default: 1.0)
  topP: number,              // 0.0-1.0 (default: 0.95)
  topK: number,              // 1-100+ (default: 40)
  maxOutputTokens: number,   // 1-65536
  stopSequences: string[],   // Stop at these strings
  responseMimeType: string,  // 'text/plain' | 'application/json'
  candidateCount: number,    // Usually 1
  thinkingConfig: {
    thinkingBudget: number   // Max thinking tokens
  }
}
```

---

## Parameter Guidelines

### temperature
- **0.0**: Deterministic, focused
- **1.0**: Balanced (default)
- **2.0**: Very creative, random

### topP (nucleus sampling)
- **0.95**: Default, good balance
- Lower = more focused

### topK
- **40**: Default
- Higher = more diversity

### maxOutputTokens
- Always set this to prevent excessive generation
- Max: 65,536 tokens

---

## Use Cases

**Factual tasks**: temperature=0.0, topP=0.8
**Creative tasks**: temperature=1.2, topP=0.95
**Code generation**: temperature=0.3, topP=0.9

---

## Official Docs

https://ai.google.dev/gemini-api/docs/models/generative-models#model-parameters
