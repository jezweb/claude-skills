---
description: Run D1 migration workflow — generate, inspect, apply
argument-hint: "[generate|apply|fix|status]"
---

Load the `d1-migration` skill.

Parse $ARGUMENTS for action:
- `generate` — generate migration from schema changes
- `apply` — apply pending migrations (local + remote)
- `fix` — fix stuck or failed migrations
- `status` — show migration status

Default: `status` if no argument.
