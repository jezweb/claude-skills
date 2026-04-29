---
description: "Walk a live web app AS a real user — interaction-first methodology. Hard gates (console / network / layout-collapse), Persona Lock, Interaction Manifest enforcement, multi-pane stress, visual polish, perfection checklist, 9 scenarios, stress recipes. Verdict: Pass / Conditional Pass / Fail / Incomplete (no manifest = Incomplete)."
argument-hint: "[optional: persona or scope, e.g. 'as a busy broker' or 'the dashboard only']"
allowed-tools: "*"
---

Load the `ux-audit` skill and run the audit.

The audit is interaction-first. It cannot produce a verdict without an Interaction Manifest proving real typing, clicking, sending, observing. A static DOM sweep terminates with verdict `Incomplete`.

Hard gates (cannot be downgraded): console errors / warnings = 0, network 5xx = 0, layout collapse at any tested viewport = 0. A console warning is High *minimum*. A 5xx is Critical *automatically*.

If $ARGUMENTS describes a persona ("as a busy broker", "first-time user"), lock it. If $ARGUMENTS scopes the audit ("the dashboard", "just the settings flow"), scope to that area — still exhaustive within the scope.

URL is auto-detected from wrangler.jsonc or running dev server.

Examples:
- `/ux-audit`
- `/ux-audit as a time-poor client logging in for the first time`
- `/ux-audit the billing flow`
- `/ux-audit as an SME owner — multi-pane stress focus`
