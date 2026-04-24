---
name: walkthrough-video
description: "Generate professional walkthrough videos from app screenshots or live sites using Remotion. Smooth transitions, zoom effects, text overlays, and optional voiceover narration. Produces MP4 videos for demos, product showcases, or documentation. Triggers: 'walkthrough video', 'demo video', 'product video', 'create a video walkthrough', 'remotion video', 'screen recording', 'app demo', 'showcase video', 'generate video from screenshots'."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
compatibility: Designed for Claude Code (or similar products)
---

# Walkthrough Video Generator

Create professional walkthrough videos from app screenshots or live sites using Remotion. Produces smooth, polished MP4 videos with transitions, zoom effects, and text overlays.

## Overview

This skill takes a set of screenshots (or captures them from a running app) and orchestrates them into a Remotion video composition with:

- **Smooth transitions** between screens (fade, slide, wipe)
- **Zoom effects** to highlight specific UI areas
- **Text overlays** with titles, descriptions, and callouts
- **Progress indicators** showing position in the walkthrough
- **Optional voiceover** narration track

## Prerequisites

- **Node.js** 18+ installed
- **Screenshots** of the app (or a running app to screenshot)
- No Remotion experience needed — the skill generates all code

## Workflow

### Step 1: Gather Screenshots

Choose one approach:

#### Option A: From Existing Screenshots

If the user already has screenshots (e.g. from `design-loop` or `product-showcase`):

```
Read screenshots from:
- .design/screenshots/
- .jez/screenshots/
- User-specified directory
```

Sort them in walkthrough order (alphabetically by filename, or as user specifies).

#### Option B: Capture from Running App

If the app is running locally:

1. Start Playwright CLI session
2. Navigate through each screen in sequence
3. Screenshot at consistent dimensions (1280x720 recommended for video)
4. Save to `video/public/screens/`

```bash
playwright-cli -s=walkthrough open http://localhost:3000
playwright-cli -s=walkthrough resize 1280 720
playwright-cli -s=walkthrough screenshot --filename=video/public/screens/01-home.png
# Navigate to next page...
playwright-cli -s=walkthrough screenshot --filename=video/public/screens/02-dashboard.png
```

#### Option C: From Live URL

Same as Option B but with a public URL. Screenshot each key page.

### Step 2: Create Screen Manifest

Build a `screens.json` describing the walkthrough:

```json
{
  "projectName": "My App Walkthrough",
  "fps": 30,
  "width": 1280,
  "height": 720,
  "screens": [
    {
      "id": "home",
      "title": "Welcome to MyApp",
      "description": "The landing page introduces the core value proposition",
      "imagePath": "screens/01-home.png",
      "durationSeconds": 4,
      "transition": "fade",
      "zoomTarget": null
    },
    {
      "id": "dashboard",
      "title": "Your Dashboard",
      "description": "See all your projects at a glance",
      "imagePath": "screens/02-dashboard.png",
      "durationSeconds": 5,
      "transition": "slide-left",
      "zoomTarget": { "x": 100, "y": 200, "width": 400, "height": 300, "delay": 2 }
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique screen identifier |
| `title` | string | Text overlay title |
| `description` | string | Subtitle or narration text |
| `imagePath` | string | Path relative to `video/public/` |
| `durationSeconds` | number | How long to show this screen |
| `transition` | string | `fade`, `slide-left`, `slide-right`, `slide-up`, `wipe`, `none` |
| `zoomTarget` | object/null | If set, zoom into this region after `delay` seconds |

### Step 3: Scaffold Remotion Project

If no Remotion project exists:

```bash
mkdir -p video
cd video
npm init -y
npm install remotion @remotion/cli @remotion/transitions react react-dom
npm install -D typescript @types/react
```

Create the project structure:

```
video/
├── src/
│   ├── Root.tsx                    # Remotion entry point
│   ├── WalkthroughComposition.tsx  # Main composition
│   ├── components/
│   │   ├── ScreenSlide.tsx         # Individual screen display
│   │   ├── TextOverlay.tsx         # Title/description overlay
│   │   ├── ProgressBar.tsx         # Walkthrough progress indicator
│   │   └── ZoomEffect.tsx          # Zoom into regions
│   └── config.ts                   # Load screens.json, calculate durations
├── public/
│   └── screens/                    # Screenshot assets
│       ├── 01-home.png
│       └── 02-dashboard.png
├── screens.json                    # Screen manifest
├── remotion.config.ts
├── tsconfig.json
└── package.json
```

### Step 4: Generate Remotion Components

Generate each component file. Key patterns:

#### Root.tsx

```tsx
import { Composition } from "remotion";
import { WalkthroughComposition } from "./WalkthroughComposition";
import { screens, totalDurationInFrames, FPS, WIDTH, HEIGHT } from "./config";

export const RemotionRoot = () => (
  <Composition
    id="Walkthrough"
    component={WalkthroughComposition}
    durationInFrames={totalDurationInFrames}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{ screens }}
  />
);
```

#### ScreenSlide.tsx Pattern

```tsx
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface ScreenSlideProps {
  imageSrc: string;
  title: string;
  description: string;
}

export const ScreenSlide: React.FC<ScreenSlideProps> = ({ imageSrc, title, description }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in
  const opacity = spring({ frame, fps, config: { damping: 20 } });

  // Subtle zoom (Ken Burns effect)
  const scale = 1 + frame * 0.0002;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img
        src={imageSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity,
          transform: `scale(${scale})`,
        }}
      />
      {/* Text overlay at bottom */}
      <div style={{
        position: "absolute",
        bottom: 40,
        left: 40,
        right: 40,
        opacity: spring({ frame: frame - 15, fps, config: { damping: 20 } }),
      }}>
        <h2 style={{ color: "#fff", fontSize: 32, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          {title}
        </h2>
        <p style={{ color: "#ccc", fontSize: 18, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          {description}
        </p>
      </div>
    </AbsoluteFill>
  );
};
```

#### Transitions Between Screens

Use `@remotion/transitions` for transitions:

```tsx
import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

// In WalkthroughComposition:
<TransitionSeries>
  {screens.map((screen, i) => (
    <TransitionSeries.Sequence
      key={screen.id}
      durationInFrames={screen.durationSeconds * FPS}
    >
      <ScreenSlide {...screen} />
    </TransitionSeries.Sequence>
    // Add transition between screens (not after last)
    {i < screens.length - 1 && (
      <TransitionSeries.Transition
        presentation={getTransition(screens[i + 1].transition)}
        timing={springTiming({ config: { damping: 20 }, durationInFrames: 15 })}
      />
    )}
  ))}
</TransitionSeries>
```

### Step 5: Preview and Refine

```bash
cd video
npx remotion studio
```

This opens a browser-based preview. Check:
- Timing feels right for each screen
- Transitions are smooth
- Text overlays are readable
- Zoom targets hit the right area
- Progress bar (if included) is accurate

### Step 6: Render the Video

```bash
cd video
npx remotion render Walkthrough output.mp4 --codec h264
```

For higher quality:
```bash
npx remotion render Walkthrough output.mp4 --codec h264 --quality 90
```

For web-optimised (smaller file):
```bash
npx remotion render Walkthrough output.webm --codec vp8
```

## Advanced Features

### Zoom to Region

Zoom into a specific area of the screen to highlight a feature:

```tsx
// In ZoomEffect.tsx — interpolate scale and translate
const zoomScale = interpolate(frame, [delayFrames, delayFrames + 30], [1, 2.5], {
  extrapolateRight: "clamp",
});
const translateX = interpolate(frame, [delayFrames, delayFrames + 30], [0, -targetX], {
  extrapolateRight: "clamp",
});
```

### Animated Callout Circles

Draw attention to UI elements:

```tsx
// Pulsing circle that appears at a specific point
const scale = spring({ frame: frame - delay, fps, config: { damping: 8, stiffness: 80 } });
<div style={{
  position: "absolute",
  left: x - 20, top: y - 20,
  width: 40, height: 40,
  borderRadius: "50%",
  border: "3px solid #3B82F6",
  transform: `scale(${scale})`,
  opacity: Math.min(1, scale),
}} />
```

### Background Music

Add a subtle background track:

```tsx
import { Audio } from "remotion";

<Audio src={staticFile("music/background.mp3")} volume={0.15} />
```

### Intro and Outro Slides

Add title card at start and CTA at end:

```tsx
// First sequence: Title card (3 seconds)
<TransitionSeries.Sequence durationInFrames={90}>
  <TitleCard projectName="MyApp" tagline="The future of project management" />
</TransitionSeries.Sequence>

// ... screen sequences ...

// Last sequence: CTA card (4 seconds)
<TransitionSeries.Sequence durationInFrames={120}>
  <CtaCard url="myapp.com" text="Try it free" />
</TransitionSeries.Sequence>
```

## Transition Reference

| Name | Effect | Best for |
|------|--------|----------|
| `fade` | Cross-fade dissolve | Default, works everywhere |
| `slide-left` | New screen slides in from right | Sequential flow (next page) |
| `slide-right` | New screen slides in from left | Going back |
| `slide-up` | New screen slides in from bottom | Drill-down into detail |
| `wipe` | Wipe transition | Dramatic reveal |
| `none` | Hard cut | Quick comparison |

## Output Options

| Format | Command | Use case |
|--------|---------|----------|
| MP4 (H.264) | `--codec h264` | Universal compatibility |
| WebM (VP8) | `--codec vp8` | Web embedding, smaller files |
| GIF | `--image-format png` then `ffmpeg` | Short loops, social media |
| PNG sequence | `--image-format png --sequence` | Post-production editing |

## Tips

- **1280x720 is ideal** for web walkthrough videos (good quality, reasonable file size)
- **3-5 seconds per screen** feels natural — longer for complex screens
- **Fade is the safest transition** — use others sparingly for emphasis
- **Text overlays need contrast** — use text-shadow or semi-transparent background
- **Ken Burns effect** (subtle zoom) prevents static screenshots from feeling dead
- **Preview before rendering** — `npx remotion studio` saves time vs full renders
- **Keep it under 90 seconds** — attention drops sharply after that

## Common Pitfalls

- ❌ Using screenshots at different dimensions (causes scaling issues)
- ❌ Too many transition types (pick 1-2 and stay consistent)
- ❌ Text overlays that are too small or lack contrast
- ❌ No intro/outro — video feels abrupt
- ❌ Rendering before previewing (wastes time on fixable issues)
- ❌ Forgetting `staticFile()` for assets in `public/` directory
