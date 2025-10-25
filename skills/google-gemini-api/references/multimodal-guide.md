# Multimodal Guide

Complete guide to using images, video, audio, and PDFs with Gemini API.

---

## Supported Formats

### Images
- JPEG, PNG, WebP, HEIC, HEIF
- Max size: 20MB

### Video
- MP4, MPEG, MOV, AVI, FLV, MPG, WebM, WMV
- Max size: 2GB
- Max length (inline): 2 minutes

### Audio
- MP3, WAV, FLAC, AAC, OGG, OPUS
- Max size: 20MB

### PDFs
- Max size: 30MB
- Text-based PDFs work best

---

## Usage Pattern

```typescript
contents: [
  {
    parts: [
      { text: 'Your question' },
      {
        inlineData: {
          data: base64EncodedData,
          mimeType: 'image/jpeg' // or video/mp4, audio/mp3, application/pdf
        }
      }
    ]
  }
]
```

---

## Best Practices

- Use specific, detailed prompts
- Combine multiple modalities in one request
- For large files (>2GB), use File API (Phase 2)

---

## Official Docs

https://ai.google.dev/gemini-api/docs/vision
