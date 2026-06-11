---
name: ux-compare
description: "Compare UX patterns across multiple reference apps using pattern libraries produced by ux-extract. Reads 2+ pattern-library.md files, walks them category by category, identifies where apps converge (strong signal), where they diverge (genuine design choice), what's unique to one app, and what's absent across the set. Produces an opinionated comparison document with recommendations for a new build. No browser needed — pure markdown analysis. Trigger with 'compare UX patterns', 'how do top apps handle X', 'ux comparison', 'pattern comparison across reference apps'."
compatibility: claude-code-only
---

# UX Compare

Read N pattern libraries produced by `ux-extract` and synthesise a comparison. Answers questions like:

- *"Across claude.ai, Linear, Notion, Vercel, and Superhuman — how are empty states handled?"*
- *"Which apps use keyboard shortcuts, and what's the shared vocabulary?"*
- *"When we build our billing page, should we follow convention or deliberately break it?"*

A single extract is a reference point. Multiple extracts are a design library. A comparison is a *decision aid* — it turns the library into "here's what to do and why".

## When to use

- **Before a build** — comparing 3–5 references for the feature class you're about to build reveals the convention and the tradeoffs
- **During a design review** — "this pattern isn't in any of the 5 references we've extracted — is that deliberate?"
- **For team alignment** — shared reference for a design decision
- **To produce a design brief** — convergent patterns become the baseline; divergent patterns become the discussion

## Inputs

### Available libraries

First, discover what's available. Pattern libraries live at:

- `docs/ux-extracts/<app-name>/pattern-library.md`
- `.jez/artifacts/ux-extracts/<app-name>/pattern-library.md`

List everything you find. Show the user the inventory with the extraction date for each so they can spot stale ones:

```
Available pattern libraries:
- claude.ai      (extracted 2026-03-12)
- linear.app     (extracted 2026-02-28)
- notion.so      (extracted 2026-01-15) ← 3 months old
- superhuman     (extracted 2026-03-20)
```

If only one library exists, stop and suggest running `ux-extract` on more apps first. A one-library "comparison" is just the library.

### Scope / focus

Ask the user what to compare — or infer from their request:

- **Whole library** — compare every category across every library (verbose but comprehensive)
- **One category** — just empty states, just keyboard, just modals (tighter, more useful for specific decisions)
- **A feature area** — "how do these apps handle settings", crosses multiple categories but stays focused
- **A specific question** — "which apps support offline?" — searches Notable Absences sections too

Narrower scope produces sharper recommendations. Default to asking: *"What feature or pattern do you want to compare?"*

### Libraries to include

By default, include every library the user mentions or all of them if they don't specify. Let them exclude: *"all except notion — their library is too stale"*.

## Comparison Process

### 1. Read every library

For each library in scope, read the full `pattern-library.md`. Note:
- Extraction date
- Scope of the extract (whole app vs partial)
- Any **Notable Absences** section — often the most interesting data for comparison

### 2. Walk category by category

For the scope requested, walk each pattern category that appears in any library. For each category:

1. **List what each app does** — one bullet per app, concrete and verbatim where possible
2. **Identify convergence** — what's the same across most or all? This is the low-risk default.
3. **Identify divergence** — where do they genuinely differ? This is a design decision.
4. **Flag unique approaches** — only one app does X. Either innovation or weirdness; call it out either way.
5. **Flag coverage gaps** — if an app's library doesn't cover this category, say so (don't silently treat absent-from-library as absent-from-app).

### 3. Cross-reference absences

After walking categories, collect what's absent across the set. If 4 of 5 apps have no undo on destructive actions, that's a pattern. If 3 of 5 apps have no keyboard shortcut for new-record creation, that's a decision someone keeps making.

### 4. Synthesise recommendations

Close with opinionated guidance:
- **Safe default** — the convergent pattern. Following it means users feel at home.
- **Deliberate choices** — the divergent patterns, with the tradeoff of each so the user can pick.
- **Avoid** — unique-to-one patterns unless there's a clear reason why that one app does it differently.
- **Gaps worth filling** — absences that are surprising, or that your users would benefit from seeing addressed.

The recommendations section is the reason to run the comparison. Without it, the doc is a pile of bullets. With it, it's a decision.

## Output

Write to `docs/ux-comparisons/<topic>-YYYY-MM-DD.md` (or `.jez/artifacts/ux-comparisons/<topic>-YYYY-MM-DD.md` if that path exists).

Topic slug from the scope — e.g. `empty-states`, `keyboard-shortcuts`, `onboarding`, `destructive-actions`.

See [references/comparison-template.md](references/comparison-template.md) for the full output shape.

Short version:

```
# UX Comparison: Empty States

Compared: claude.ai, linear.app, notion.so, superhuman
Date: 2026-04-19
Scope: How these apps handle empty states across list views, onboarding, and zero-data dashboards.

## At a glance

[2-3 sentences: what converges, what diverges, what's missing across the set]

## Pattern-by-pattern

### Empty list state

- **claude.ai**: illustration + headline + description + primary CTA + 3 shortcut hints
- **linear**: headline only, small text, no CTA
- **notion**: template picker (unique — offers 12 templates)
- **superhuman**: empty state not reached in extract (all-data demo account)

Convergence: most show some form of guidance; none are fully blank.
Divergence: claude.ai guides toward keyboard workflow; notion guides toward templates.
Unique: notion's template-first empty state.
Coverage gap: superhuman not assessed.

### Empty search results
[...]

## Recommendations

- **Safe default**: illustration + one-line description + primary CTA. All convergent apps do this.
- **Consider**: shortcut hints (like claude.ai) if your power-user persona is strong. Tradeoff: adds visual noise that doesn't help first-time users.
- **Skip**: notion's template picker unless you have a templates feature.
- **Fill a gap**: none of the 4 apps explain *why* the list is empty. A one-liner ("No clients yet — add your first to get started") is convergent practice and worth preserving.

## Source libraries

- claude.ai — 2026-03-12
- linear.app — 2026-02-28
- notion.so — 2026-01-15 (stale, re-extract recommended)
- superhuman — 2026-03-20
```

## Autonomy

- **Just do it**: Discover available libraries, read them, write the comparison document, cite specific screenshots or copy from the source libraries
- **Ask first**: If the user didn't specify scope — one focused question is cheaper than a sprawling comparison
- **Stop and confirm**: If fewer than 2 usable libraries exist — comparing is impossible with 1 library, suggest `ux-extract` first

## Reference files

| When | Read |
|------|------|
| Writing the comparison document | [references/comparison-template.md](references/comparison-template.md) |

## Tips

- **Don't re-list everything from every library.** The comparison is value-add synthesis. If you're just copying bullets from 5 libraries, you're not comparing.
- **Convergence is usually the safest choice**, but not always the most interesting one. Call out where convergence might be copy-paste rather than good design.
- **Cite screenshots from the source libraries** — don't copy them. "See claude.ai pattern library § Empty States, screenshot 502" keeps extracts as the single source of truth.
- **Stale libraries are still useful** — just note the date. A 12-month-old library is a snapshot of that moment, not nothing.
- **Recommendations must be opinionated.** *"It depends"* is the weakest possible output. State a position. The user can disagree.
- **Comparisons age too.** Re-run when underlying extracts get refreshed, or when a new reference enters the set.

## Future: more than 5 apps

Comparisons scale non-linearly. 3 apps is comfortable; 5 is the upper bound of readability; 10 becomes a matrix that's impossible to synthesise in prose. If comparing more than 5 libraries, bucket them:

- Tier 1 (closest to your app) — detailed bullets
- Tier 2 (reference-class) — summary bullets
- Tier 3 (outliers, novel approaches) — mention by exception

Or do several narrower comparisons rather than one mega-comparison.
