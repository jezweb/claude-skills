# Vision Capabilities

Guide to using Claude's vision capabilities for image understanding.

## Supported Formats

- **JPEG** (image/jpeg)
- **PNG** (image/png)
- **WebP** (image/webp)
- **GIF** (image/gif) - non-animated only

**Max size**: 5MB per image

## Basic Usage

```typescript
import fs from 'fs';

const imageData = fs.readFileSync('./image.jpg').toString('base64');

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageData
        }
      },
      {
        type: 'text',
        text: 'What is in this image?'
      }
    ]
  }]
});
```

## Multiple Images

```typescript
content: [
  { type: 'text', text: 'Compare these images:' },
  { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img1 } },
  { type: 'image', source: { type: 'base64', media_type: 'image/png', data: img2 } },
  { type: 'text', text: 'What are the differences?' }
]
```

## With Tools

```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  tools: [searchProductTool],
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: {...} },
      { type: 'text', text: 'Find similar products' }
    ]
  }]
});
```

## With Prompt Caching

```typescript
{
  type: 'image',
  source: {
    type: 'base64',
    media_type: 'image/jpeg',
    data: imageData
  },
  cache_control: { type: 'ephemeral' }  // Cache image
}
```

## Validation

```typescript
function validateImage(path: string) {
  const stats = fs.statSync(path);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > 5) {
    throw new Error('Image exceeds 5MB');
  }

  const ext = path.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    throw new Error('Unsupported format');
  }

  return true;
}
```

## Official Docs

https://docs.claude.com/en/docs/build-with-claude/vision
