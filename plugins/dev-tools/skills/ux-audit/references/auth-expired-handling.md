# Auth-expired mid-audit

A long audit (30+ min) can outlast the session expiry. If during the walkthrough a navigation OR an API call returns 401/403 on a route that previously authenticated, the session has dropped.

**Don't try to silently re-auth.** From this point onward, every observation is potentially corrupted (signed-out user sees different surfaces, hits different gates, gets different copy).

## Protocol

1. **Stop** immediately on the first unexpected 401/403 in the manifest.
2. **Capture** the exact step that broke (network log + screenshot) — that itself is evidence for a possible "session expired without warning" finding. Apps that drop session without UI feedback fail Critical: the user has no way to know they're not logged in.
3. **Terminate the audit** with verdict `Incomplete`, cause = `auth expired mid-audit at <step>`.
4. **Note in the Verdict block** how far the audit got: which pages had complete manifest, which were mid-flight.
5. **Recommend next steps**: re-auth in Chrome (or re-run test-auth `/cookies` if headless) and resume from the point of failure with a fresh session.

This is intentional: silently re-authenticating mid-audit hides session-expiry bugs (the very thing the user might want to know about) AND mixes pre-expiry and post-expiry observations into one report.

## Headless test-auth case

If the audit is running headless via test-auth cookies and the cookies expire mid-walkthrough, the same protocol applies:

1. Re-mint cookies via `/api/test-auth/cookies`
2. Restart the audit from scratch (don't stitch two halves together)
3. The pre-expiry partial manifest is preserved as evidence — log "Audit attempt 1 terminated at <step> due to cookie expiry; attempt 2 fresh"

## Detecting expiry

Three signals worth watching for:

| Signal | What it means |
|---|---|
| Sudden 401 on previously-200 endpoint | Session token expired or revoked |
| Sudden redirect to `/signin` mid-flow | Auth middleware kicked in |
| Empty data on a list that had data 5 minutes ago | Possibly session-scoped state cleared |

The first two are unambiguous. The third can be a normal data refresh — check the network log for the underlying call and look for an unauthorized response.

## What constitutes a finding

Auth expiring mid-audit is itself a UX finding if any of these are true:

- **No warning before expiry** (Critical) — the user lost their work because the app didn't say "your session is about to end"
- **Silent redirect to signin** (High) — the user is mid-flow, gets bounced, and may not understand what happened
- **Drafts not preserved across re-auth** (Critical) — typed text, form data, in-progress work all lost
- **Re-auth doesn't return to the same page** (High) — sign back in, end up at /dashboard instead of where you were

These get logged in the audit's findings even though the audit itself terminated `Incomplete`. The mid-audit termination is itself the evidence.

## Prevention recommendations (audit output)

When the audit catches an unexpected expiry, recommend:

1. **Idle warning** — modal at 5 minutes before expiry: "Your session ends in 5 minutes. Stay signed in?"
2. **Refresh-on-activity** — sliding session that extends on user input
3. **Graceful re-auth** — bounce to signin, then back to the original page with form state preserved
4. **Indicator in header** — small "Session: 23 minutes left" text for power users
5. **Better-auth `sessionOptions.refetchOnWindowFocus`** + `cookieCache` enabled to extend on tab focus

## Audit resumption

When restarting after a fresh auth:

- Don't try to "continue" the previous manifest — start a clean one
- Note in the new audit that it's "resumption attempt 2" with a reference to the prior `Incomplete` report
- The prior report stays as evidence; the new report is the official verdict
- Re-walk the surfaces that were already audited — the post-expiry session may be on a different state than the pre-expiry session
