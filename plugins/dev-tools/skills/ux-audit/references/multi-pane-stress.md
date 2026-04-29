# Multi-Pane Stress

For apps with collapsible UI — sidebars, members panels, thread asides, drawers, sheets, info rails — the worst layout bugs hide in pane-overlap zones.

The 2026-04-29 vite-flare-starter vertical-text-in-spaces bug only manifested at viewport width 1024-1280px with all three panes open simultaneously. A single-viewport audit (even at the standard 1440px) saw nothing. Multi-pane stress is the only phase that catches this class.

## The matrix

For every app with > 1 collapsible pane, run this matrix:

| Viewport | Panes | What to capture | Common bug class |
|----------|-------|-----------------|------------------|
| **1920** | All open | Baseline screenshot | Should always work |
| **1440** | All open | Common dev resolution | Slight squeeze visible here |
| **1280** | All open | Where layout collapses start | **High-bug zone** |
| **1024** | All open | Tablet landscape | **Catastrophic-bug zone** |
| 1024 | 2-pane (drop one) | Verify graceful degradation | Should fold cleanly |
| 1024 | 1-pane (mobile-style) | Should fold cleanly | Edge: orphan controls |
| 768 | Default (most collapsed) | Tablet portrait | Touch targets, stacking |
| 375 | Mobile baseline | Mobile | Hamburger nav, sheet UX |

For each combination:

1. **Resize to the target viewport** (use the browser tool's resize, not just CSS media queries — real resize triggers layout recalculation)
2. **Open the panes per the matrix** (use the actual UI controls — opening via dev-tools state injection misses the real animation race)
3. **Scroll the longest content** in the main pane (long message, long form, long table)
4. **Capture a screenshot** with the pane combination labelled in the filename: `1280-all-3-panes.png`
5. **Run the layout-detection JS** (snippets below) to flag overflow / clipping / vertical-text-stacks
6. **Read console** — multi-pane resize often surfaces ResizeObserver loop errors

## Layout-detection JS (paste into console)

### Vertical text stack detector

This catches the catastrophic case where text wraps one character per line — only happens when a flex/grid container collapses to single-character width.

```js
// Detect text containers that have collapsed to single-character widths
(function detectVerticalTextStacks() {
  const findings = [];
  const all = document.querySelectorAll('p, span, div, td, li, article, section, [role="article"]');
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const text = (el.innerText || '').trim();
    if (text.length < 5) continue;
    // Heuristic: very narrow column AND multi-line. Tune ratio: chars vs lines.
    if (r.width < 30 && r.height > r.width * 3) {
      findings.push({
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') +
                  (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).slice(0, 2).join('.') : ''),
        width: r.width.toFixed(1),
        height: r.height.toFixed(1),
        textPreview: text.slice(0, 30) + (text.length > 30 ? '…' : ''),
      });
    }
  }
  console.warn('Vertical-text-stack candidates:', findings);
  return findings;
})();
```

### Overflow / clip detector

```js
// Detect children that overflow their parents in horizontal direction
(function detectHorizontalOverflow() {
  const findings = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    if (el.scrollWidth - el.clientWidth > 1) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      findings.push({
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        overflow: el.scrollWidth - el.clientWidth,
      });
    }
  }
  console.warn('Horizontal overflow candidates:', findings.slice(0, 20));
  return findings;
})();
```

### Min-content collapse detector

```js
// Detect elements whose actual width is below their min-content
// (signals a missing min-w-* / min-w-0 misuse)
(function detectMinContentCollapse() {
  const findings = [];
  const candidates = document.querySelectorAll('main, [role="main"], .timeline, .messages, [data-pane]');
  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    // Heuristic: pane primary content with width < 200px is almost always wrong on desktop
    if (r.width < 200 && r.height > 100) {
      findings.push({
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
        width: r.width.toFixed(1),
        height: r.height.toFixed(1),
        suspect: 'pane width < 200px on what looks like primary content — verify min-width or fold-trigger',
      });
    }
  }
  console.warn('Min-content collapse candidates:', findings);
  return findings;
})();
```

## Pane discovery — find what to test

If you don't know which panes the app has, discover them:

```js
// Find probable panes (collapsible / dismissible regions)
(function discoverPanes() {
  const found = [];
  // Look for explicit pane markers
  document.querySelectorAll('[data-pane], aside, [role="complementary"], .sidebar, .drawer, .sheet, [data-sidebar], [data-drawer]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    found.push({
      selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.dataset.pane ? `[data-pane="${el.dataset.pane}"]` : ''),
      width: r.width.toFixed(1),
      role: el.getAttribute('role') || el.dataset.pane || 'unlabeled',
    });
  });
  console.log('Probable panes:', found);
  return found;
})();
```

Look for the controls that toggle them — usually a hamburger button, a chevron, an X close button, or a keyboard shortcut. Test each combination.

## Common bug patterns by combination

### 1280px, all panes open
- **Vertical text stacking** — main column squeezed below word-min-width. Cause: `min-w-0` on a flex container without setting a `min-w-[260px]` on the children. **Always log a finding here.**
- **Truncated headings without ellipsis** — `text-truncate` not applied to a flex child.
- **Overlapping panes** — z-index conflicts at the boundary.

### 1024px, all panes open
- **Catastrophic squeeze** — main pane drops below readable width. Should auto-fold one of the panes.
- **Buttons clipped or wrapped weirdly** — toolbar items push to a second line.
- **Modal trap** — opening a modal at this size makes it unfit-the-screen, no escape.

### 1024px, 1 pane (mobile-style)
- **Orphan controls** — buttons that only existed in the closed-pane don't reappear in the simplified layout.
- **Filter / sort lost** — interactions wired only to the desktop layout.

### 768px, default
- **Touch targets** — < 48×48px. Apple HIG / Material both require this.
- **Stacked layouts that look broken** — components stacked but not gap'd.
- **Text adjacent to actions** — copy that wraps under a button it was supposed to label.

### 375px, mobile
- **Sheet UX broken** — bottom sheets that don't dismiss / don't render full-height.
- **Hamburger nav** — opens but can't close, or closes when it shouldn't.
- **Forms below the fold** — Send / Save buttons require scroll to reach.

## Findings format

Every multi-pane stress finding should record:

```
ID: H-3
Layer: Visual / Interaction
Severity: High
Surface: /dashboard/spaces/:id
Viewport: 1280×800
Panes open: sidebar, members, thread (3 / 3)
Persona: SME owner

Reproduce:
  1. Resize browser to 1280×800
  2. Sign in, navigate to any space
  3. Open the members panel (click the 👥 icon in the top-right)
  4. Click any message → opens thread aside
  5. Look at the message timeline column

Observed: message text wraps one character per line — vertical column ~24px wide.
Expected: message text wraps at word boundaries within the available column width (≥ 260px).
Evidence:
  - .jez/audit-evidence/2026-04-29/spaces-1280-3panes.png
  - .jez/audit-evidence/2026-04-29/spaces-1280-3panes-devtools.png
Suspected location: src/client/modules/spaces/pages/SpacePage.tsx:200 — `<main className="flex-1 min-w-0">`
Suggested fix: Replace `min-w-0` with `min-w-[260px]` to enforce minimum readable width, OR auto-fold the members pane at lg breakpoint.
```

## Automation hint — capture the matrix in one pass

If running Playwright, this loop captures the full matrix in ~2 minutes per route:

```ts
const viewports = [1920, 1440, 1280, 1024, 768, 375];
const paneCombos = ['all-open', '2-open', '1-open', 'all-closed'];

for (const vw of viewports) {
  for (const combo of paneCombos) {
    await page.setViewportSize({ width: vw, height: 800 });
    await openPanes(page, combo);   // helper specific to the app
    await page.evaluate(detectVerticalTextStacks);
    await page.screenshot({ path: `evidence/${route}-${vw}-${combo}.png` });
  }
}
```

For Chrome MCP, the loop is run interactively — same protocol, manual viewport changes.

## When to skip multi-pane stress

Only skip if the app has zero collapsible panes (a single-column form-only app, a CRUD admin with no aside).

For everything else, this phase is mandatory. The bugs that live here are by definition invisible to single-viewport audits.
