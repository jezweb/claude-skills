# Cloudflare Workers AI - Models Catalog

Complete catalog of Workers AI models organized by task type.

**Last Updated**: 2025-10-21
**Official Catalog**: https://developers.cloudflare.com/workers-ai/models/

---

## Text Generation (LLMs)

### Meta Llama Models

| Model ID | Size | Best For | Rate Limit |
|----------|------|----------|------------|
| `@cf/meta/llama-3.1-8b-instruct` | 8B | General purpose, balanced | 300/min |
| `@cf/meta/llama-3.1-8b-instruct-fast` | 8B | Faster inference | 300/min |
| `@cf/meta/llama-3.2-1b-instruct` | 1B | Ultra-fast, simple tasks | 300/min |
| `@cf/meta/llama-3.2-3b-instruct` | 3B | Fast, good quality | 300/min |
| `@cf/meta/llama-2-7b-chat-int8` | 7B | Legacy, reliable | 300/min |
| `@cf/meta/llama-2-13b-chat-awq` | 13B | Higher quality (slower) | 300/min |

### Qwen Models

| Model ID | Size | Best For | Rate Limit |
|----------|------|----------|------------|
| `@cf/qwen/qwen1.5-14b-chat-awq` | 14B | High quality, complex reasoning | 150/min |
| `@cf/qwen/qwen1.5-7b-chat-awq` | 7B | Balanced quality/speed | 300/min |
| `@cf/qwen/qwen1.5-1.8b-chat` | 1.8B | Fast, lightweight | 720/min |
| `@cf/qwen/qwen1.5-0.5b-chat` | 0.5B | Ultra-fast, ultra-lightweight | 1500/min |

### Mistral Models

| Model ID | Size | Best For | Rate Limit |
|----------|------|----------|------------|
| `@hf/thebloke/mistral-7b-instruct-v0.1-awq` | 7B | Fast, efficient | 400/min |
| `@hf/thebloke/openhermes-2.5-mistral-7b-awq` | 7B | Instruction following | 300/min |

### DeepSeek Models

| Model ID | Size | Best For | Rate Limit |
|----------|------|----------|------------|
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 32B | Coding, technical content | 300/min |
| `@cf/deepseek-ai/deepseek-coder-6.7b-instruct-awq` | 6.7B | Code generation | 300/min |

### Other Models

| Model ID | Size | Best For | Rate Limit |
|----------|------|----------|------------|
| `@cf/tinyllama/tinyllama-1.1b-chat-v1.0` | 1.1B | Extremely fast, limited capability | 720/min |
| `@cf/microsoft/phi-2` | 2.7B | Fast, efficient | 720/min |
| `@cf/google/gemma-2b-it-lora` | 2B | Instruction tuned | 300/min |
| `@cf/google/gemma-7b-it-lora` | 7B | Higher quality | 300/min |

---

## Text Embeddings

| Model ID | Dimensions | Best For | Rate Limit |
|----------|-----------|----------|------------|
| `@cf/baai/bge-base-en-v1.5` | 768 | General purpose RAG | 3000/min |
| `@cf/baai/bge-large-en-v1.5` | 1024 | High accuracy search | 1500/min |
| `@cf/baai/bge-small-en-v1.5` | 384 | Fast, low storage | 3000/min |
| `@cf/baai/bge-m3` | 1024 | Multilingual | 3000/min |

**Use Case**: RAG, semantic search, similarity detection, clustering

---

## Image Generation

| Model ID | Type | Best For | Rate Limit |
|----------|------|----------|------------|
| `@cf/black-forest-labs/flux-1-schnell` | Text-to-Image | Photorealistic, high quality | 720/min |
| `@cf/stabilityai/stable-diffusion-xl-base-1.0` | Text-to-Image | General purpose | 720/min |
| `@cf/lykon/dreamshaper-8-lcm` | Text-to-Image | Artistic, stylized | 720/min |
| `@cf/runwayml/stable-diffusion-v1-5-img2img` | Image-to-Image | Transform images | 1500/min |
| `@cf/runwayml/stable-diffusion-v1-5-inpainting` | Inpainting | Edit specific areas | 1500/min |
| `@cf/bytedance/stable-diffusion-xl-lightning` | Text-to-Image | Fast generation | 720/min |

**Output**: PNG images (~5 MB max)

---

## Vision Models

| Model ID | Task | Best For | Rate Limit |
|----------|------|----------|------------|
| `@cf/meta/llama-3.2-11b-vision-instruct` | Image Understanding | Q&A, captioning, analysis | 720/min |
| `@cf/unum/uform-gen2-qwen-500m` | Image Captioning | Fast captions | 720/min |

**Input**: Base64-encoded images

---

## Translation

| Model ID | Languages | Rate Limit |
|----------|-----------|------------|
| `@cf/meta/m2m100-1.2b` | 100+ languages | 720/min |

**Supported Language Pairs**: https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/

---

## Text Classification

| Model ID | Task | Rate Limit |
|----------|------|------------|
| `@cf/huggingface/distilbert-sst-2-int8` | Sentiment analysis | 2000/min |
| `@hf/thebloke/openhermes-2.5-mistral-7b-awq` | General classification | 300/min |

**Output**: Label + confidence score

---

## Automatic Speech Recognition

| Model ID | Best For | Rate Limit |
|----------|----------|------------|
| `@cf/openai/whisper` | General transcription | 720/min |
| `@cf/openai/whisper-tiny-en` | English only, fast | 720/min |

**Input**: Audio files (MP3, WAV, etc.)

---

## Object Detection

| Model ID | Task | Rate Limit |
|----------|------|------------|
| `@cf/facebook/detr-resnet-50` | Object detection | 3000/min |

**Output**: Bounding boxes + labels

---

## Image Classification

| Model ID | Classes | Rate Limit |
|----------|---------|------------|
| `@cf/microsoft/resnet-50` | 1000 ImageNet classes | 3000/min |

**Output**: Top-5 predictions with probabilities

---

## Summarization

| Model ID | Best For | Rate Limit |
|----------|----------|------------|
| `@cf/facebook/bart-large-cnn` | News articles, documents | 1500/min |

---

## Text-to-Image (Legacy)

| Model ID | Type | Rate Limit |
|----------|------|------------|
| `@cf/stabilityai/stable-diffusion-v1-5-img2img` | Image-to-Image | 1500/min |

---

## Model Selection Guide

### For Text Generation

**Speed Priority:**
1. `@cf/qwen/qwen1.5-0.5b-chat` (1500/min)
2. `@cf/meta/llama-3.2-1b-instruct` (300/min)
3. `@cf/tinyllama/tinyllama-1.1b-chat-v1.0` (720/min)

**Quality Priority:**
1. `@cf/qwen/qwen1.5-14b-chat-awq` (150/min)
2. `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` (300/min)
3. `@cf/meta/llama-3.1-8b-instruct` (300/min)

**Balanced:**
1. `@cf/meta/llama-3.1-8b-instruct` (300/min)
2. `@hf/thebloke/mistral-7b-instruct-v0.1-awq` (400/min)
3. `@cf/qwen/qwen1.5-7b-chat-awq` (300/min)

### For Embeddings

**General Purpose RAG:**
- `@cf/baai/bge-base-en-v1.5` (768 dims, 3000/min)

**High Accuracy:**
- `@cf/baai/bge-large-en-v1.5` (1024 dims, 1500/min)

**Fast/Low Storage:**
- `@cf/baai/bge-small-en-v1.5` (384 dims, 3000/min)

### For Image Generation

**Best Quality:**
- `@cf/black-forest-labs/flux-1-schnell`

**General Purpose:**
- `@cf/stabilityai/stable-diffusion-xl-base-1.0`

**Artistic/Stylized:**
- `@cf/lykon/dreamshaper-8-lcm`

**Fast:**
- `@cf/bytedance/stable-diffusion-xl-lightning`

---

## Rate Limits Summary

| Task Type | Default Limit | High-Speed Models |
|-----------|---------------|-------------------|
| Text Generation | 300/min | 400-1500/min |
| Text Embeddings | 3000/min | 1500/min (large) |
| Image Generation | 720/min | 720/min |
| Vision Models | 720/min | 720/min |
| Translation | 720/min | 720/min |
| Classification | 2000/min | 2000/min |
| Speech Recognition | 720/min | 720/min |
| Object Detection | 3000/min | 3000/min |

---

## Pricing (Neurons)

Pricing varies by model. Common examples:

| Model | Input (1M tokens) | Output (1M tokens) |
|-------|-------------------|-------------------|
| Llama 3.2 1B | $0.027 | $0.201 |
| Llama 3.1 8B | $0.088 | $0.606 |
| BGE-base embeddings | $0.005 | N/A |
| Flux image gen | ~$0.011/image | N/A |

**Free Tier**: 10,000 neurons/day
**Paid Tier**: $0.011 per 1,000 neurons

---

## References

- [Official Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
- [Rate Limits](https://developers.cloudflare.com/workers-ai/platform/limits/)
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
