---
name: image-processing
description: "Process images for web development — resize, crop, trim whitespace, convert formats (PNG/WebP/JPG), optimise file size, generate thumbnails, create OG card images. Uses Pillow (Python) — no ImageMagick needed. Trigger with 'resize image', 'convert to webp', 'trim logo', 'optimise images', 'make thumbnail', 'create OG image', 'crop whitespace', 'process image', or 'image too large'."
compatibility: Designed for Claude Code (or similar products)
---

# Image Processing

Use `img-process` (shipped in `bin/`) for common operations. For complex or custom workflows, generate a Pillow script adapted to the user's environment.

## Quick Reference — img-process CLI

```bash
img-process resize hero.png --width 1920
img-process convert logo.png --format webp
img-process trim logo-raw.jpg -o logo-clean.png --padding 10
img-process thumbnail photo.jpg --size 200
img-process optimise hero.jpg --quality 85 --max-width 1920
img-process og-card -o og.png --title "My App" --subtitle "Built for speed"
img-process batch ./images --action convert --format webp -o ./optimised
```

**Use `img-process` when**: the operation is standard (resize, convert, trim, thumbnail, optimise, OG card, batch). This is faster and avoids generating a script each time.

**Generate a custom script when**: the operation needs logic `img-process` doesn't cover (compositing multiple images, watermarks, complex text layouts, conditional processing).

## Prerequisites

Pillow is required for both `img-process` and custom scripts:

```bash
pip install Pillow
```

If Pillow is unavailable, use alternatives:

| Alternative | Platform | Install | Best for |
|-------------|----------|---------|----------|
| `sips` | macOS (built-in) | None | Resize, convert (no trim/OG) |
| `sharp` | Node.js | `npm install sharp` | Full feature set, high performance |
| `ffmpeg` | Cross-platform | `brew install ffmpeg` | Resize, convert |

## Output Format Guide

| Use case | Format | Why |
|----------|--------|-----|
| Photos, hero images | WebP | Best compression, wide browser support |
| Logos, icons (need transparency) | PNG | Lossless, supports alpha |
| Fallback for older browsers | JPG | Universal support |
| Thumbnails | WebP or JPG | Small file size priority |
| OG cards | PNG | Social platforms handle PNG best |

## Core Patterns

### Save with Format-Specific Quality

Different formats need different save parameters. Always handle RGBA-to-JPG compositing — JPG does not support transparency, so composite onto a white background first.

```python
from PIL import Image
import os

def save_image(img, output_path, quality=None):
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    kwargs = {}
    ext = output_path.lower().rsplit(".", 1)[-1]

    if ext == "webp":
        kwargs = {"quality": quality or 85, "method": 6}
    elif ext in ("jpg", "jpeg"):
        kwargs = {"quality": quality or 90, "optimize": True}
        # RGBA → RGB: composite onto white background
        if img.mode == "RGBA":
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
    elif ext == "png":
        kwargs = {"optimize": True}

    img.save(output_path, **kwargs)
```

### Resize with Aspect Ratio

When only width or height is given, calculate the other from aspect ratio. Use `Image.LANCZOS` for high-quality downscaling.

```python
def resize_image(img, width=None, height=None):
    if width and height:
        return img.resize((width, height), Image.LANCZOS)
    elif width:
        ratio = width / img.width
        return img.resize((width, int(img.height * ratio)), Image.LANCZOS)
    elif height:
        ratio = height / img.height
        return img.resize((int(img.width * ratio), height), Image.LANCZOS)
    return img
```

### Trim Whitespace (Auto-Crop)

Remove surrounding whitespace from logos and icons. Convert to RGBA first, then use `getbbox()` to find content bounds.

```python
img = Image.open(input_path)
if img.mode != "RGBA":
    img = img.convert("RGBA")
bbox = img.getbbox()  # Bounding box of non-zero pixels
if bbox:
    img = img.crop(bbox)
```

### Thumbnail

Fit within max dimensions while maintaining aspect ratio:

```python
img.thumbnail((size, size), Image.LANCZOS)
```

### Optimise for Web

Resize + compress in one step. Convert to WebP for best compression. Typical settings: width 1920, quality 85.

### Cross-Platform Font Discovery

System font paths differ by OS. Try multiple paths, fall back to Pillow's default. On Linux, `fc-list` can discover fonts dynamically.

```python
from PIL import ImageFont

def get_font(size):
    font_paths = [
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        # Windows
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()
```

### OG Card Generation (1200x630)

Composite text on a background image or solid colour. Apply semi-transparent overlay for text readability. Centre text horizontally.

```python
from PIL import Image, ImageDraw, ImageFont

width, height = 1200, 630

# Background: image or solid colour
if background_path:
    img = Image.open(background_path).resize((width, height), Image.LANCZOS)
else:
    img = Image.new("RGB", (width, height), bg_color or "#1a1a2e")

# Semi-transparent overlay for text readability
overlay = Image.new("RGBA", (width, height), (0, 0, 0, 128))
img = img.convert("RGBA")
img = Image.alpha_composite(img, overlay)

draw = ImageDraw.Draw(img)
font_title = get_font(48)
font_sub = get_font(24)

# Centre title
if title:
    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, height // 2 - 60), title, fill="white", font=font_title)

img = img.convert("RGB")
```

## Common Workflows

### Logo Cleanup (client-supplied JPG with white background)

```bash
img-process trim logo-raw.jpg -o logo-trimmed.png --padding 10
img-process thumbnail logo-trimmed.png --size 512 -o favicon-512.png
```

### Prepare Hero Image for Production

```bash
img-process optimise hero.jpg --max-width 1920 --quality 85
# Outputs hero.webp — resized and compressed
```

### Batch Process

```bash
img-process batch ./raw-images --action convert --format webp --quality 85 -o ./optimised
img-process batch ./photos --action resize --width 800 -o ./thumbnails
```

### Pipeline with Gemini Image Gen

Generate images with the gemini-image-gen skill, then process them:

```bash
# After generating with Gemini (raw PNG output):
img-process optimise generated-image.png --max-width 1920 --quality 85
# Or batch process all generated images:
img-process batch ./generated --action optimise -o ./production
```
