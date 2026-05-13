---
name: ai-image-generator
description: "Generate AI images using Gemini or GPT APIs directly. Covers model selection (Gemini for scenes; GPT Image 2 for text rendering, batch variations, multi-reference compositing; GPT Image 1.5 for transparent icons), the 5-part prompting framework, API calling patterns, multi-turn editing, and quality assurance. Produces photorealistic scenes, icons, illustrations, OG images, posters, infographics, and product shots. Use when building websites that need images, creating marketing assets, or generating visual content. Triggers: 'generate image', 'ai image', 'create hero image', 'make an icon', 'generate illustration', 'create og image', 'poster', 'infographic', 'image variations', 'gpt-image-2', 'ai art', 'image generation'."
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
compatibility: claude-code-only
---

# AI Image Generator

Generate images using AI APIs (Google Gemini and OpenAI GPT). This skill teaches the prompting patterns and API mechanics for producing professional images directly from Claude Code.

> **Managed alternative**: If you don't want to manage API keys, [ImageBot](https://imagebot.au) provides a managed image generation service with album templates and brand kit support.

## Model Selection

Choose the right model for the job:

| Need | Model | Why |
|------|-------|-----|
| **Photorealistic scenes / stock photos** | Gemini 3.1 Flash Image | Best depth, complexity, environmental context |
| **Final client scenes (higher detail)** | Gemini 3 Pro Image | Higher detail, better style consistency |
| **Text on images** (posters, OG with copy, infographics) | GPT Image 2 | Text rendering actually works — including multi-script |
| **10-variation style exploration** | GPT Image 2 | Native batch — one prompt, 10 variants sharing composition + palette |
| **Multi-reference compositing** (product + lifestyle) | GPT Image 2 | Handles lighting, scale, perspective across references |
| **Transparent icons / logos** | GPT Image 1.5 | Native RGBA alpha — **GPT Image 2 cannot do transparency** |
| **Quick drafts / iteration** | Gemini 2.5 Flash Image | Free tier (~500/day) |

**Rule of thumb**: any image with readable text → GPT Image 2 (unless you need transparency, then GPT 1.5). Otherwise → Gemini.

### Model IDs

| Model | API ID | Provider |
|-------|--------|----------|
| Gemini 3.1 Flash Image | `gemini-3.1-flash-image-preview` | Google AI |
| Gemini 3 Pro Image | `gemini-3-pro-image-preview` | Google AI |
| Gemini 2.5 Flash Image | `gemini-2.5-flash-image` | Google AI |
| GPT Image 2 (default) | `gpt-image-2` | OpenAI |
| GPT Image 2 (ChatGPT-parity output) | `chatgpt-image-latest` | OpenAI |
| GPT Image 1.5 (transparency-only) | `gpt-image-1.5` | OpenAI |

**Verify model IDs before use** — they change frequently:
```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | python3 -c "import sys,json; [print(m['name']) for m in json.load(sys.stdin)['models'] if 'image' in m['name'].lower()]"
```

## GPT Image 2 Specifics

Released 2026-04-22. Three capabilities that change when you'd reach for it.

### 1. Text rendering actually works

Posters, OG images with headlines, infographics with labels, UI mockups, pricing cards. Text is rendered reliably, including non-Latin scripts (Japanese, Korean, Hindi, Bengali). Primary reason to switch from Gemini — Gemini doesn't render readable text at all.

### 2. Multi-variation batching

One prompt, up to 10 images in a single call. Variants share composition and palette but differ in detail. Good for style exploration before committing, A/B options for a client, rapid ideation.

### 3. Multi-reference compositing

Feed reference images alongside your prompt — product shots, lifestyle scenes, logos. The model places the product into the scene with correct lighting, scale, perspective. Enables "product in context" workflows without multi-turn editing.

### Modes

- **Instant** (default, all plans) — generates without a planning pass. Fast, good enough for most cases.
- **Thinking** (Plus/Pro/Business plans) — plans layout before drawing. Use when element counts matter ("3 icons in a row", "5 feature bullets") or text must land in specific regions. Fewer re-rolls on complex compositions.

### Aspect ratios

3:1 ultra-wide through 1:3 ultra-tall, plus 1:1, 3:2, 2:3, 16:9, 9:16. Wider range than other models — useful for website banners (ultra-wide hero) or mobile story formats (ultra-tall).

### Pixel size constraints

The API requires both **width AND height to be divisible by 16**. Aspect ratio is free — any shape works — but the actual pixel dimensions must hit the 16-pixel grid. Requesting `1792x936` fails with HTTP 400 because `936 / 16 = 58.5`; `1792x944` works (`944 / 16 = 59`, gives 1.898:1).

**Generate at your target aspect natively** — don't generate at one shape and crop to another. The model composes for the canvas it's given, and cropping post-hoc usually clips intentional elements (wordmarks, accents, edge motifs).

Cheat sheet of useful sizes (both dimensions divisible by 16):

| Aspect | Size | Use case |
|---|---|---|
| 1:1 | 1024×1024 | Instagram post, avatar |
| 16:9 | 1792×1008 | X/Twitter card, near-OG |
| 1.91:1 (OG canonical) | **1792×944** (=1.898:1) or 1216×640 | Facebook / LinkedIn OG |
| 2:1 | 1536×768 | Banner |
| 3:1 ultra-wide | 1536×512 | Hero strip |
| 2:3 portrait | 1024×1536 | Story-style portrait |
| 9:16 vertical | 1008×1792 | Instagram Story |

For OG specifically: generate at `1792x944`, then resize to `1200x630` for serving. The 1.898 → 1.905 squish is imperceptible.

### Resolution

Up to 2K on the long edge standard. 4K in beta.

### Generation time

**Up to 2 minutes on complex prompts.** Build async UX — don't block on the response. Show progress or spin off and poll.

### Constraints

- **No transparent backgrounds.** Fall back to `gpt-image-1.5` when you need PNG transparency.
- **API Org Verification may be required** before the endpoint fires — enable in your OpenAI account settings if you hit auth errors on first call.

### Pricing (per 1024×1024 image)

| Quality | Cost |
|---------|------|
| Low | $0.006 |
| Medium | $0.053 |
| High | $0.211 |

Token pricing: $5/M text in, $10/M text out, $8/M image in, $30/M image out.

## The 5-Part Prompting Framework

Build prompts in this order for consistent results:

### 1. Image Type
Set the genre: "A photorealistic photograph", "An isometric illustration", "A flat vector icon"

### 2. Subject
Who or what, with specific details: "of a warm, approachable Australian woman in her early 30s, smiling naturally"

### 3. Environment
Setting and spatial relationships: "in a bright modern home with terracotta decor on wooden shelves behind her"

### 4. Technical Specs
Camera and lighting: "Shot at 85mm f/2.0, natural window light, head and shoulders framing"

### 5. Constraints
What to exclude: "Photorealistic, no text, no watermarks, no logos"

### Example (Good vs Bad)

```
BAD — keyword soup:
"professional woman, spa, warm lighting, high quality, 4K"

GOOD — narrative direction:
"A professional skin treatment scene in a warm clinical setting.
A practitioner wearing blue medical gloves uses a microneedling pen
on the client's forehead. The client lies on a white treatment bed,
eyes closed, relaxed. Warm golden-hour light from a window to the
left. Terracotta-toned wall visible in the background. Shot at
85mm f/2.0, shallow depth of field. No text, no watermarks."
```

## Workflow

### 1. Determine Image Need

| Purpose | Aspect Ratio | Model |
|---------|-------------|-------|
| Hero banner (no text) | 16:9 or 21:9 | Gemini |
| Hero banner with headline copy | 16:9 or 3:1 ultra-wide | GPT Image 2 |
| Service card | 4:3 or 3:4 | Gemini |
| Profile / avatar | 1:1 | Gemini |
| Icon / badge (transparent) | 1:1 | GPT Image 1.5 |
| OG / social share (no text) | 1.91:1 | Gemini |
| OG / social share with copy | 1.91:1 | GPT Image 2 |
| Poster / infographic / pricing card / any typography-heavy | varies | GPT Image 2 |
| Style exploration (10 variants of one concept) | any | GPT Image 2 (batch) |
| Instagram post | 1:1 or 4:5 | Gemini |
| Mobile hero | 9:16 | Gemini |

### 2. Build the Prompt

Use the 5-part framework. Refer to `references/prompting-guide.md` for detailed photography parameters.

### 3. Generate via API

#### Gemini (Python — handles shell escaping correctly)

```python
python3 << 'PYEOF'
import json, base64, urllib.request, os, sys

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Set GEMINI_API_KEY environment variable"); sys.exit(1)

model = "gemini-3.1-flash-image-preview"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"

prompt = """A professional photograph of a modern co-working space in
Newcastle, Australia. Natural light floods through floor-to-ceiling
windows. Three people collaborate at a standing desk — one pointing
at a laptop screen. Exposed brick wall, potted fiddle-leaf fig,
coffee cups on the desk. Shot at 35mm f/4.0, environmental portrait
style. No text, no watermarks, no logos."""

payload = json.dumps({
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"],
        "temperature": 0.8
    }
}).encode()

req = urllib.request.Request(url, data=payload, headers={
    "Content-Type": "application/json",
    "User-Agent": "ImageGen/1.0"
})

resp = urllib.request.urlopen(req, timeout=120)
result = json.loads(resp.read())

# Extract image from response
for part in result["candidates"][0]["content"]["parts"]:
    if "inlineData" in part:
        img_data = base64.b64decode(part["inlineData"]["data"])
        output_path = "hero-image.png"
        with open(output_path, "wb") as f:
            f.write(img_data)
        print(f"Saved: {output_path} ({len(img_data):,} bytes)")
        break
PYEOF
```

#### GPT Image 1.5 — Transparent Icons

Use `gpt-image-1.5` specifically for the transparent PNG case. GPT Image 2 cannot do transparency.

```python
python3 << 'PYEOF'
import json, base64, urllib.request, os, sys

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Set OPENAI_API_KEY environment variable"); sys.exit(1)

url = "https://api.openai.com/v1/images/generations"

payload = json.dumps({
    "model": "gpt-image-1.5",
    "prompt": "A minimal, clean plumbing wrench icon. Flat design, single consistent stroke weight, modern style. On a transparent background.",
    "n": 1,
    "size": "1024x1024",
    "background": "transparent",
    "output_format": "png"
}).encode()

req = urllib.request.Request(url, data=payload, headers={
    "Content-Type": "application/json",
    "Authorization": f"Bearer {OPENAI_API_KEY}"
})

resp = urllib.request.urlopen(req, timeout=120)
result = json.loads(resp.read())

img_data = base64.b64decode(result["data"][0]["b64_json"])
with open("icon-wrench.png", "wb") as f:
    f.write(img_data)
print(f"Saved: icon-wrench.png ({len(img_data):,} bytes)")
PYEOF
```

#### GPT Image 2 — Text-heavy or Batch Variations

Use `gpt-image-2` when text has to render readably, or when you want 10 variants in one call. **No transparency** — if you need transparent bg, use 1.5 above.

```python
python3 << 'PYEOF'
import json, base64, urllib.request, os, sys, pathlib

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Set OPENAI_API_KEY environment variable"); sys.exit(1)

url = "https://api.openai.com/v1/images/generations"

# 10-variation batch of a pricing card with rendered text
payload = json.dumps({
    "model": "gpt-image-2",
    "prompt": (
        "A modern pricing card for a web hosting plan. "
        "Headline 'Starter' in bold sans-serif. "
        "Price '$29/month' directly below in large type. "
        "Three feature lines: 'Unlimited bandwidth', 'SSD storage', 'Free SSL'. "
        "Clean flat design, soft drop shadow, deep blue accent colour. "
        "White card on light grey background."
    ),
    "n": 10,
    "size": "1024x1024",
    "quality": "medium",
    "output_format": "png"
}).encode()

req = urllib.request.Request(url, data=payload, headers={
    "Content-Type": "application/json",
    "Authorization": f"Bearer {OPENAI_API_KEY}"
})

# Timeout: up to 2 min for complex prompts
resp = urllib.request.urlopen(req, timeout=180)
result = json.loads(resp.read())

pathlib.Path("variations").mkdir(exist_ok=True)
for i, item in enumerate(result["data"], 1):
    img_data = base64.b64decode(item["b64_json"])
    path = f"variations/pricing-card-{i:02d}.png"
    with open(path, "wb") as f:
        f.write(img_data)
    print(f"Saved: {path} ({len(img_data):,} bytes)")

print(f"\nGenerated {len(result['data'])} variants. Pick the best; delete the rest.")
PYEOF
```

**Batch workflow**: generate 10 → review them side-by-side → pick 1-2 → optionally regenerate with tighter prompt on the winning direction. Faster than single-shot + iterate.

### 4. Save and Optimise

Save generated images to `.jez/artifacts/` or the user's specified path.

Post-processing (optional):
```bash
# Convert to WebP for web use
python3 -c "
from PIL import Image
img = Image.open('hero-image.png')
img.save('hero-image.webp', 'WEBP', quality=85)
print(f'WebP: {img.size[0]}x{img.size[1]}')
"

# Trim whitespace from transparent icons
python3 -c "
from PIL import Image
img = Image.open('icon.png')
trimmed = img.crop(img.getbbox())
trimmed.save('icon-trimmed.png')
"
```

### 5. Quality Check (Optional)

Send the generated image back to a vision model for QA:

```python
# Send to Gemini Flash for critique
critique_prompt = """Review this image for:
1. AI artifacts (extra fingers, floating objects, text errors)
2. Technical accuracy (wrong equipment, unsafe positioning)
3. Composition issues (awkward cropping, cluttered background)
4. Style consistency with a professional stock photo

List any issues found, or say 'PASS' if the image is production-ready."""
```

If issues are found, append them as negative guidance to the original prompt and regenerate.

## Multi-Turn Editing

Gemini supports editing a generated image across conversation turns. The key requirement: **preserve thought signatures** from model responses.

```python
# Turn 1: Generate base image
contents = [{"role": "user", "parts": [{"text": "Scene prompt..."}]}]

# The response includes thoughtSignature on parts — preserve them ALL

# Turn 2: Edit the image
contents = [
    {"role": "user", "parts": [{"text": "Original prompt"}]},
    {"role": "model", "parts": response_parts_with_signatures},  # Keep intact
    {"role": "user", "parts": [{"text": "Edit: change the wall colour to blue. Keep everything else exactly the same."}]}
]
```

**Edit prompt pattern**: Always specify what to KEEP unchanged, not just what to change. The model treats unlisted elements as free to modify.

```
GOOD: "Edit this image: keep the people, desk, and window unchanged.
Only change: wall colour from terracotta to ocean blue."

BAD: "Now make the wall blue."
(Model may change everything else too)
```

## API Key Setup

| Provider | Get key at | Env variable |
|----------|-----------|-------------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com/apikey) | `GEMINI_API_KEY` |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | `OPENAI_API_KEY` |

```bash
export GEMINI_API_KEY="your-key-here"
export OPENAI_API_KEY="your-key-here"
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using curl for Gemini prompts | Use Python — shell escaping breaks on apostrophes |
| "Beautiful, professional, high quality" | Use concrete specs: "85mm f/1.8, golden hour light" |
| Not specifying what to exclude | Always end with "No text, no watermarks, no logos" |
| Requesting transparent PNG from Gemini | Gemini cannot do transparency — use GPT Image 1.5 with `background: "transparent"` |
| Requesting transparent PNG from GPT Image 2 | GPT Image 2 **cannot do transparency** — fall back to `gpt-image-1.5` for this case only |
| Using GPT Image 1.5 for text on images | GPT Image 1.5 text rendering is unreliable — use `gpt-image-2` for any readable text |
| Blocking a request to GPT Image 2 | Generation can take up to 2 min on complex prompts — use 180s timeout, build async UX |
| Submitting odd pixel dims to GPT Image 2 | Both width and height must be divisible by 16 (e.g. `1792x936` is rejected, `1792x944` works) |
| Generating at one shape and cropping to another | Generate at the target aspect natively — cropping post-hoc clips intentional elements like wordmarks and accents |
| American defaults for AU businesses | Explicitly specify "Australian" + local architecture, vegetation |
| Generic data for model ID | Verify current model IDs — they change frequently |
