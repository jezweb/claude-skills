# OpenAI Models Guide

**Last Updated**: 2025-10-25

This guide provides a comprehensive comparison of OpenAI's language models to help you choose the right model for your use case.

---

## GPT-5 Series (Released August 2025)

### gpt-5
**Status**: Latest flagship model
**Best for**: Complex reasoning, advanced problem-solving, code generation

**Key Features**:
- Advanced reasoning capabilities
- Unique parameters: `reasoning_effort`, `verbosity`
- Best-in-class performance on complex tasks

**Limitations**:
- ❌ No `temperature` support
- ❌ No `top_p` support
- ❌ No `logprobs` support
- ❌ CoT (Chain of Thought) does NOT persist between turns

**When to use**:
- Complex mathematical problems
- Advanced code generation
- Logic puzzles and reasoning tasks
- Multi-step problem solving

**Cost**: Highest pricing tier

---

### gpt-5-mini
**Status**: Cost-effective GPT-5 variant
**Best for**: Balanced performance and cost

**Key Features**:
- Same parameter support as gpt-5 (`reasoning_effort`, `verbosity`)
- Better than GPT-4 Turbo performance
- Significantly cheaper than gpt-5

**When to use**:
- Most production applications
- When you need GPT-5 features but not maximum performance
- High-volume use cases where cost matters

**Cost**: Mid-tier pricing

---

### gpt-5-nano
**Status**: Smallest GPT-5 variant
**Best for**: Simple tasks, high-volume processing

**Key Features**:
- Fastest response times
- Lowest cost in GPT-5 series
- Still supports GPT-5 unique parameters

**When to use**:
- Simple text generation
- High-volume batch processing
- Real-time streaming applications
- Cost-sensitive deployments

**Cost**: Low-tier pricing

---

## GPT-4o Series

### gpt-4o
**Status**: Multimodal flagship (pre-GPT-5)
**Best for**: Vision tasks, multimodal applications

**Key Features**:
- ✅ Vision support (image understanding)
- ✅ Temperature control
- ✅ Top-p sampling
- ✅ Function calling
- ✅ Structured outputs

**Limitations**:
- ❌ No `reasoning_effort` parameter
- ❌ No `verbosity` parameter

**When to use**:
- Image understanding and analysis
- OCR / text extraction from images
- Visual question answering
- When you need temperature/top_p control
- Multimodal applications

**Cost**: High-tier pricing (cheaper than gpt-5)

---

### gpt-4-turbo
**Status**: Fast GPT-4 variant
**Best for**: When you need GPT-4 speed

**Key Features**:
- Faster than base GPT-4
- Full parameter support (temperature, top_p, logprobs)
- Good balance of quality and speed

**When to use**:
- When GPT-4 quality is needed with faster responses
- Legacy applications requiring specific parameters
- When vision is not required

**Cost**: Mid-tier pricing

---

## Comparison Table

| Feature | GPT-5 | GPT-5-mini | GPT-5-nano | GPT-4o | GPT-4 Turbo |
|---------|-------|------------|------------|--------|-------------|
| **Reasoning** | Best | Excellent | Good | Excellent | Excellent |
| **Speed** | Medium | Medium | Fastest | Medium | Fast |
| **Cost** | Highest | Mid | Lowest | High | Mid |
| **reasoning_effort** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **verbosity** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **temperature** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **top_p** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Vision** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Function calling** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Structured outputs** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Max output tokens** | 16,384 | 16,384 | 16,384 | 16,384 | 16,384 |

---

## Selection Guide

### Use GPT-5 when:
- ✅ You need the best reasoning performance
- ✅ Complex mathematical or logical problems
- ✅ Advanced code generation
- ✅ Multi-step problem solving
- ❌ Cost is not the primary concern

### Use GPT-5-mini when:
- ✅ You want GPT-5 features at lower cost
- ✅ Production applications with high volume
- ✅ Good reasoning performance is needed
- ✅ Balance of quality and cost matters

### Use GPT-5-nano when:
- ✅ Simple text generation tasks
- ✅ High-volume batch processing
- ✅ Real-time streaming applications
- ✅ Cost optimization is critical
- ❌ Complex reasoning is not required

### Use GPT-4o when:
- ✅ Vision / image understanding is required
- ✅ You need temperature/top_p control
- ✅ Multimodal applications
- ✅ OCR and visual analysis
- ❌ Pure text tasks (use GPT-5 series)

### Use GPT-4 Turbo when:
- ✅ Legacy application compatibility
- ✅ You need specific parameters not in GPT-5
- ✅ Fast responses without vision
- ❌ Not recommended for new applications (use GPT-5 or GPT-4o)

---

## Cost Optimization Strategies

### 1. Model Cascading
Start with cheaper models and escalate only when needed:

```
gpt-5-nano (try first) → gpt-5-mini → gpt-5 (if needed)
```

### 2. Task-Specific Model Selection
- **Simple**: Use gpt-5-nano
- **Medium complexity**: Use gpt-5-mini
- **Complex reasoning**: Use gpt-5
- **Vision tasks**: Use gpt-4o

### 3. Hybrid Approach
- Use embeddings (cheap) for retrieval
- Use gpt-5-mini for generation
- Use gpt-5 only for critical decisions

### 4. Batch Processing
- Use cheaper models for bulk operations
- Reserve expensive models for user-facing requests

---

## Parameter Guide

### GPT-5 Unique Parameters

**reasoning_effort**: Controls reasoning depth
- "minimal": Quick responses
- "low": Basic reasoning
- "medium": Balanced (default)
- "high": Deep reasoning for complex problems

**verbosity**: Controls output length
- "low": Concise responses
- "medium": Balanced detail (default)
- "high": Verbose, detailed responses

### GPT-4o/GPT-4 Turbo Parameters

**temperature**: Controls randomness (0-2)
- 0: Deterministic, focused
- 1: Balanced creativity (default)
- 2: Maximum creativity

**top_p**: Nucleus sampling (0-1)
- Lower values: More focused
- Higher values: More diverse

**logprobs**: Get token probabilities
- Useful for debugging and analysis

---

## Common Patterns

### Pattern 1: Automatic Model Selection

```typescript
function selectModel(taskComplexity: 'simple' | 'medium' | 'complex') {
  switch (taskComplexity) {
    case 'simple':
      return 'gpt-5-nano';
    case 'medium':
      return 'gpt-5-mini';
    case 'complex':
      return 'gpt-5';
  }
}
```

### Pattern 2: Fallback Chain

```typescript
async function completionWithFallback(prompt: string) {
  const models = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5'];

  for (const model of models) {
    try {
      const result = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });

      // Validate quality
      if (isGoodEnough(result)) {
        return result;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error('All models failed');
}
```

### Pattern 3: Vision + Text Hybrid

```typescript
// Use gpt-4o for image analysis
const imageAnalysis = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ],
});

// Use gpt-5 for reasoning based on analysis
const reasoning = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: `Image analysis: ${imageAnalysis.choices[0].message.content}` },
    { role: 'user', content: 'What does this imply about...' },
  ],
});
```

---

## Official Documentation

- **GPT-5 Guide**: https://platform.openai.com/docs/guides/latest-model
- **Model Pricing**: https://openai.com/pricing
- **Model Comparison**: https://platform.openai.com/docs/models

---

**Summary**: Choose the right model based on your specific needs. GPT-5 series for reasoning, GPT-4o for vision, and optimize costs by selecting the smallest model that meets your requirements.
