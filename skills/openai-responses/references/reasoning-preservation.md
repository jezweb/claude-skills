# Reasoning Preservation Guide

**Last Updated**: 2025-10-25

Understanding how Responses API preserves reasoning across turns.

---

## What Is Reasoning Preservation?

Unlike Chat Completions (which discards reasoning between turns), Responses preserves the model's internal thought process.

**Analogy:**
- **Chat Completions**: Model tears out scratchpad page after each turn
- **Responses API**: Model keeps scratchpad open, previous reasoning visible

---

## Performance Impact

**TAUBench Results (GPT-5):**
- Chat Completions: Baseline
- Responses API: **+5% better** (purely from preserved reasoning)

**Why It Matters:**
- ✅ Better multi-turn problem solving
- ✅ More coherent long conversations
- ✅ Improved step-by-step reasoning
- ✅ Fewer context errors

---

## Reasoning Summaries

Responses API provides reasoning summaries at **no additional cost**.

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Solve this complex math problem',
});

// Inspect reasoning
response.output.forEach(item => {
  if (item.type === 'reasoning') {
    console.log('Model thinking:', item.summary[0].text);
  }
  if (item.type === 'message') {
    console.log('Final answer:', item.content[0].text);
  }
});
```

---

## Use Cases

**Debugging:**
- See how model arrived at answer
- Identify reasoning errors

**Auditing:**
- Track decision-making process
- Compliance requirements

**Transparency:**
- Show users why AI made decision
- Build trust in AI systems

---

**Official Docs**: https://developers.openai.com/blog/responses-api/
