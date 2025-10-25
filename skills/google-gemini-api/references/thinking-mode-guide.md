# Thinking Mode Guide

Complete guide to thinking mode in Gemini 2.5 models.

---

## What is Thinking Mode?

Gemini 2.5 models "think" internally before responding, improving accuracy on complex tasks.

**Key Points**:
- ✅ Always enabled on 2.5 models (cannot disable)
- ✅ Transparent (you don't see the thinking process)
- ✅ Configurable thinking budget
- ✅ Improves reasoning quality

---

## Configuration

```typescript
config: {
  thinkingConfig: {
    thinkingBudget: 8192  // Max tokens for internal reasoning
  }
}
```

---

## When to Increase Budget

✅ Complex math/logic problems
✅ Multi-step reasoning
✅ Code optimization
✅ Detailed analysis

---

## When Default is Fine

⏺️ Simple questions
⏺️ Creative writing
⏺️ Translation
⏺️ Summarization

---

## Model Comparison

- **gemini-2.5-pro**: Best for complex reasoning
- **gemini-2.5-flash**: Good balance
- **gemini-2.5-flash-lite**: Basic thinking

---

## Official Docs

https://ai.google.dev/gemini-api/docs/thinking
