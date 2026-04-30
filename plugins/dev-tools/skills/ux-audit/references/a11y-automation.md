# Automated Accessibility (axe-core)

Manual keyboard-only walks (Scenario 5) catch focus traps and tab-order problems. They miss roughly 80% of structural a11y bugs — heading skips, contrast at hover/focus state, missing aria-labels, dynamic-content announcements, role mismatches. axe-core covers that 80% in <1 second per page.

This is **mandatory in Phase 4 (Polish)** for every audited page.

## The protocol

For every page audited:

1. Navigate to the page.
2. Inject axe-core (single CDN script tag).
3. Run `axe.run()` in the browser context.
4. Capture violations array.
5. Map severity → audit severity (table below) and log findings.

```js
// In the browser eval / playwright-cli / chrome MCP
await page.evaluate(async () => {
  // Inject axe-core if not present
  if (!window.axe) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js'
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }
  const results = await window.axe.run()
  return {
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      sample: v.nodes[0]?.html?.substring(0, 200),
    })),
    incomplete: results.incomplete.length,
    passes: results.passes.length,
  }
})
```

## Severity mapping

axe reports `impact` per violation. Map to audit severity:

| axe `impact` | Audit severity | Hard-gate? |
|---|---|---|
| `critical` | Critical | YES — audit auto-fails |
| `serious` | High | YES — audit auto-fails |
| `moderate` | Medium | No — finding, not gate |
| `minor` | Low | No — finding, not gate |

## Hard-gate threshold

Add to the SKILL.md hard gates table:

| Gate | Threshold | Severity if violated |
|---|---|---|
| axe-core Critical violations | > 0 | Critical |
| axe-core Serious violations | > 0 | High |

A page with > 0 axe Critical or > 0 axe Serious cannot pass the audit. axe Moderate / Minor accumulate as Medium / Low findings respectively.

## Allowlist for known-noise

Some axe rules fire on intentional design choices that aren't real bugs (e.g. `landmark-one-main` on a chrome-less embed page, `region` on a wrapper that intentionally has no landmark). Allowlist via `.jez/audit-config.yml`:

```yaml
axe:
  ignore_rules:
    - landmark-one-main   # iframe-style embed pages
    - region              # legacy wrapper, refactor scheduled 2026-Q3
  ignore_pages:
    - /dashboard/components  # builder-mode, intentional
    - /dashboard/style-guide # builder-mode, intentional
```

Default with no config: every axe Critical / Serious is a finding. Allowlist is opt-in.

## Findings format

Each axe violation becomes a finding in the report:

```
ID: H-N
Layer: Visual / Interaction (a11y)
Severity: High (axe Serious)
Surface: /dashboard/inbox

axe rule: color-contrast
  Description: Elements must have sufficient color contrast (WCAG AA: 4.5:1 normal, 3:1 large)
  Help: https://dequeuniversity.com/rules/axe/4.10/color-contrast
  Nodes affected: 3
  Sample: <button class="btn-secondary">Mark all read</button>
    Computed contrast: 3.2:1 (text-muted-foreground on bg-muted)
    Required: 4.5:1

Reproduce:
  1. Navigate to /dashboard/inbox
  2. Inspect "Mark all read" button (or any .btn-secondary)
  3. Read computed colour ratios in DevTools

Suspected location: src/components/ui/button.tsx — secondary variant; or the
  --muted-foreground token in src/styles/globals.css
Suggested fix: bump --muted-foreground from oklch(0.55 0 0) to oklch(0.45 0 0)
  or change secondary variant to use --foreground.
```

## What axe doesn't catch

axe is structural. It misses:

- Whether the screen-reader announcement actually conveys meaning
- Whether dynamic content (toasts, live updates) announces to AT
- Whether keyboard tab-order makes sense (axe checks focusability, not order quality)
- Whether copy is comprehensible to assistive tech users

Those still require Scenario 5 (Keyboard Only) + manual screen-reader testing for high-stakes apps. Don't drop those in favour of axe — combine.

## Run once per page

Don't loop axe per element. One `axe.run()` per page, after the page has settled (wait for `networkidle` or 1.5s). Re-run after major state changes (modal opened, drawer expanded) since aria attributes shift.

For a 16-route audit, total axe runtime is ~16 seconds. Cheap.

## Skipping pages

For builder-mode reference pages (Components, Style guide), axe is overkill — the page exists to display every component variant including disabled / error / contrast-test states that intentionally fail strict rules. Add to `ignore_pages` in the audit config.

For genuinely user-facing pages, no skipping. Even auth pages (sign-in, sign-up) audit cleanly.

## Companion: keyboard-only manual sweep

axe + Scenario 5 (Keyboard Only) is the right pair. axe catches the structural 80%; Scenario 5 catches the experiential 20% (tab order quality, focus visibility under custom themes, escape-key behaviour, focus trap in modals).

If you only have time for one, do axe (more bugs per minute). If the app is high-stakes (legal/medical/finance), do both.

**Last Updated**: 2026-04-30
