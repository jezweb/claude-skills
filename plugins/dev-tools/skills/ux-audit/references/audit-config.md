# Audit Config — Allowlist for known noise

Some apps have known-noisy console / network categories that aren't bugs:

- Sentry info logs in dev (`[Sentry] DSN not configured`)
- Third-party CDN deprecation chatter the team can't fix
- Expected 401s on auth-check probes (e.g. `GET /api/auth/get-session 401` on first page load)
- Browser-extension chatter from Lighthouse / React DevTools / Vue DevTools
- Service-worker registration warnings in dev mode

Without an escape hatch the audit drowns the report in non-findings, and the agent ends up downgrading legitimate hard gates because "this looks like the usual noise". v2's allowlist is the principled escape hatch: opt-in per project, transparent in the verdict, easy to audit.

## File location

The audit reads the first match in this order, before Phase 3 starts:

1. `.jez/audit-config.yml`
2. `.jez/audit-config.json`
3. `audit-config.yml` (project root, only if `.jez/` doesn't exist)

If no file is found, default behaviour applies: every console error / warning is a finding, every 4xx on an auth page is a finding. The allowlist is opt-in per project, not a global escape hatch.

## File format

```yaml
# .jez/audit-config.yml
console_allow:
  - "[Sentry] DSN not configured"      # dev-only info log
  - "Lighthouse Tools is loaded"       # browser extension chatter
  - "/^Download the React DevTools/"   # leading + trailing slash = regex
  - "[HMR] Waiting for update signal"  # vite dev-mode noise

network_allow:
  - "GET https://o*.ingest.sentry.io"  # Sentry probe — 401 expected when DSN missing
  - "GET /api/auth/get-session 401"    # unauth-on-load probe pattern
  - "/^GET .*\\.hot-update\\.json/"    # vite HMR check requests

# Optional — affordable noise floors per surface
surface_overrides:
  - surface: "/dashboard/admin"
    console_warnings_allowed: 0
    note: "Admin pages must stay clean — no exceptions"
  - surface: "/dashboard/dev-playground"
    console_warnings_allowed: 5
    note: "Dev-only sandbox, intentionally chatty"
```

JSON equivalent (same keys, same semantics):

```json
{
  "console_allow": [
    "[Sentry] DSN not configured",
    "/^Download the React DevTools/"
  ],
  "network_allow": [
    "GET /api/auth/get-session 401"
  ]
}
```

## Allowlist semantics

| Pattern syntax | Match type | Example |
|---|---|---|
| `"plain string"` | Substring match against the message / URL | `"VoiceClient: protocol mismatch"` matches anywhere in the message |
| `"/regex/"` | Full regex match (delimiter slashes required) | `"/^\\[Sentry\\]/"` matches messages starting with `[Sentry]` |
| `"GET /path 403"` for network | Method + URL substring + status | Matches a `GET` to any URL containing `/path` returning `403` |

Allowlisted entries are still recorded in the Interaction Manifest (transparency) but suppressed from the findings count.

## Verdict block transparency

The Verdict block in the report ALWAYS shows raw counts AND allowlisted counts so the reader can audit the audit:

```
Hard Gates:
  Console errors:        3   RED ✗   (1 allowlisted, 2 reportable)
  Console warnings:      8   GREEN ✓ (8 allowlisted, 0 reportable)
  Network 5xx:           0   GREEN ✓
  Network 403/404 auth:  4   GREEN ✓ (4 allowlisted, 0 reportable)
  Layout collapse:       0   GREEN ✓
```

If the reader thinks an allowlisted entry shouldn't be allowed, they can review `.jez/audit-config.yml` and contest the entry — every entry should have a one-line comment explaining *why* it's allowed.

## When to add an allowlist entry

Three legitimate reasons:

1. **Truly out of the team's control** — third-party CDN, browser extension, dev-only build artifact
2. **Deliberate dev-only behaviour** — Sentry probe in dev mode, HMR signal, debug log behind a flag
3. **Documented expected pattern** — auth probe that's expected to 401 on first load before sign-in

NOT legitimate reasons:

- "It's been like this for ages" → fix it or escalate
- "It only happens in this rare case" → investigate the rare case first
- "Tests are flaky" → fix the test or remove the warning, don't allowlist
- "We don't know what's causing it" → don't allowlist unknown noise; investigate

When you find yourself wanting to allowlist something for the first time on a project, add it to the file with a one-line comment explaining *why* it's allowed. Future audits should be able to re-justify each entry.

## Audit-the-allowlist (quarterly)

Every 4-6 weeks, re-evaluate the allowlist:

1. For each entry, ask: is the upstream cause still present?
2. If the upstream cause is fixed, remove the entry — that's a regression gate now active again
3. If the entry has expanded scope ("we added a few more variants"), tighten it back down
4. Audit the comments — are they still accurate?

Stale allowlists hide real bugs. The discipline mirrors how teams manage `.eslintignore` or `// eslint-disable` comments — every line should have a reason and a periodic review.

## Surface overrides (advanced)

Some apps have surfaces with materially different noise profiles. Examples:

- An admin dashboard that *must* stay perfectly clean
- A dev playground / sandbox surface where warnings are expected
- A demo / showcase area that runs a noisy third-party widget

The `surface_overrides` block lets you tune noise floors per route pattern:

```yaml
surface_overrides:
  - surface: "/dashboard/admin"
    console_warnings_allowed: 0
  - surface: "/dashboard/dev-playground"
    console_warnings_allowed: 5
  - surface: "/embed/showcase"
    console_warnings_allowed: 3
    note: "third-party demo widget — see issue #123"
```

When the audit visits a surface that matches `surface_overrides[].surface`, it uses the override threshold instead of the default `0`. The verdict block notes which override applied.

Surface overrides are stricter than allowlists — they allow N noise items without naming them. Use sparingly, prefer named allowlists.

## Cross-project re-use

If multiple projects in a team share the same noise patterns (Jezweb's better-auth + Sentry stack, for example), maintain a shared `audit-config-base.yml` in `~/Documents/.jez/playbooks/` and have project-local `.jez/audit-config.yml` files extend or override it.

A simple include pattern:

```yaml
# .jez/audit-config.yml
extends: ~/Documents/.jez/playbooks/audit-config-base.yml
console_allow:
  # project-specific additions
  - "[CustomComponent] missing prop X"
```

(The audit reads `extends` paths and merges. Conflicts: project-local wins.)

## Default behaviour without a config file

If no audit-config exists:

- Every console error during walkthrough = Critical finding
- Every console warning during walkthrough = High finding
- Every 5xx = Critical
- Every 403/404 on an authenticated page = High
- Layout collapse at any tested viewport = High

This is the strict default. Add an audit-config only when the strict default is producing too many false positives to act on.
