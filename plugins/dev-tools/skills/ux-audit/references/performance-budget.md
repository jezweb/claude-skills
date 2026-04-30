# Performance Budget (pragmatic, not Google CWV)

"Perfect app" means nothing if it's slow. v2's screenshot sweep can't see slow.

But chasing Google's Core Web Vitals "Good" thresholds is for marketing teams optimising landing pages. For app interiors that real users sit inside, the bar is *user-perceivable*: does it feel snappy enough that nobody mentions it?

This sets a pragmatic floor — well above broken, well below CWV-strict.

## Thresholds (hard gates)

| Metric | Pragmatic threshold | CWV "Good" reference | Severity if exceeded |
|---|---|---|---|
| LCP (Largest Contentful Paint) | < 4.0s | < 2.5s | High |
| CLS (Cumulative Layout Shift) | < 0.25 | < 0.1 | High |
| INP (Interaction to Next Paint) | < 500ms | < 200ms | High |
| TTI-equivalent (page interactive) | < 5.0s | < 3.8s | Medium |

If all four are within the pragmatic threshold, the app feels fine. Tighter thresholds are noise unless the user explicitly cares about CWV (SEO landing pages, e-commerce checkout, paid-acquisition funnels).

## Measurement — Performance API in the browser

Don't run Lighthouse per page (30-60s each, network-throttling-dependent, noisy). Use the browser's `PerformanceObserver` to capture metrics inline. ~1 second per page.

```js
// In the browser eval, after the page has loaded
await page.evaluate(() => {
  return new Promise((resolve) => {
    let lcp = 0, cls = 0, inp = 0
    const lcpObs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) lcp = e.startTime
    })
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true })
    const clsObs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) cls += e.value
      }
    })
    clsObs.observe({ type: 'layout-shift', buffered: true })
    // INP only fires after a user interaction; capture the worst seen
    const inpObs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) inp = Math.max(inp, e.duration)
    })
    inpObs.observe({ type: 'event', buffered: true, durationThreshold: 16 })
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      resolve({
        lcp: Math.round(lcp),
        cls: Math.round(cls * 1000) / 1000,
        inp: Math.round(inp),
        ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadComplete: nav ? Math.round(nav.loadEventEnd) : null,
      })
    }, 1500) // give LCP + CLS time to settle
  })
})
```

## When to measure

**Once per audit, on the most representative page.** For a typical app, that's the page real users hit most often — usually the dashboard or the main work surface (chat, inbox, or list view).

Add to the audit run-time budget: ~3-5 seconds for the perf check. Do NOT run on every page — that triples audit time for diminishing returns. Spot-check 1-2 routes.

If the spot check exceeds threshold, expand to all primary routes.

## Throttling

The Performance API in headless Playwright runs unthrottled, which paints LCP/INP optimistically. For a realistic check:

```js
// Playwright: emulate slow 4G + 4× CPU
await page.context().route('**/*', (route) => {
  setTimeout(() => route.continue(), 50)  // crude delay
})
```

Or use Chrome DevTools MCP's `performance_start_trace` which has built-in throttling profiles.

If you measure unthrottled, document it in the report. A site that LCP=3.5s unthrottled is probably 6+s on real 4G — flag as a likely real-world fail.

## Hard-gate scorecard addition

Verdict block extension:

```
Performance (pragmatic budget, /dashboard sample):
  LCP:    [N]s   [GREEN/RED]   (threshold 4.0s)
  CLS:    [N]    [GREEN/RED]   (threshold 0.25)
  INP:    [N]ms  [GREEN/RED]   (threshold 500ms)
  TTI:    [N]s   [GREEN/RED]   (threshold 5.0s)
```

If any is RED, audit auto-Fails until fixed. Findings logged with the specific metric and the suspected source (large hero image, late-loading font, render-blocking script, hydration cost).

## Common offenders

| Symptom | Likely cause |
|---|---|
| LCP > 4s | Hero image not optimised; main script chunks too large; bundled font loaded synchronously |
| CLS > 0.25 | Web fonts swapping in late; ads/embeds loading without reserved space; client-rendered content above the fold |
| INP > 500ms | Heavy click handlers (re-renders on every keystroke); sync JSON parse; uncovered hydration mismatch |
| TTI > 5s | Bundle too big; too many synchronous module imports; SSR rendering on every nav |

Diagnose with Chrome DevTools Performance tab (or `performance_start_trace` via MCP) — capture a 5-second trace, look for long tasks > 50ms, render-blocking resources, layout-shift events.

## When to relax

Tighter thresholds (CWV-strict) apply when:

- The page is in an acquisition funnel (landing, signup) — bounce rate punishes slow
- The user pays for the page (e-commerce checkout)
- There's a specific contractual/legal uptime/perf SLA

For internal tools, AI agent UIs, dogfood apps, builder-mode pages — pragmatic threshold is the right bar. Don't over-optimise to win a Google score that nobody asked for.

## What this skill doesn't measure

- Time to first byte at the CDN edge (use Cloudflare / Vercel analytics)
- Server-side response time (use the worker / app's own logs)
- Real-user CWV (use Google Search Console for production)

Those are operational metrics. This audit measures *the rendering experience for a real user pulling the page now*.

**Last Updated**: 2026-04-30
