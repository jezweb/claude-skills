# Gemini Models Guide (2025)

**Last Updated**: 2025-10-25

---

## Current Production Models (Gemini 2.5)

### gemini-2.5-pro

**Model ID**: `gemini-2.5-pro`

**Context Windows**:
- Input: 1,048,576 tokens (NOT 2M!)
- Output: 65,536 tokens

**Description**: State-of-the-art thinking model capable of reasoning over complex problems in code, math, and STEM.

**Best For**:
- Complex reasoning tasks
- Advanced code generation and optimization
- Mathematical problem-solving
- Multi-step logical analysis
- STEM applications

**Features**:
- ✅ Thinking mode (enabled by default)
- ✅ Function calling
- ✅ Multimodal (text, images, video, audio, PDFs)
- ✅ Streaming
- ✅ System instructions
- ✅ JSON mode

**Knowledge Cutoff**: January 2025

**Pricing**: Higher cost, use for tasks requiring best quality

---

### gemini-2.5-flash

**Model ID**: `gemini-2.5-flash`

**Context Windows**:
- Input: 1,048,576 tokens
- Output: 65,536 tokens

**Description**: Best price-performance model for large-scale processing, low-latency, and high-volume tasks.

**Best For**:
- General-purpose AI applications
- High-volume API calls
- Agentic workflows
- Cost-sensitive applications
- Production workloads

**Features**:
- ✅ Thinking mode (enabled by default)
- ✅ Function calling
- ✅ Multimodal (text, images, video, audio, PDFs)
- ✅ Streaming
- ✅ System instructions
- ✅ JSON mode

**Knowledge Cutoff**: January 2025

**Pricing**: Best price-performance ratio

**⭐ Recommended**: This is the default choice for most applications

---

### gemini-2.5-flash-lite

**Model ID**: `gemini-2.5-flash-lite`

**Context Windows**:
- Input: 1,048,576 tokens
- Output: 65,536 tokens

**Description**: Most cost-efficient and fastest 2.5 model, optimized for high throughput.

**Best For**:
- High-throughput applications
- Simple text generation
- Cost-critical use cases
- Speed-prioritized workloads

**Features**:
- ✅ Thinking mode (enabled by default)
- ❌ **NO function calling** (critical limitation!)
- ✅ Multimodal (text, images, video, audio, PDFs)
- ✅ Streaming
- ✅ System instructions
- ✅ JSON mode

**Knowledge Cutoff**: January 2025

**Pricing**: Lowest cost

**⚠️ Important**: Flash-Lite does NOT support function calling! Use Flash or Pro if you need tool use.

---

## Model Comparison Matrix

| Feature | Pro | Flash | Flash-Lite |
|---------|-----|-------|------------|
| **Thinking Mode** | ✅ Default ON | ✅ Default ON | ✅ Default ON |
| **Function Calling** | ✅ Yes | ✅ Yes | ❌ **NO** |
| **Multimodal** | ✅ Full | ✅ Full | ✅ Full |
| **Streaming** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Input Tokens** | 1,048,576 | 1,048,576 | 1,048,576 |
| **Output Tokens** | 65,536 | 65,536 | 65,536 |
| **Reasoning Quality** | Best | Good | Basic |
| **Speed** | Moderate | Fast | Fastest |
| **Cost** | Highest | Medium | Lowest |

---

## Previous Generation Models (Still Available)

### Gemini 2.0 Flash

**Model ID**: `gemini-2.0-flash`

**Context**: 1M input / 65K output tokens

**Status**: Previous generation, 2.5 Flash recommended instead

### Gemini 1.5 Pro

**Model ID**: `gemini-1.5-pro`

**Context**: 2M input tokens (this is the ONLY model with 2M!)

**Status**: Older model, 2.5 models recommended

---

## Context Window Clarification

**⚠️ CRITICAL CORRECTION**:

**ACCURATE**: Gemini 2.5 models support **1,048,576 input tokens** (approximately 1 million)

**INACCURATE**: Claiming Gemini 2.5 has 2M token context window

**WHY THIS MATTERS**:
- Gemini 1.5 Pro (older model) had 2M tokens
- Gemini 2.5 models (current) have ~1M tokens
- This is a common mistake that causes confusion!

**This skill prevents this error by providing accurate information.**

---

## Model Selection Guide

### Use gemini-2.5-pro When:
- ✅ Complex reasoning required (math, logic, STEM)
- ✅ Advanced code generation and optimization
- ✅ Multi-step problem-solving
- ✅ Quality is more important than cost
- ✅ Tasks require maximum capability

### Use gemini-2.5-flash When:
- ✅ General-purpose AI applications
- ✅ High-volume production workloads
- ✅ Function calling required
- ✅ Agentic workflows
- ✅ Good balance of cost and quality needed
- ⭐ **Recommended default choice**

### Use gemini-2.5-flash-lite When:
- ✅ Simple text generation only
- ✅ No function calling needed
- ✅ High throughput required
- ✅ Cost is primary concern
- ⚠️ **Only if you don't need function calling!**

---

## Common Mistakes

### ❌ Mistake 1: Using Wrong Model Name
```typescript
// WRONG - old model name
model: 'gemini-1.5-pro'

// CORRECT - current model
model: 'gemini-2.5-flash'
```

### ❌ Mistake 2: Claiming 2M Context for 2.5 Models
```typescript
// WRONG ASSUMPTION
// "Gemini 2.5 has 2M token context window"

// CORRECT
// Gemini 2.5 has 1,048,576 input tokens
// Only Gemini 1.5 Pro (older) had 2M
```

### ❌ Mistake 3: Using Flash-Lite for Function Calling
```typescript
// WRONG - Flash-Lite doesn't support function calling!
model: 'gemini-2.5-flash-lite',
config: {
  tools: [{ functionDeclarations: [...] }] // This will FAIL
}

// CORRECT
model: 'gemini-2.5-flash', // or gemini-2.5-pro
config: {
  tools: [{ functionDeclarations: [...] }]
}
```

---

## Rate Limits (Free vs Paid)

### Free Tier
- **15 RPM** (requests per minute)
- **1M TPM** (tokens per minute)
- **1,500 RPD** (requests per day)

### Paid Tier
- **360 RPM**
- **4M TPM**
- Unlimited daily requests

**Tip**: Monitor your usage and implement rate limiting to stay within quotas.

---

## Official Documentation

- **Models Overview**: https://ai.google.dev/gemini-api/docs/models
- **Gemini 2.5 Announcement**: https://developers.googleblog.com/en/gemini-2-5-thinking-model-updates/
- **Pricing**: https://ai.google.dev/pricing

---

**Production Tip**: Always use gemini-2.5-flash as your default unless you specifically need Pro's advanced reasoning or want to minimize cost with Flash-Lite (and don't need function calling).
