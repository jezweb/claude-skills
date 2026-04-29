# Persona Lock

The audit cannot start without a locked persona. Without one, every finding drifts toward "looks fine" and the audit produces a verdict that's defensible from no one's perspective.

A locked persona is a single named user, with goals, constraints, pain triggers, and wins. Once locked, every finding must be defensible from this persona's perspective. If a finding only makes sense for a power user when the locked persona is an SME owner, the finding is wrong-persona — log it as a different persona's concern or drop it.

## How to lock the persona

Source the persona in this order:

1. **Argument** — if the user provided one in the trigger ("ux audit as a busy insurance broker"). Use as-is.
2. **Project personas** — read these in order, take the first that matches:
   - `.jez/audit-personas/<slug>.md`
   - `.jez/personas/default.md`
   - `.jez/personas/<app-name>.md`
   - `.jez/personas/<role>.md`
3. **Ask once, then write a file** — *"Who uses this app and what are they trying to get done?"* Capture the answer, write it to `.jez/audit-personas/<slug>.md` for the next audit, then proceed.

Lock the persona by writing the chosen persona at the top of the audit report:

```markdown
**Persona Lock**: SME owner — runs a 4-person fitness studio
**Source**: .jez/audit-personas/sme-owner.md
**Locked at**: 2026-04-29 14:30 AEST
```

## Persona file format

Each persona file at `.jez/audit-personas/<slug>.md`:

```markdown
---
slug: sme-owner
name: SME Owner
locked: 2026-04-29
---

# SME Owner

## Who they are
Owns a 4-person fitness studio. Books clients, takes payments, runs marketing,
all herself. Knows her business cold; isn't a software person.

## Goals (what they want to do)
- Get a class scheduled in under a minute
- See who paid this week without scrolling
- Send a "next class" reminder without crafting a message from scratch

## Constraints
- 30-60s windows between physical tasks
- Phone in pocket, laptop sometimes
- Tolerates 2 clicks max for routine tasks; 3 makes her swear

## Pain triggers (what makes them close the tab)
- Acronyms or jargon (CRM, SaaS, "campaign" instead of "newsletter")
- Forms with > 5 fields
- "Sign up for a free trial" gates between her and the thing she's doing
- Loading spinners that last > 1.5s with no indication of what's happening
- Anything that asks her to learn a concept ("workspaces", "instances", "agents")

## Wins (what makes them come back)
- The thing she just did is visibly there at the top of the screen
- A teammate gets a notification she didn't have to opt into
- She gets through a routine task in fewer steps than last time
- One-tap sharing of receipts / schedules / class lists

## How to audit AS this persona
- Skim every screen for 2 seconds before reading anything carefully
- Read every label out loud: would she say this word in conversation?
- For every form: would she fill it correctly on her first try?
- For every list: can she find one specific record by name in < 5 seconds?
- For every button: does the verb match what she's about to do?
```

## Persona library examples

Common patterns the audit should adopt depending on the product:

### SME owner
Time-pressed, low tech comfort, mobile-first, hates jargon. Wants tasks completed in 1-2 clicks. Triggers at acronyms.

### Power user
Knows the product cold, lives in keyboard shortcuts, wants density. Will use Advanced settings. Triggers at hand-holding tooltips.

### First-time developer
Read the docs. Trying to wire up an integration. Tolerates jargon if it's accurate, hates jargon that's wrong. Will look at the network tab. Triggers at silent failures.

### Casual user (consumer-app)
Came via a marketing link. No commitment yet. Will close the tab if anything is unclear. Triggers at sign-up gates before value, at long forms, at "select a plan" before "show me what this does".

### Internal staff (B2B tools)
Onboarded by a colleague, trained verbally. Knows the workflow, doesn't know the product. Triggers at UI changes that contradict what they were taught.

### Client (read-only / restricted role)
Was given access by a staff member. Doesn't know what they have access to or why. Triggers at "you don't have permission" without explanation.

## Always-also: first-time-user lens

In addition to the locked persona, every multi-page feature must also pass the **first-time-user lens** (mandatory, see SKILL.md Phase 3). This is non-negotiable. Engineers writing screens know what every field means; brand-new users don't. The lens catches that gap regardless of the locked persona.

## Persona drift detection

Mid-audit, watch for these signs of drift:
- Findings that say "a developer would..." (you've drifted to dev persona)
- Findings that say "an admin should..." (drifted to admin if locked persona was SME)
- Justifying density or jargon as "professional" (drifted toward power user)
- Skipping multi-pane stress because "the persona is mobile-only" (drift via skip)

When drift is detected: stop, re-read the persona file, re-walk the affected slice with the locked persona's eyes.

## Multi-persona audits

For apps with materially different user types (B2B SaaS with admin + staff + client), run separate audits per persona. One report per persona file, then a synthesis pass at the end. Don't try to audit "as a generic user" — that produces no findings worth shipping.

## Persona vs role vs lifecycle position

Three orthogonal axes:
- **Persona**: who they are (SME owner, power user, first-time developer)
- **Role**: what they're allowed to do (admin, viewer, billing)
- **Lifecycle position**: when they joined (founder, first invitee, later joiner)

Same persona × different role = different audit (Scenario 8, Second User by Role).
Same persona × different lifecycle = different audit (Scenario 9, Lifecycle Position).
Different persona = different audit, full stop.

The locked persona pins the first axis. Scenarios 8 and 9 stress the other two.
