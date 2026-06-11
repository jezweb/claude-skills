---
name: codex-review
description: "Run an independent code review using the OpenAI Codex CLI in headless mode. Gets a second opinion from a different model family (the current Codex models) on recent changes, a PR, a commit, or the whole app — covering bugs, regressions, security, data consistency, UX/state bugs, performance risks, and testing gaps. Saves a severity-prioritised report to .jez/reviews/. Triggers: 'codex review', 'review with codex', 'independent code review', 'what does codex think', 'get codex to review'."
compatibility: Designed for Claude Code (or similar products)
---

# Codex Review

Run an independent code review via the OpenAI Codex CLI (`codex review`). The value is a second opinion from a **different model family** than the one that wrote the code — Codex catches things Claude misses due to author bias.

Complements `brains-trust` (generic multi-model opinions). This skill is specialised: git-aware, uses a tuned review prompt, saves structured output.

## When to Use

- After a meaningful change, before committing or shipping
- Before opening a PR, to self-review with an independent reviewer
- When something feels off but you can't articulate what
- Periodic whole-app reviews for projects in active development
- When the user explicitly asks for an "independent" or "second opinion" review

**Do NOT use** for:
- Trivial changes (typos, one-line fixes)
- Research questions or architecture discussions — use `brains-trust` instead
- Auto-fixing issues — this is advisory only

## Preflight

1. Confirm Codex CLI is installed:
   ```bash
   which codex
   ```
   If missing: tell the user to install it (`brew install codex` on macOS, or see https://github.com/openai/codex) and stop. Do not continue.

2. Confirm auth: the first `codex review` call will fail clearly if not logged in. If that happens, instruct the user to run `codex login` and stop.

## Determine scope

Pick the scope flag based on what the user asked for:

| User intent | Flag |
|---|---|
| "codex review" / "review the app" / "full review" / default | no flag (reviews whole app at current HEAD) |
| "review my changes" / "review what I just did" / "review uncommitted" | `--uncommitted` |
| "review this branch vs main" / "review the PR" | `--base main` (or the branch they name) |
| "review commit abc123" | `--commit abc123` |

**Default is whole-app review.** A bare "codex review" with no qualifier means review the entire codebase at HEAD — not just uncommitted changes. Only use `--uncommitted` if the user specifically refers to their recent/uncommitted work.

If ambiguous, ask once. Don't guess on commits or branches.

## Run the review

The canonical review prompt lives in `prompt.md` next to this skill. Pipe it via stdin to avoid shell escaping:

```bash
mkdir -p .jez/reviews
TS=$(date +%Y-%m-%d-%H%M)
OUT=".jez/reviews/codex-${TS}.md"
SKILL_DIR="$(dirname "$0")"  # or use the skill's absolute path

# Example: uncommitted changes
cat "${SKILL_DIR}/prompt.md" | codex review --uncommitted - 2>&1 | tee "$OUT"
```

Other scopes:

```bash
# Vs base branch
cat prompt.md | codex review --base main - 2>&1 | tee "$OUT"

# Specific commit
cat prompt.md | codex review --commit abc123 - 2>&1 | tee "$OUT"

# Current HEAD (no scope flag)
cat prompt.md | codex review - 2>&1 | tee "$OUT"
```

`codex review` can take several minutes on a large diff. Let it run.

## Summarise for the user

After Codex finishes:

1. Print the output path: `Report saved to .jez/reviews/codex-<timestamp>.md`
2. Read the saved report and extract the top findings (anything under **Critical** and **High**)
3. Show them inline in the chat, with file:line references intact
4. Offer to action specific findings: "Want me to fix the SQL injection in `auth.ts:42`?"

## Rules

- **Advisory only.** Never auto-apply Codex's suggestions. Read the findings, discuss with the user, fix with their approval.
- **Don't leak Claude's reasoning into the prompt.** The `prompt.md` file is deliberately neutral — Codex reviews the code, not Claude's narrative about the code. Independence is the whole point.
- **Save to `.jez/reviews/`**, never `.claude/` (protected directory).
- **One report per run.** Don't overwrite — the timestamp makes each run unique so the user can compare.
- **Report what Codex actually found.** Don't soften, editorialise, or skip findings you disagree with. If you think Codex is wrong about something, say so as your own opinion after showing what Codex said.

## Verification

The skill is working if:
- Preflight correctly detects a missing `codex` binary
- The right scope flag is chosen based on user intent
- The report file appears in `.jez/reviews/` with a sensible timestamp
- The file contains severity-prioritised findings with file:line refs
- Claude surfaces the top findings without auto-fixing them
