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

## SDK contract checks

When the page uses a third-party SDK with its own state model, verify the SDK's required options are passed. Silent failures usually trace to an undocumented-but-required option.

| SDK | Option that silently breaks behaviour if missing |
|---|---|
| `@ai-sdk/react` useChat with `needsApproval: true` tools | `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` |
| `@ai-sdk/react` useChat with custom transport | `prepareSendMessagesRequest` reading latest refs (otherwise pinned to initial values) |
| better-auth `createAuthClient` | `sessionOptions.refetchOnWindowFocus: false` for SPAs that route on session state |
| TanStack Query `QueryClient` | `refetchOnWindowFocus: false` if your app redirects on empty query results |
| TanStack Query `useQuery` | `queryKey` includes ALL filter params (otherwise stale results) |
| React Router v7 `createBrowserRouter` | `loader` / `action` defined for routes that need data (not just component) |
| Radix Dialog | `modal: true` + `onEscapeKeyDown` handler if Escape should do more than close |
| Radix Select | `value` prop wired to controlled state (uncontrolled + controlled mix breaks) |
| zodResolver | `as any` around schema if using Zod v4 and resolver is older — silent validation miss |
| Stripe Elements | `mode: 'payment'` (or `'setup'` / `'subscription'`) — wrong mode silently mints wrong intents |
| `react-hook-form` | `mode: 'onBlur'` for blur-validation; default `'onSubmit'` won't show inline errors |

**If the page uses an SDK not on this list**, spend 2 minutes reading its `useX` export's options. Anything named `*On*Change`, `*On*Finish`, `*SendAutomatically*`, `*RefetchOn*`, or `*Configure*` is a prime suspect for "silent failure because it's undefined."

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
