# Images Guide (DALL-E 3 & GPT-Image-1)

**Last Updated**: 2025-10-25

Best practices for image generation and editing with OpenAI's Images API.

---

## DALL-E 3 Generation

### Size Selection

| Size | Use Case |
|------|----------|
| 1024x1024 | Profile pictures, icons, square posts |
| 1024x1536 | Portrait photos, vertical ads |
| 1536x1024 | Landscape photos, banners |
| 1024x1792 | Tall portraits, mobile wallpapers |
| 1792x1024 | Wide banners, desktop wallpapers |

### Quality Settings

**standard**: Normal quality, faster, cheaper
- Use for: Prototyping, high-volume generation, quick iterations

**hd**: High definition, finer details, more expensive
- Use for: Final production images, marketing materials, print

### Style Options

**vivid**: Hyper-real, dramatic, high-contrast
- Use for: Marketing, advertising, eye-catching visuals

**natural**: More realistic, less dramatic
- Use for: Product photos, realistic scenes, professional content

---

## Prompting Best Practices

### Be Specific

```
❌ "A cat"
✅ "A white siamese cat with striking blue eyes, sitting on a wooden table, golden hour lighting, professional photography"
```

### Include Art Style

```
✅ "Oil painting of a sunset in the style of Claude Monet"
✅ "3D render of a futuristic city, Pixar animation style"
✅ "Professional product photo with studio lighting"
```

### Specify Lighting

```
- "Golden hour lighting"
- "Soft studio lighting from the left"
- "Dramatic shadows"
- "Bright natural daylight"
```

### Composition Details

```
- "Shallow depth of field"
- "Wide angle lens"
- "Centered composition"
- "Rule of thirds"
```

---

## GPT-Image-1 Editing

### Input Fidelity

**low**: More creative freedom
- Use for: Major transformations, style changes

**medium**: Balance (default)
- Use for: Most editing tasks

**high**: Stay close to original
- Use for: Subtle edits, preserving details

### Common Editing Tasks

1. **Background Removal**
```typescript
formData.append('prompt', 'Remove the background, keep only the product');
formData.append('format', 'png');
formData.append('background', 'transparent');
```

2. **Color Correction**
```typescript
formData.append('prompt', 'Increase brightness and saturation, make colors more vibrant');
```

3. **Object Removal**
```typescript
formData.append('prompt', 'Remove the person from the background');
```

4. **Compositing**
```typescript
formData.append('image', mainImage);
formData.append('image_2', logoImage);
formData.append('prompt', 'Add the logo to the product, as if stamped on the surface');
```

---

## Format Selection

| Format | Transparency | Compression | Best For |
|--------|--------------|-------------|----------|
| PNG | Yes | Lossless | Logos, transparency needed |
| JPEG | No | Lossy | Photos, smaller file size |
| WebP | Yes | Lossy | Web, best compression |

---

## Cost Optimization

1. Use standard quality unless HD is critical
2. Generate smaller sizes when possible
3. Cache generated images
4. Use natural style for most cases (vivid costs more)
5. Batch requests with delays to avoid rate limits

---

## Common Issues

### Prompt Revision
DALL-E 3 may revise prompts for safety/quality. Check `revised_prompt` in response.

### URL Expiration
Image URLs expire in 1 hour. Download and save if needed long-term.

### Non-Deterministic
Same prompt = different images. Cache results if consistency needed.

### Rate Limits
DALL-E has separate IPM (Images Per Minute) limits. Monitor and implement delays.

---

**See Also**: Official Images Guide (https://platform.openai.com/docs/guides/images)
