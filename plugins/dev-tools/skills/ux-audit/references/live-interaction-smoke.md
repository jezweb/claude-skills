# Live Interaction Smoke

Code reading verifies a button exists and has an `onClick`. It does not verify that clicking the button actually **does something observable**. Bugs of this shape — *"the handler runs, fires a call into an SDK, but the flow never completes"* — are invisible to static analysis and require a live click + network check.

## The protocol

For every interactive control on every page audited:

1. **Click it.** Pointer moves, element highlights, click lands.
2. **Watch the Network tab.** Did a request fire? To the right URL? Correct method + body shape?
3. **Watch the DOM.** Did something visibly change — new element, removed element, state transition (loading spinner, toast, route change)?
4. **If nothing changed in (2) or (3), that's a bug.** The control LOOKS alive but isn't doing its job. Log it.

This is a Hard Gate during Phase 3 walkthrough — silent-failure controls produce findings automatically, no severity downgrade.

## Known control categories that silently fail

| Control category | Silent-failure mode | Required check |
|---|---|---|
| **Approve / Deny buttons on tool-call cards** | Handler fires but server never hears about it (SDK needs a separate "send on state change" callback). See `rules/ai-sdk-tool-approval-autosubmit.md`. | Network: POST to approval endpoint with the decision payload. |
| **"Connect X" OAuth buttons inside dialogs** | `window.open()` silently popup-blocked when click originates in a modal. Must use `window.location.href`. See `rules/oauth-popup-blocked-in-dialogs.md`. | Verify navigation actually starts (URL bar changes or new tab opens). |
| **Save / Update buttons on forms with async validation** | Button disables during mutation but the mutation itself silently 5xx'd. No toast, no error state, form just sits there. | Network: capture response. DOM: success or error toast within 5s. |
| **Delete / Archive actions** | Optimistic UI removes the row but server rejected — after refresh, the row is back. | Refresh page, verify item still gone. |
| **Pagination / "Load more" buttons** | Fires request but response empty due to off-by-one offset. | Verify item count actually grows. |
| **Filter chips on list views** | Query param updates but query key doesn't — TanStack Query / SWR serves stale cached results. | Verify list contents change after filter applied. |
| **"Reply" / "Forward" in email-style UIs** | Opens compose pane but Message-ID headers not set — reply threads orphan in recipient's inbox. | Inspect outgoing payload for thread headers. |
| **Search box** | Updates URL but no debounced fetch fires. | Type query, verify network request sent within 500ms. |
| **File upload** | Drop zone accepts file but upload silently fails on size / type / auth. | Capture upload network call, verify 2xx. |
| **Mention / autocomplete pickers** | Selection inserts the value twice (once from typing, once from picker click). | After picking, count mention-pills in input — should be 1. |
| **Send / Submit on chat-style inputs** | Server accepts but client doesn't clear the input. | After submit, verify input value === ''. |
| **Theme switcher / dark mode toggle** | Updates state but doesn't persist; reload reverts. | Toggle, refresh, verify state survived. |
| **Notification dismiss** | Hides locally but server doesn't mark as read. | Refresh, verify notification stays dismissed. |
| **"Try again" / Retry on error states** | Re-fires but with same stale params (the error params, not fresh). | Capture retry call payload. |
| **Cross-page mutation (A→B mutates, return to A)** | Mutation on B invalidates only B's query key; A's parent query is stale on return. Looks like data loss to the user — they retry or give up. See `references/round-trip-workflows.md`. | Walk the round-trip; verify A reflects new state without reload. |
| **Header badge / unread count after action elsewhere** | Bell-pip / pending-tab-count consumed by `['notifications']` etc., but the action that should decrement only invalidates its local list. | After every list mutation, verify the relevant header badge updates. |

## SDK contract checks

When the page uses a third-party SDK with its own state model, verify the SDK's required options are passed. Silent failures usually trace to an undocumented-but-required option.

| SDK | Option that silently breaks behaviour if missing |
|---|---|
| `@ai-sdk/react` useChat with `needsApproval: true` tools | `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` |
| `@ai-sdk/react` useChat with custom transport | `prepareSendMessagesRequest` reading latest refs (otherwise pinned to initial values) |
| better-auth `createAuthClient` | `sessionOptions.refetchOnWindowFocus: false` for SPAs that route on session state |
| TanStack Query `QueryClient` | `refetchOnWindowFocus: false` if your app redirects on empty query results |
| TanStack Query `useQuery` | `queryKey` includes ALL filter params (otherwise stale results) |
| TanStack Query `useMutation` | `onSuccess` / `onSettled` invalidates EVERY query key that consumes the mutated data (parent lists, header badges, related views — not just the local list). The most common silent failure across pages. |
| React Router v7 `createBrowserRouter` | `loader` / `action` defined for routes that need data (not just component) |
| Radix Dialog | `modal: true` + `onEscapeKeyDown` handler if Escape should do more than close |
| Radix Select | `value` prop wired to controlled state (uncontrolled + controlled mix breaks) |
| zodResolver | `as any` around schema if using Zod v4 and resolver is older — silent validation miss |
| Stripe Elements | `mode: 'payment'` (or `'setup'` / `'subscription'`) — wrong mode silently mints wrong intents |
| `react-hook-form` | `mode: 'onBlur'` for blur-validation; default `'onSubmit'` won't show inline errors |

**If the page uses an SDK not on this list**, spend 2 minutes reading its `useX` export's options. Anything named `*On*Change`, `*On*Finish`, `*SendAutomatically*`, `*RefetchOn*`, or `*Configure*` is a prime suspect for "silent failure because it's undefined."

## Optimistic-UI rollback verification (mandatory for list mutations)

The catalogue above mentions "Optimistic UI commits, server rejects, no rollback" as a Critical severity. The protocol below forces the failure scenario so the audit actually exercises the rollback path — not just the happy path.

For every mutation that uses optimistic UI (TanStack Query `onMutate` setQueryData / setState in a handler / etc), force a server failure and verify the rollback:

```
1. Identify the optimistic mutation (look for setQueryData in onMutate, or
   immediate state updates in click handlers).
2. Block the underlying network request — Playwright route override:
   await page.route('**/api/inbox/*', route =>
     route.fulfill({ status: 500, body: 'Forced 500 for audit' })
   )
3. Trigger the action.
4. Verify:
   - UI updates optimistically (row removed / status changed / value updated)
   - After ~1s, UI rolls back to the pre-mutation state (row reappears /
     status reverts / value restored)
   - Error toast / alert appears
   - The user knows the action failed

If the UI rolls back BUT no error toast: Medium finding (silent failure).
If the UI does NOT roll back: Critical finding (looks succeeded, server says
no — re-loading reveals the lie).
If the UI rolls back AND toast appears: Pass.
```

Apply this check to: bulk-mark-read in inbox, approve/reject in approvals, star/unstar lists, delete actions, drag-and-drop reorder, edit-in-place fields. Anywhere a mutation completes faster than network round-trip.

For the `429 / rate-limit` variant — same pattern, return 429 + retryable error. Verify the UI surfaces "rate limited, try again in N seconds" cleanly.

## Investigation workflow

When a click produces no observable change:

1. Capture network tab — did a request fire? If no → frontend issue. If yes → check status / payload.
2. Capture console — was there an error or warning? Often the SDK logs the missing option here.
3. Inspect the element — is `onClick` actually wired? React DevTools → check props.
4. Read the source for the handler — is it conditional on something?
5. Check for SDK contract — is the page using one of the SDKs above? Check options.

Log the finding with:
- Reproduction steps (click X, observe Y did not happen)
- Network capture (or absence of network call)
- Console output
- Suspected code location
- Suggested fix (typically: SDK option, callback wire-up, or state lift)

## Severity guide

| Symptom | Severity |
|---------|----------|
| Click does nothing AND user has no feedback | Critical |
| Click does network call, server 5xx, no error UI | Critical |
| Optimistic UI commits, server rejects, no rollback | Critical |
| Click does something but logs warning | High (auto via console budget) |
| Click works but no success toast | Medium (feedback gap) |
| Click works but slight delay before feedback | Low (polish) |

The Hard Gate stays: any console error or warning during a click handler = High minimum.

## Coverage publication

Publish at the end of Phase 3:

```
LIVE INTERACTION SMOKE COVERAGE
  Controls tested: 47 of 47 inventoried
  Silent failures found: 2 (both High — see findings H-3, H-4)
  SDK contracts verified: @ai-sdk/react ✓, better-auth ✓, TanStack Query ✓
```
