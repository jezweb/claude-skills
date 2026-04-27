---
description: Exhaustively audit a web app — threads, elements, visual polish (AI-tells), 8 scenarios, fix-and-verify loop
argument-hint: "[optional: persona or scope, e.g. 'as a busy broker' or 'the dashboard only']"
allowed-tools: "*"
---

Load the `ux-audit` skill and run the audit.

Single exhaustive mode. If $ARGUMENTS describes a persona ("as a busy broker", "first-time user"), adopt it. If $ARGUMENTS scopes the audit ("the dashboard", "just the settings flow"), scope to that area — still exhaustive within the scope.

URL is auto-detected from wrangler.jsonc or running dev server.

Examples:
- `/ux-audit`
- `/ux-audit as a time-poor client logging in for the first time`
- `/ux-audit the billing flow`
