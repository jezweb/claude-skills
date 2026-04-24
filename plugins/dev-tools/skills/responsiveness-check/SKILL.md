---
name: responsiveness-check
description: "Test website responsiveness across viewport widths using browser automation. Resizes a single session through breakpoints, screenshots each width, and detects layout transitions (column changes, nav switches, overflow). Produces comparison reports showing exactly where layouts break. Trigger with 'responsiveness check', 'check responsive', 'breakpoint test', 'viewport test', 'responsive sweep', 'check breakpoints', or 'test at mobile'."
compatibility: Designed for Claude Code (or similar products)
---

# Responsiveness Check

Test how a website's layout responds to viewport width changes. Resizes through breakpoints in a single browser session, screenshots each width, compares adjacent sizes, and reports where layouts break.

**What this tests**: Layout responsiveness — overflow, stacking, navigation transitions, content reflow.

**What this does NOT test**: General accessibility (ARIA, semantic HTML, heading hierarchy, colour contrast). Those don't vary by viewport width — use the ux-audit skill instead.

## Browser Tool Priority

Before starting, detect available browser tools:

1. **playwright-cli** (preferred) — supports resize, named sessions, and sub-agent parallelism. If installed, run `/playwright-cli` first to load the full command reference.
2. **Playwright MCP** (`mcp__plugin_playwright_playwright__*`) — `browser_resize` for viewport changes.
3. **Chrome MCP** (`mcp__claude-in-chrome__*`) — `resize_window` for viewport changes. Uses the user's logged-in Chrome session.

If none are available, inform the user and suggest installing playwright-cli or Playwright MCP.

## Operating Modes

### Mode 1: Standard Check

**When**: "check responsive", "responsiveness check", "test breakpoints"

Test 8 key breakpoints that cover the device spectrum:

| Width | Device Context |
|-------|---------------|
| 320px | Small phone (iPhone SE) |
| 375px | Standard phone (iPhone 14) |
| 768px | Tablet portrait (iPad) |
| 1024px | Tablet landscape / small laptop |
| 1280px | Laptop |
| 1440px | Desktop |
| 1920px | Full HD |
| 2560px | Ultra-wide / 4K |

**Process**:

1. Open the URL in a single browser session (height: 900px)
2. Start at 320px. For each breakpoint width:
   a. Resize the viewport
   b. Wait briefly for CSS reflow (layout transition)
   c. Screenshot the above-fold area
   d. If the page has significant below-fold content, scroll and screenshot
   e. Run the 8 layout checks (see matrix below)
   f. Note any issues with severity
3. Compare adjacent widths — identify where layout transitions occur
4. Write the report

### Mode 2: Sweep

**When**: "responsive sweep", "sweep all breakpoints", "find where it breaks"

Test every 160px from 320 to 2560 (15 widths total). Same single-session approach as Standard — just more data points. This is the mode for finding the **exact width** where a layout breaks.

Widths: 320, 480, 640, 800, 960, 1120, 1280, 1440, 1600, 1760, 1920, 2080, 2240, 2400, 2560

**Briefly confirm** before starting sweep mode (15 screenshots is a meaningful session).

### Mode 3: Targeted Range

**When**: "check between 768 and 1024", "test tablet breakpoints", "focus on mobile widths"

Test a user-specified range at 80px increments. Use when a known trouble zone needs detailed investigation.

Example: "check between 768 and 1024" tests: 768, 848, 928, 1008 (plus 1024 as endpoint).

### Multi-URL

When testing multiple URLs (e.g., "check the homepage, about page, and contact page"):

- Launch **parallel sub-agents**, one per URL (not per breakpoint)
- Each sub-agent runs a standard check on its URL in its own named session
- Combine results into a single report

```
# Sub-agent pattern (playwright-cli)
playwright-cli -s=page1 open https://example.com/ &
playwright-cli -s=page2 open https://example.com/about &
```

## Layout Check Matrix

These 8 checks target issues that **actually vary by viewport width**:

| # | Check | What to Look For |
|---|-------|-----------------|
| 1 | **Horizontal overflow** | Content wider than viewport — horizontal scrollbar appears, elements cut off |
| 2 | **Text overflow** | Text truncated mid-word, overlapping adjacent elements, font size unreadable (< 12px) |
| 3 | **Navigation transition** | Hamburger menu appears/disappears at correct width, no "broken" state between modes |
| 4 | **Content stacking** | Multi-column layouts stack to single column in logical reading order on narrow widths |
| 5 | **Image/media scaling** | Images overflow container, distorted aspect ratios, missing responsive sizing |
| 6 | **Touch targets** | Interactive elements < 44px on mobile widths (< 768px) — buttons, links, form inputs |
| 7 | **Whitespace balance** | Too cramped on mobile (no breathing room), too sparse on wide screens (content lost in space) |
| 8 | **CTA visibility** | Primary call-to-action visible above the fold at each width without scrolling |

## Transition Detection

The unique value of this skill is **finding where layout transitions happen** and whether they're clean.

When comparing screenshots at adjacent widths, flag any width where:
- **Column count changes** (3-col → 2-col → 1-col grid)
- **Navigation mode switches** (full nav → hamburger, or vice versa)
- **Sidebar appears/disappears** (content width jumps)
- **Grid reflows** (cards wrap to next row)

Report the **exact width range** where each transition occurs:

| Transition | From | To | Width Range |
|-----------|------|-----|-------------|
| Nav: hamburger → full | 768px | 1024px | Switches at ~960px |
| Grid: 1-col → 2-col | 640px | 768px | Reflows at ~700px |
| Sidebar appears | 1024px | 1280px | Shows at ~1100px |

This tells the developer exactly where to set (or fix) their CSS breakpoints.

## Severity Levels

Consistent with ux-audit:

| Severity | Meaning |
|----------|---------|
| **Critical** | Layout is broken — content unreadable, navigation inaccessible, page unusable |
| **High** | Significant layout issue — major overflow, key content hidden, broken transition |
| **Medium** | Noticeable but usable — awkward spacing, minor overflow, suboptimal stacking order |
| **Low** | Polish — whitespace tweaks, slight alignment issues, minor touch target shortfalls |

## Autonomy Rules

- **Just do it**: Resize viewport, take screenshots, analyse layout, compare widths
- **Brief confirmation**: Before sweep mode (15 viewports), before testing 4+ URLs in parallel
- **Ask first**: Before interacting with forms or clicking through authentication flows

## Report Output

Write report to `docs/responsiveness-check-YYYY-MM-DD.md` (or inline for single-page quick checks).

See [references/report-template.md](references/report-template.md) for the report structure.

## Reference Files

| When | Read |
|------|------|
| Looking up breakpoint details and trouble zones | [references/breakpoints.md](references/breakpoints.md) |
| Writing the responsiveness report | [references/report-template.md](references/report-template.md) |
