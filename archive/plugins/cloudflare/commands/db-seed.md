---
description: Generate database seed scripts with realistic data
argument-hint: "[small|medium|large] [dev|demo|test]"
---

Load the `db-seed` skill.

Parse $ARGUMENTS for:
- **Volume**: `small` (5-10 rows), `medium` (20-50), `large` (100+). Default: small
- **Purpose**: `dev`, `demo`, or `test`. Default: dev

Examples: `/db-seed large demo`, `/db-seed`, `/db-seed test`
