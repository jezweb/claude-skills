# Audit Output Discipline

**Cross-skill reference.** This file is the shared discipline used by every audit-shaped skill in `dev-tools`: `ux-audit`, `code-review`, `design-review`, `project-health`, `fork-discipline`, `codex-review`. Other audit/review skills should link to this file rather than re-state the rules.

## What this exists to fix

Audit-shaped skills drift toward **rigour-shaped output**: every checklist row marked, every category covered, every page screenshotted. The output looks complete. It usually isn't *useful* — the reader still has to ask "what should I do first?".

This file forces **judgement-shaped output**: the reader gets a ranked decision-ready list, every finding earns its place, and the agent has done the work of comparing alternatives instead of dumping them.

The discipline is five rules. Skills enforce them in their verdict block, findings format, and meta-checks.

---

## Rule 1 — Top 5 by senior-designer judgement (mandatory ranking)

Every audit produces a ranked Top 5 in the verdict block. Strict format:

```
TOP 5 (ranked by impact × ease, senior-designer pick)

1. [F-id] Short title — one-sentence reason. Why it edges out the others.
2. [F-id] Short title — one-sentence reason.
3. [F-id] Short title — one-sentence reason.
4. [F-id] Short title — one-sentence reason.
5. [F-id] Short title — one-sentence reason.
```

Constraints:
- **Exactly five.** Not 4, not 7. The constraint is the value.
- Each entry references a specific finding ID from the body.
- One sentence on *why this finding edges out the alternatives*. Not the finding itself — that's already in the body.
- Order is ranked, not chronological.
- If the audit produced fewer than 5 findings, list what you have and explicitly mark the slots: *"4. (no further finding warrants top-5 placement)."* — don't pad.

Why exactly 5: it forces the agent to argue priority. "Is this finding really top-5" against the alternatives is a different cognitive task than "is this finding worth reporting".

Verdict cannot be Pass without a Top 5 (or explicit acknowledgement of fewer findings).

---

## Rule 2 — Self-critique pass (KEEP / GENERIC / DUPLICATE)

After the findings draft and before publishing the verdict, the agent dispatches a sub-agent with the draft findings list and this prompt:

> *"Read these audit findings. For each, answer: would this finding make sense applied to ANY web app on ANY persona, or is it specific to THIS app on THIS locked persona? Mark each finding KEEP / GENERIC / DUPLICATE. Drop GENERIC and DUPLICATE before publishing."*

A finding is:

- **KEEP** — specific to this app, this persona, this surface. Names a concrete element, action, or behaviour.
- **GENERIC** — would apply to most apps without modification. Reads as boilerplate.
- **DUPLICATE** — same root cause as another finding (or another phase already flagged it).

A fresh sub-agent works because the original drafter is invested in its own output. Self-critique done in-context tends to defend rather than prune.

The sub-agent's verdict per finding is logged in the report:

```
Self-critique pass:
  Drafted: 23 findings
  Kept:    14 (61%)
  Generic: 5 (dropped)
  Duplicate: 4 (merged into kept)
```

Verdict cannot be Pass without a self-critique pass logged.

---

## Rule 3 — Smallest possible patch (no "Suggested fix")

Every finding has a `Smallest possible patch` field, not `Suggested fix`. The rename is the discipline.

**Bad** (suggested fix):
> Suggested fix: Improve the accessibility of this button.
> Suggested fix: Consider adding a confirmation dialog.
> Suggested fix: Make the empty state more helpful.

**Good** (smallest possible patch):
> Smallest possible patch: Add `aria-label="Edit message"` to `src/components/MessageRow.tsx:42`.
> Smallest possible patch: Wrap the existing destroy handler in `<AlertDialog>` from `@radix-ui/react-alert-dialog`.
> Smallest possible patch: Replace the empty `<div>` with `<EmptyState title="No clients yet" cta={<Button>Add client</Button>} />`.

The rename targets the filler patterns: "consider X", "improve X", "make X better". A patch is concrete and committable. If the agent can't write a smallest-possible-patch, the finding may not be actionable enough to ship.

If the smallest patch is genuinely large (refactor, primitive replacement, schema change), say so — but in concrete terms: *"Smallest possible patch: replace the ad-hoc dropdown in `<UserPicker>` with `<Combobox>` from `frontend:shadcn-ui`. Touches 3 files; ~80 lines diff."*

---

## Rule 4 — Proof-required PASS rows (no vibe-PASS)

Every PASS row in a checklist needs:
1. The check name
2. A **one-sentence "why"** with concrete evidence
3. A proof artefact (screenshot path / DOM selector / computed style / network capture / code reference)

**Bad** (vibe PASS):
- [✓] Hover delta perceptible
- [✓] Focus state visible
- [✓] Empty state has CTA

**Good** (sentence-proven PASS):
- [✓] Hover delta perceptible — primary button background shifts from `hsl(220 100% 45%)` to `hsl(220 100% 38%)`, ~7% lightness drop. Eyedropper proof: `evidence/btn-hover.png`.
- [✓] Focus state visible — 2px ring in `--ring` token, contrast vs background = 4.7:1 (WCAG AA). DevTools computed style: `outline: 2px solid hsl(212 96% 56%)`.
- [✓] Empty state has CTA — "/clients" with 0 records shows "No clients yet. Add your first client" + primary button. Screenshot: `evidence/clients-empty.png`.

Vibe PASS rows get rejected by the meta-check. The audit-the-audit pass scans for `[✓]` rows without a proof artefact and flips the verdict to Incomplete.

The rule applies symmetrically to FAIL rows — they need reproduction + evidence + suspected location (already specified in the standard findings format).

---

## Rule 5 — "Hold this in your hands" closing paragraph

Every audit ends with one paragraph, no template, that answers the question:

> *If this app were a physical object, would I want to hold it?*

This is the one place where vibe is the *point*. It captures the holistic judgement that no checklist surfaces — the way the whole product feels in use, beyond any individual finding. It's where senior-designer pattern-recognition lives.

Format:

```
HOLD THIS IN YOUR HANDS

[One paragraph, ~150 words. Plain prose. No bullet points. Persona's voice
allowed if it sharpens the assessment. Says what the app is, what it
nearly is, and what's between the two.]
```

Examples of paragraphs that work:

> "This app is a clipboard with a brain. The Inbox is the right primitive — every other surface earns its place by feeding into it. The dashboard could disappear and I'd lose nothing. The agents page feels like a settings screen for something more interesting than itself; once it has personality (names that aren't class names, model labels that aren't IDs, descriptions in plain English), the whole product comes into focus. Right now I'd recommend it cautiously to a developer friend; in two iterations I'd recommend it to my SME-owner sister."

> "Every screen does its job. Few screens make me happy. The product passes every gate and clears every bar — but there's no moment where I'd describe a feature to a colleague with affection. That's the gap to close. Pick one surface — Inbox, Approvals, or the agent edit panel — and pour love into it: micro-copy, hover deltas, motion that has weight. The rest of the app will look better next to a single surface that's been loved."

Constraints:
- One paragraph. Not two. Not a list.
- Speaks to *use*, not *features*. "What is this like to live with?"
- Avoids both flattery and pile-on. Should feel earned.
- May reference findings but isn't an aggregation of them.

---

## How skills consume this discipline

A skill that adopts this discipline:

1. References this file in its `Reference files` table (not duplicates the rules)
2. Includes Top 5 + Self-critique outcome + Smallest-possible-patch field + Hold-this paragraph in its report template
3. Runs the audit-the-audit meta-check that flips Pass → Incomplete when:
   - Top 5 missing or padded
   - Self-critique pass not logged
   - Findings use "Suggested fix" instead of "Smallest possible patch"
   - PASS rows lack proof artefacts
   - Hold-this paragraph missing or templated

A skill that doesn't adopt the discipline produces breadth-shaped output. That's a legitimate choice for some skills (a discovery / inventory skill, a "what files exist" skill). But for any skill that outputs *findings worth ranking*, the discipline above is the bar.

---

## Anti-patterns this discipline rules out

- **Template completism**: every section filled, every checkbox covered, no judgement applied
- **Filler fixes**: "consider X", "improve Y", "make Z better"
- **Generic findings**: "the app could use better empty states" without naming a specific empty state
- **Duplicate findings**: the same root cause logged on each surface it affects (should be one finding with a list of affected surfaces)
- **Vibe PASS**: "[✓] Looks fine" without proof
- **Findings list with no priority**: 30 things wrong, no decision-ready Top 5
- **Holistic-judgement skip**: audit ends at the last finding with no overall assessment

---

## Project-side adoption

Projects that consume audit skills can encourage the discipline by:

1. Adding to `CLAUDE.md`: *"Audit reports must include Top 5 + Hold-this paragraph. Reports without these are incomplete."*
2. Adding to PR templates: *"If this PR includes an audit, paste the Top 5 here."*
3. Tracking Top 5 outcomes over time — does the same finding keep landing in Top 5? That's a regression class worth a Playwright test (see [playwright-killer-flows.md](playwright-killer-flows.md)).

The discipline is most useful when the project treats the Top 5 as a forcing function, not an aspirational frame.

---

## Cross-skill consistency

Skills that reference this file produce comparable output. A `code-review` Top 5 and a `ux-audit` Top 5 read in the same shape; a project lead can scan both and prioritise across them. That coherence is the second-order benefit — once the discipline is shared, audits and reviews become composable.

When updating this file, post a note in any skill that references it. The cross-skill effect is real: a tightening here propagates to every audit family member.
