# UX Audit Report Template

Write the report to `docs/ux-audit-YYYY-MM-DD.md`. If `.jez/artifacts/` exists in the project, write to `.jez/artifacts/ux-audit-YYYY-MM-DD.md` instead.

Write incrementally — open the file at the start of the audit, append as you go. Don't batch at the end.

```markdown
# UX Audit: [App Name]

**Date**: YYYY-MM-DD
**URL**: https://app.example.com
**Persona**: "[role, context, tech comfort, time pressure, device]"
**Browser**: Chrome MCP / Playwright MCP
**Viewport**: 1440×900 (baseline) + responsive sweep + dark mode
**Reference extract used**: [path or "none"]

## Summary

[2–3 sentences: overall impression, biggest concerns, what works well]

## Coverage

| Dimension | Tested | Total | % |
|-----------|--------|-------|---|
| Routes | 14 | 14 | 100% |
| Interactive elements | 187 | 203 | 92% |
| Threads walked | 4 | 4 | 100% |
| Scenarios completed | 7 | 8 | 88% (Destructive Confidence skipped — no test account) |
| Pages with visual polish sweep | 11 | 14 | 79% (3 modal-only pages folded into parent route reviews) |

**Elements not tested** (and why):
- /app/billing — 16 elements — requires paid plan, not available on test account
- Pagination on /app/clients — insufficient test data

## Findings

### Critical (blocks user task)

- **[Short title]**: [What happened vs expected]
  - *Where*: [page/component]
  - *Screenshot*: [filename]
  - *Thread/scenario*: [which discovered it]
  - *Fix*: [concrete recommendation]

### High (confusion, friction, trust damage)

- **[Short title]**: [description]
  - *Where*: [page/component]
  - *Screenshot*: [filename]
  - *Fix*: [recommendation]

### Medium (suboptimal, workable)

- **[Short title]**: [description]
  - *Fix*: [recommendation]

### Low (polish)

- **[Short title]**: [description]

## Thread Results

### Thread 1: [e.g. "Create a new client and add their first policy"]

- **Completable end-to-end**: Yes / No / Partially — [detail]
- **Click count**: [N] (estimated optimal: [N])
- **Decision points**: [N] — [list the moments]
- **Dead ends**: [N] — [list]
- **Interrupt recovery**: [closed tab at step 3 — state preserved? ✓ / ✗]
- **Did it end clearly?**: [Yes/No — detail]
- **Would I come back?**: [Yes/Maybe/No — why]
- **One thing to make it twice as easy**: [single highest-impact suggestion]
- **Screenshots**: [folder path or numbered list]

### Thread 2: [...]

[repeat]

## Scenario Results

### First Contact
- Time to first value: [clicks/pages]
- Self-explanatory score: [1–5]
- Terminology barriers: [list]
- Threads easy to explain: [list]
- Threads requiring caveats: [list + the caveats]
- Threads unexplainable: [list]
- **2-minute guides written**:
  - *Thread 1*: "[actual guide written during the test]"
  - *Thread 2*: "[...]"

### Interrupted Workflow

| Interruption | Data preserved? | Could resume? | Notes |
|-------------|----------------|---------------|-------|
| Navigate away mid-form | Y/N | Y/N | |
| Close tab + reopen | Y/N | Y/N | |
| Page refresh | Y/N | Y/N | |
| Back button | Y/N | Y/N | |

### Wrong Turn Recovery

| Wrong turn | Recovery method | Steps | Context lost? |
|-----------|----------------|-------|---------------|
| Wrong nav section | [method] | [N] | [what] |
| Wrong record | [method] | [N] | [what] |
| Wrong filter | [method] | [N] | [what] |

### Returning User

| Thread | First time | Second time | Improvement | Shortcuts found |
|--------|-----------|-------------|-------------|-----------------|
| Thread 1 | [N clicks] | [N clicks] | [faster/same/slower] | [list] |

- Awareness score (what changed): [1–5]
- Notification quality: [assessment]
- Missing "what's new" signals: [list]

### Keyboard Only

| Thread | Completable keyboard-only? | Blockers |
|--------|---------------------------|----------|
| Thread 1 | Y/N/Partially | [what stopped you] |

- Focus visibility: [always visible / sometimes / missing]
- Tab order: [logical / jumps around]
- Focus traps: [work correctly / broken on modal X]
- Documented shortcuts: [list or "none"]

### Heavy Data

| Area | At 500 records | At 1000+ |
|------|----------------|----------|
| List load time | [sec] | [sec] |
| Scroll smoothness | Smooth/Janky | |
| Search | Instant/Slow/Broken | |
| Filter | Useful/Overwhelming | |
| Pagination | Works/Slow/Broken | |

### Destructive Confidence

| Action | Confirmation | Destructive styling | Undo | Severity |
|--------|-------------|---------------------|------|----------|
| Delete client | [copy quality] | Y/N | Y/N | |
| Send invoice | [copy] | Y/N | Y/N | |

### Second User ([role tested])

| Thread | Completable as [role] | Broken pages | Leaked data | Error quality |
|--------|----------------------|--------------|-------------|--------------|
| Thread 1 | Y/N | [list] | [list] | [assessment] |

## Network Errors (detected during browsing)

| Endpoint | Status | Page | Severity | Notes |
|----------|--------|------|----------|-------|
| `GET /api/boards/users` | 403 | /app/boards/123 | High | Likely route collision with /:boardId |
| `POST /api/settings/theme` | 403 | /app/settings | High | Permission check failing |
| `GET /api/reports/summary` | 500 | /app/dashboard | Critical | Server error |

## Console Errors

| Error | Page | Severity | Notes |
|-------|------|----------|-------|
| TypeError: Cannot read property 'id' of undefined | /app/clients/123 | High | on edit modal open |

## Responsive / Dark Mode

| Route | 1280 | 1024 | 768 | 375 | Dark (1440) | Dark (375) | Notes |
|-------|------|------|-----|-----|------------|-----------|-------|
| / | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ (text invisible) | |
| /app/clients | ✓ | ✓ | ✗ (overflow) | ✗ | ✓ | ✓ | |

## Visual Polish (AI-tell sweep)

For each page audited, mark which AI-tells were found:

| Route | Optical centring | Nested radius | Off-scale spacing | Vibe greys | Border drift | Shadow direction | Anim timings | Hover delta | Underline / uppercase | Symmetry / pacing |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| / | ✓ | ✓ | ✗ (22px gap) | ✗ (#5a6168 raw) | ✓ | ✓ | ✗ (187ms drop) | ✓ | ✓ | ✓ |
| /app/clients | ✗ (button text 2px high) | ✓ | ✓ | ✗ (3 raw greys) | ✓ | ✓ | ✓ | ✗ (3% delta) | ✓ | ✓ |

**Per-component findings**:

- **Buttons (primary)** — text mathematically centred across all uses; needs ~1px upward optical correction
- **Sidebar dividers** — 2 raw grey values mixed (`#d4d4d8` and `#dfe1e6`); should consolidate to `--border` token
- **Modal shadow direction** — `-2px x-offset` on settings modal disagrees with app-wide `0 x-offset` light source

**Severity tally**:

| Severity | Count | Pattern type |
|----------|-------|-------------|
| High | 2 | Stacked AI-tells on primary CTA component (text + radius + grey + spacing) |
| Medium | 4 | Pattern-level (raw greys app-wide, animation timings off canonical) |
| Low | 7 | Single-instance (one-off underline offset, single off-scale value) |

## What Works Well

Positive findings — patterns to preserve and replicate:

- [e.g. "Empty state on /app/clients has a clear CTA and explanation"]
- [e.g. "Create flow lands on the new record, not back at the list"]
- [e.g. "Keyboard shortcut palette (Cmd+K) works from every page"]

## Priority Recommendations

Ranked by impact:

1. **[Highest-impact fix]** — addresses [Critical finding]. Est. effort: [S/M/L].
2. **[Second priority]** — [...].
3. **[Third]** — [...].

## Fix-and-Verify (if run)

| Finding | Severity | Fix applied | Verified |
|---------|----------|------------|----------|
| Submit button doesn't respond on /signup | Critical | [commit/branch] | ✓ |
| Cascading delete has no warning | High | [commit] | ✓ |
| Pagination resets selection | Medium | — | ⏳ deferred |

**Summary of this session's fixes**: [N critical + M high fixed and verified. K deferred.]
```

## Guidelines

- **Keep findings concrete** — "Submit button doesn't respond on /signup" not "form is broken"
- **Include location** — page + component for every finding, so developers can locate it
- **Include screenshot refs** for every critical/high finding — they make the report actionable
- **"What Works Well" matters** — prevents the report reading as pure criticism, preserves good patterns
- **Priority recommendations** should be actionable in one sprint — not a wish list
- **Coverage arithmetic** goes at the top so readers see the denominator — a report that found 5 bugs across 200 elements reads very differently from 5 bugs across 20 elements
- **Append as you go** — the file is cheaper memory than your context; don't try to remember findings for the end
