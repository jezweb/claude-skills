---
name: team-update
description: "Post project updates to team chat, gather feedback, triage responses, and plan next steps. Adapts to available tools (chat, git, issues, tasks). First run discovers tools and saves a playbook; subsequent runs execute from the playbook. Trigger with 'team update', 'post update', 'sync with team', 'standup', 'check team chat', 'feedback loop', 'project update', 'what did the team say'."
compatibility: Designed for Claude Code (or similar products)
allowed-tools: "*"
---

# Team Update

Post project updates to team chat, read and triage feedback, and plan next steps. Adapts to whatever communication and project tools are available.

## The Playbook Pattern

This skill uses a **playbook** file at `.claude/team-update-playbook.md` in the project root.

- **First run**: Discover available tools, ask the user for preferences, execute, save a playbook
- **Subsequent runs**: Read the playbook, skip discovery, execute directly
- **User edits playbook**: Changes take effect immediately (channel, style, triage rules)

The playbook is plain markdown the user can edit. It captures tool configuration, channel preferences, message style, triage rules, and last-run metadata.

---

## Phase 0: Playbook Check

Check if `.claude/team-update-playbook.md` exists in the project root.

**If it exists**: Read it. All tool configuration, channel info, message style, and triage rules are in there. Jump to Phase 1 with known config.

**If it does not exist**: Run Phase 0b (Discovery) first.

---

## Phase 0b: Discovery (First Run Only)

Detect available capabilities by checking what MCP tools are connected and what local tools exist.

Read [references/discovery-patterns.md](references/discovery-patterns.md) for detection patterns.

### Capability Detection

Check for each capability category:

| Capability | How to detect | Fallback if missing |
|---|---|---|
| **Chat** | MCP tools matching `chat`, `slack`, `discord`, `teams` | Output formatted text for manual posting |
| **Git** | `git rev-parse --is-inside-work-tree` | Skip commit summaries |
| **Issues** | MCP tools matching `github`, `linear`, `jira` | Skip or output text list |
| **Tasks** | MCP tools matching `tasks`, `todos`, `asana` | Skip or output text list |
| **Knowledge** | Basalt Cortex (`~/Documents/basalt-cortex/`) | Search for related knowledge notes |

### User Preferences (Ask)

After discovery, ask the user to confirm:

1. **Channel**: Which chat space/channel to post updates to? (List discovered options)
2. **Identity**: Post as yourself or a bot identity? (e.g. Anthro Morphic)
3. **Repo scope**: Which repo(s) to track? (Default: current repo)
4. **Message style**: Brief standup, detailed changelog, or conversational update?
5. **Team context**: Any team members to be aware of? (Names, roles)
6. **Triage rules**: Any custom rules for handling feedback? (Or use defaults)

### Save Playbook

After discovery + user preferences, save the playbook to `.claude/team-update-playbook.md`.

Read [references/playbook-format.md](references/playbook-format.md) for the full template. Fill in all sections with discovered tools and user preferences. If a capability was not found, note it as "Not available" in the playbook.

Ensure `.claude/` is in `.gitignore` (the playbook contains space IDs and preferences that shouldn't be committed).

---

## Phase 1: Gather Context

Collect information from all available sources. Use the playbook's "Data Sources" section to know which tools to call.

### 1a. Determine Time Window

Check the playbook's "Last Run" section for the last update timestamp. If no previous run, ask the user how far back to go (default: 24 hours).

### 1b. Collect Data

Gather from each available source:

| Source | What to collect | Tool |
|---|---|---|
| **Git commits** | `git log --oneline --since=<last-update>` | Bash |
| **Chat messages** | Messages in the configured channel since last update | Chat MCP tool from playbook |
| **Open issues/PRs** | Recently updated or newly created items | Issue tracker from playbook |
| **Active tasks** | In-progress or recently completed tasks | Task tracker from playbook |

### 1c. Summarise for Drafting

Group commits by theme (not individual hashes). Note any issues closed, PRs merged, or tasks completed. Flag any team messages that need response.

---

## Phase 2: Draft and Post Update

### 2a. Compose Message

Read [references/message-composition.md](references/message-composition.md) for message patterns.

Follow the playbook's "Message Style" section. General principles:

- Lead with what shipped or changed, not process
- Group related commits into themes
- Mention specific people only when relevant
- Keep it scannable (short paragraphs, bullet points)
- **Write like a teammate, not an AI** — no emoji spam, no hedging, no over-explaining context the team already has. See the Communication Style section in [references/message-composition.md](references/message-composition.md).

### 2b. Preview and Approval

Show the draft to the user. Include:
- The composed message
- Which channel it will be posted to
- Whether it's a new message or thread reply

**APPROVAL REQUIRED**: Never post to external channels without explicit user approval.

### 2c. Post

Post the approved message using the chat tool from the playbook. If no chat tool is available, output the formatted message for the user to post manually.

### 2d. Update Playbook

After posting, update the "Last Run" section of the playbook with:
- Current timestamp
- Thread key (if applicable)
- Brief summary of what was posted

---

## Phase 3: Read and Triage Feedback

### 3a. Read Responses

Read messages from the configured channel since the update was posted. Look for:
- Direct replies to the update
- New messages in the channel that reference the project
- Reactions or acknowledgements

### 3b. Classify Feedback

Read [references/feedback-triage.md](references/feedback-triage.md) for classification patterns.

Use the playbook's "Triage Rules" section. Default classification:

| Type | Action |
|---|---|
| Bug report | Create issue (label: bug) |
| Feature request | Create issue (label: enhancement) |
| Question | Draft reply for user approval |
| Blocker | Flag immediately, suggest resolution |
| Acknowledgement | Note, no action needed |
| Off-topic | Ignore |

### 3c. Present and Act

Present a summary of feedback with proposed actions:

```
## Feedback Summary

- Daniel: "Can we add dark mode?" -> Create issue (enhancement)
- Rabin: "Auth is broken on staging" -> Create issue (bug, priority)
- Karen: "Looks good!" -> No action

Proceed with these actions?
```

**APPROVAL REQUIRED**: Never create issues, post replies, or take external actions without explicit user approval.

---

## Phase 4: Plan Next Steps

### 4a. Prioritise

From all gathered context (commits, issues, tasks, feedback), identify:
1. **Blockers**: Things preventing progress
2. **High-priority**: Bugs, urgent requests, deadlines
3. **Next up**: Planned work, feature requests
4. **Backlog**: Nice-to-haves, low-priority items

### 4b. Present (Not Posted)

Show the prioritised list to the user. This is for the user's planning only -- do NOT post it to any channel.

```
## Suggested Priorities

1. [BLOCKER] Fix auth on staging (from Rabin's feedback)
2. [HIGH] Complete API endpoint for user profiles (current sprint)
3. [NEXT] Dark mode support (from Daniel's request)
4. [BACKLOG] Refactor database queries
```

---

## Autonomy Rules

| Action | Level |
|---|---|
| Read/create playbook | Just do it |
| Discover tools (first run) | Just do it, confirm preferences with user |
| Gather context (git, chat, issues) | Just do it |
| Draft update message | Just do it, show preview |
| **Post to external channel** | **Approval required** |
| **Create issues/tasks** | **Approval required** |
| **Post replies to team** | **Approval required** |
| Update playbook "Last Run" | Just do it |
| Present plan/priorities | Just do it |

---

## Graceful Degradation

The skill works at any level of tool availability:

| Available tools | Experience |
|---|---|
| Git only | Summarise commits, output text for manual posting |
| Git + Chat | Full post/read cycle, manual issue creation |
| Git + Chat + Issues | Full cycle with automated issue creation |
| Git + Chat + Issues + Tasks + Knowledge | Full cycle with persistent tracking |

---

## Operating Modes

The skill responds to different trigger phrases:

| Trigger | Behaviour |
|---|---|
| "team update" / "post update" | Full cycle: gather, draft, post, read feedback |
| "check team chat" / "what did the team say" | Phase 3 only: read and triage feedback |
| "standup" / "sync with team" | Phase 1 + 2: gather and post, skip feedback |
| "project update" | Phase 1 + 2 + 4: gather, post, plan (skip feedback triage) |
| "feedback loop" | Phase 3 + 4: read feedback and plan |

---

## Reference Files

| When | Read |
|------|------|
| First run — saving playbook | [references/playbook-format.md](references/playbook-format.md) |
| First run — detecting tools | [references/discovery-patterns.md](references/discovery-patterns.md) |
| Composing update messages | [references/message-composition.md](references/message-composition.md) |
| Classifying team feedback | [references/feedback-triage.md](references/feedback-triage.md) |
