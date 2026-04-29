# Browser Tool Reference

## Tool Selection

| Tool | Use for | Auth | Setup |
|------|---------|------|-------|
| **Chrome MCP** | Authenticated apps with a human at the keyboard — uses real logged-in Chrome session | Full — uses your logged-in Chrome session | Claude Code extension in Chrome |
| **Playwright MCP / `playwright-cli`** | Public / unauthenticated sites, OR authenticated apps via test-auth cookie injection (see below) | None / scripted | MCP plugin / npm package |

**Rule**: For authenticated apps, prefer Chrome MCP when a human is at the keyboard. For headless / autonomous runs (cron, CI, sub-agent, no human), use the test-auth cookie-injection path below. **Don't silently fall back to a fresh unauthed Playwright session for an authenticated app — the audit becomes worthless.**

For public sites with no login, Playwright MCP is fine (and can run in parallel sessions if needed).

### Headless authentication via project test-auth endpoint

If the project exposes a `/api/test-auth/cookies`-style endpoint (gated on a server-side `TEST_AUTH_TOKEN` secret), a headless agent can mint real session cookies and inject them into Playwright. This unlocks autonomous audits without requiring Chrome MCP.

Pattern (project-agnostic — any better-auth project can expose this):

```bash
# 1. Mint session cookies for a test user (creates if needed)
curl -sX POST "$URL/api/test-auth/cookies" \
  -H "X-Test-Auth: $TEST_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.<app>.local"}' > /tmp/cookies.json

# 2. Inject into Playwright via context.addCookies()
#    or pass to playwright-cli state-load
```

Implementation pattern (better-auth's `testUtils()` plugin loaded conditionally on the secret env var) is documented in the project's `CLAUDE.md` under "Test-auth (headless agent login)" if present.

Email is locked to `*@test.<anything>.local` so the endpoint can never accidentally take over a real user account. Different email per call → different test user (multi-user friendly).

**When to use which**:

| Scenario | Use |
|---|---|
| Human is at the keyboard, Chrome already signed in | Chrome MCP |
| Headless / cron / CI / sub-agent, project has `/api/test-auth/*` | Playwright + cookie injection |
| Headless and project has no test-auth endpoint | Stop. Ask the user to add one (it's ~80 lines), or run on an authenticated dev server with the user signed in |
| Public / unauth sites | Playwright MCP or playwright-cli |

## Screenshot sizing — Retina 2x trap

Most browser MCP tools capture at the OS device-pixel ratio. On Retina Macs that's 2x → a 1440×900 viewport screenshot is actually 2880×1800 pixels (~3 MB), and full-page captures of long timelines hit ~3000-4000px tall. This bloats the audit context fast and can hit Claude's image-input limit (~2000px per side).

**Always resize captures to ≤ 1440 longest side before referencing or committing them**:

```bash
sips -Z 1440 path/to/screenshot.png --out path/to/screenshot.png
```

Or batch:

```bash
for f in .jez/audit-evidence/2026-04-29/*.png; do
  sips -Z 1440 "$f" --out "$f"
done
```

Capture-time prevention (preferred):

| Tool | Default DPR | Note |
|---|---|---|
| chrome-devtools-mcp `take_screenshot` | 2x | Resize after, OR use `fullPage: false` to bound height |
| `mcp__claude-in-chrome__computer` action=screenshot | 2x | Follows OS DPR |
| `mcp__claude-in-chrome__gif_creator` | 2x frames | Encoder downsamples but still heavy |
| `playwright-cli` / Playwright MCP | 1x (CSS pixels) | **Prefer this when a reference screenshot is the goal** |

The user-global `~/.claude/rules/screenshot-sizing.md` covers the full pattern. There's also a `PreToolUse` hook on `Read` that auto-resizes oversized images — it's a safety net, not a substitute for capture-time discipline.

## Viewport

Pin the window at the start of every audit:

```
width: 1440, height: 900
```

This is the baseline (standard MacBook resolution). Responsive sweeps then test 1280, 1024, 768, 375.

**Do not resize above 2000px wide** — it breaks the harness. If the user asks to test ultra-wide layouts, screenshot at 1920 max.

## Chrome MCP Commands

| Action | Tool |
|--------|------|
| See current tabs | `mcp__claude-in-chrome__tabs_context_mcp` |
| Open new tab | `mcp__claude-in-chrome__tabs_create_mcp` with URL |
| Read page content | `mcp__claude-in-chrome__read_page` |
| Get page text | `mcp__claude-in-chrome__get_page_text` |
| Click element | `mcp__claude-in-chrome__computer` with click action |
| Fill form field | `mcp__claude-in-chrome__form_input` |
| Navigate | `mcp__claude-in-chrome__navigate` |
| Take screenshot | `mcp__claude-in-chrome__computer` with screenshot action |
| Run JavaScript | `mcp__claude-in-chrome__javascript_tool` |
| Resize window | `mcp__claude-in-chrome__resize_window` |
| Record GIF | `mcp__claude-in-chrome__gif_creator` |

**Important**: Call `tabs_context_mcp` first to see what tabs exist. Avoid triggering JS alerts/confirms — they block the extension.

## Playwright MCP Commands

| Action | Tool |
|--------|------|
| Navigate | `mcp__plugin_playwright_playwright__browser_navigate` |
| Take screenshot | `mcp__plugin_playwright_playwright__browser_take_screenshot` |
| Click | `mcp__plugin_playwright_playwright__browser_click` |
| Fill form | `mcp__plugin_playwright_playwright__browser_fill_form` |
| Get page snapshot | `mcp__plugin_playwright_playwright__browser_snapshot` |
| Resize | `mcp__plugin_playwright_playwright__browser_resize` |
| Run code | `mcp__plugin_playwright_playwright__browser_run_code` |

## playwright-cli Commands

```bash
playwright-cli -s=audit open https://app.example.com
playwright-cli -s=audit snapshot          # Get element refs
playwright-cli -s=audit click e5          # Click by ref
playwright-cli -s=audit screenshot --filename=issue-1.png
playwright-cli -s=audit close
```

Use `-s=NAME` for named sessions. Use `--persistent` to keep login state.

## Mobile Viewport Testing

```
# Chrome MCP
mcp__claude-in-chrome__resize_window — width: 375, height: 812

# Playwright MCP
mcp__plugin_playwright_playwright__browser_resize — width: 375, height: 812

# playwright-cli
playwright-cli -s=audit resize 375 812
```
