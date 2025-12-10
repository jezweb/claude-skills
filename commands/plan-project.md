# Plan Project

Automate initial project planning: gather requirements, generate planning docs, create SESSION.md, and prepare for Phase 1.

---

## Your Task

Follow these steps to take a project from description to ready-to-code state.

### 0. Check for PROJECT_BRIEF.md (Optional)

**If PROJECT_BRIEF.md exists** in project root or planning/ directory:

```bash
ls PROJECT_BRIEF.md planning/PROJECT_BRIEF.md 2>/dev/null
```

**If found:**
- Read PROJECT_BRIEF.md first
- Extract validated scope, tech stack, and constraints
- Use as context for project-planning skill invocation
- Skip redundant questions (tech stack and scope decisions already validated in brief)

**Note**: PROJECT_BRIEF.md is created by the `/explore-idea` command during pre-planning exploration. It contains research findings and validated decisions that streamline the planning process.

**If not found:**
- Continue normally to step 1
- project-planning skill will handle all requirements gathering

### 1. Invoke project-planning Skill

**If project description is vague or incomplete**, ask 1-2 clarifying questions first:
- "What's the core functionality? (e.g., task manager, blog, analytics dashboard)"
- "Any specific tech requirements beyond the default stack?"

**Then invoke the project-planning skill** with the project description:
- The skill will handle all clarifying questions (auth, data model, features, scope)
- The skill will generate appropriate planning docs (IMPLEMENTATION_PHASES.md + others as needed)
- Wait for skill to complete and output planning docs

**Note**: Do NOT ask the same questions the skill will ask. Let the skill handle requirements gathering.

### 2. Verify Planning Docs Exist

Check that these files were created:
- `docs/IMPLEMENTATION_PHASES.md` (required)
- Other docs as generated (DATABASE_SCHEMA.md, API_ENDPOINTS.md, etc.)

Run:
```bash
ls docs/IMPLEMENTATION_PHASES.md
```

**If IMPLEMENTATION_PHASES.md doesn't exist:**
- Output: "❌ Planning failed. IMPLEMENTATION_PHASES.md not found."
- Output: "The project-planning skill should have created this file. Try running the skill manually."
- Stop here

### 3. Create SESSION.md

**Read IMPLEMENTATION_PHASES.md** to extract phases:
```bash
# Extract project name, phase count, and phase details
```

**Create SESSION.md** in project root using this template:

```markdown
# Session State

**Current Phase**: Phase 1
**Current Stage**: Implementation
**Last Checkpoint**: [none yet] ([date])
**Planning Docs**: `docs/IMPLEMENTATION_PHASES.md`[, `docs/DATABASE_SCHEMA.md`][, other docs...]

---

## Phase 1: [Phase Name] 🔄
**Type**: [Type] | **Started**: [date]
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-1`

**Progress**:
- [ ] [First task from IMPLEMENTATION_PHASES.md]
- [ ] [Second task]
- [ ] [Third task]

**Next Action**: [Concrete first action from phase tasks]

**Key Files**:
- [List key files from phase]

**Known Issues**: None

## Phase 2: [Phase Name] ⏸️
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-2`

## Phase 3: [Phase Name] ⏸️
**Spec**: `docs/IMPLEMENTATION_PHASES.md#phase-3`

[... list all remaining phases with ⏸️ status ...]
```

**Verify SESSION.md created:**
```bash
ls SESSION.md
```

### 3.5. Create Session Protocol Rule

**Create `.claude/rules/` directory:**
```bash
mkdir -p .claude/rules
```

**Create `.claude/rules/session-protocol.md`** with project-specific context:

```markdown
# Session Protocol

This project uses SESSION.md for progress tracking across work sessions.

## Key Files

- **SESSION.md** - Current progress, next action, known issues (project root)
- **docs/IMPLEMENTATION_PHASES.md** - Full phase specifications
[- **docs/DATABASE_SCHEMA.md** - Database design] (if exists)
[- **docs/API_ENDPOINTS.md** - API reference] (if exists)

## Status Icons

- ⏸️ = Not started (pending)
- 🔄 = In progress
- ✅ = Complete
- 🚫 = Blocked

## Stages Within a Phase

1. **Implementation** - Writing code for tasks
2. **Verification** - Testing against phase criteria
3. **Debugging** - Fixing issues found

## When Reading SESSION.md

1. Check "Current Phase" and "Current Stage"
2. Review "Progress" checklist for completed/pending tasks
3. Read "Next Action" for specific task (file + line + action)
4. Note any "Known Issues"

## When Updating SESSION.md

1. Mark completed tasks with `[x]`
2. Update "Current Stage" if changed
3. Set concrete "Next Action": file path + line number + specific task
4. Document any new issues in "Known Issues"
5. If phase complete: Change 🔄 to ✅, collapse to summary

## Next Action Format

Always be concrete:

<!-- ❌ Vague -->
**Next Action**: Continue working on API

<!-- ✅ Concrete -->
**Next Action**: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47, add ownership validation

## Git Checkpoints

After significant progress or before clearing context:

checkpoint: Phase [N] [Status] - [Brief Description]

Phase: [N] - [Phase Name]
Status: [Complete/In Progress/Paused]
Session: [What was accomplished]

Files Changed:
- path/to/file.ts (what changed)

Next: [Concrete next action]

## Session Workflow

**Ending session**: Update SESSION.md → git checkpoint → note Next Action

**Resuming**: Read SESSION.md → check Next Action → continue from that point
```

**Customize for this project:**
- List only the planning docs that were actually created
- This rule will be committed with the project and work across all environments (local, Claude Code online, team members)

### 4. Create Initial Git Commit (If Not Already Committed)

**Check if planning docs are committed:**
```bash
git status --short docs/ SESSION.md .claude/rules/
```

**If uncommitted planning docs exist:**

Stage all planning docs and rules:
```bash
git add docs/ SESSION.md .claude/rules/
```

Check if this is initial commit:
```bash
git log --oneline | wc -l
```

**Create structured commit:**

Extract from IMPLEMENTATION_PHASES.md:
- Total number of phases
- Estimated total hours
- Phase names

**If this is first commit** (count = 0):
```bash
git commit -m "$(cat <<'EOF'
Initial project planning

Generated planning documentation:
- IMPLEMENTATION_PHASES.md ([N] phases, ~[X] hours)
[- DATABASE_SCHEMA.md]
[- API_ENDPOINTS.md]
[- ARCHITECTURE.md]
[- other docs...]
- SESSION.md (session tracking)
- .claude/rules/session-protocol.md (session rules)

Next: Start Phase 1 - [Phase 1 Name]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**If not first commit**:
```bash
git commit -m "$(cat <<'EOF'
Add project planning documentation

Generated planning docs:
- IMPLEMENTATION_PHASES.md ([N] phases, ~[X] hours)
[- DATABASE_SCHEMA.md]
[- API_ENDPOINTS.md]
[- other docs...]
- SESSION.md (session tracking)
- .claude/rules/session-protocol.md (session rules)

Next: Start Phase 1 - [Phase 1 Name]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**If no changes to commit:**
- Output: "ℹ️ Planning docs already committed."
- Skip to step 5

### 5. Output Planning Summary

Display a formatted summary of what was created:

```
═══════════════════════════════════════════════
   PROJECT PLANNING COMPLETE
═══════════════════════════════════════════════

📋 Project: [Project Name from IMPLEMENTATION_PHASES.md]
📦 Stack: [Frontend + Backend + Database from docs]
⏱️  Estimated: [Total hours] (~[human minutes] human time)

───────────────────────────────────────────────
PLANNING DOCS CREATED:
───────────────────────────────────────────────

✅ IMPLEMENTATION_PHASES.md ([N] phases)
✅ SESSION.md (progress tracker)
✅ .claude/rules/session-protocol.md (session rules)
[✅ DATABASE_SCHEMA.md] (if created)
[✅ API_ENDPOINTS.md] (if created)
[✅ ARCHITECTURE.md] (if created)
[... other docs if created ...]

───────────────────────────────────────────────
PHASES OVERVIEW:
───────────────────────────────────────────────

Phase 1: [Name] ([Type], [X] hours) 🔄 ← CURRENT
Phase 2: [Name] ([Type], [X] hours) ⏸️
Phase 3: [Name] ([Type], [X] hours) ⏸️
[... list all phases with emoji status ...]

───────────────────────────────────────────────
NEXT ACTION (Phase 1):
───────────────────────────────────────────────

[Concrete next action from SESSION.md]
File: [file path if applicable]
Task: [specific action to take]

───────────────────────────────────────────────
KEY FILES TO KNOW:
───────────────────────────────────────────────

• SESSION.md - Track progress, current state
• docs/IMPLEMENTATION_PHASES.md - Full phase details
[• docs/[other docs]] (if applicable)

═══════════════════════════════════════════════
```

### 6. Ask Permission to Start Phase 1

Ask user:
```
Ready to start Phase 1: [Phase Name]?

Options:
1. Yes - proceed with Phase 1 Next Action
2. Review first - I want to review planning docs
3. Adjust - I want to refine some phases

Your choice (1/2/3):
```

**If choice 1 (Yes):**
- Output: "Starting Phase 1: [Phase Name]"
- Read Next Action from SESSION.md
- Begin executing the Next Action
- Use appropriate tools (Write, Edit, Bash, etc.)

**If choice 2 (Review first):**
- Output: "Planning docs are in docs/ directory. Review and let me know when ready to start."
- Wait for user instructions

**If choice 3 (Adjust):**
- Output: "What would you like to adjust?"
- Wait for user feedback
- Offer to regenerate planning docs or manually edit

### 7. Optional: Push to Remote

After user starts Phase 1 or reviews docs, ask:
```
Push planning docs to remote? (y/n)
```

**If yes:**
```bash
git push
```

**If push succeeds:**
- Output: "✅ Planning docs pushed to remote"

**If push fails:**
- Output: "❌ Push failed. Run `git push` manually when ready."

---

## Error Handling

**project-planning skill invocation fails:**
- Output: "❌ Failed to invoke project-planning skill"
- Output: "Try running: Use the project-planning skill to plan this project"
- Stop

**IMPLEMENTATION_PHASES.md not created:**
- Output: "❌ Planning docs not found"
- Suggest: "project-planning skill should have created them. Check for errors."
- Stop

**SESSION.md creation fails:**
- Output: "⚠️ SESSION.md creation failed: [error]"
- Output: "You can create it manually or try again."
- Stop

**Git commit fails:**
- Output: "⚠️ Git commit failed: [error message]"
- Output: "Fix git issue and commit manually, or continue without commit."
- Ask: "Continue without commit? (y/n)"

**Git push fails:**
- Output: "⚠️ Push failed: [error message]"
- Output: "You can run `git push` manually later."
- Continue (not critical)

**No git repository:**
- Output: "⚠️ Not a git repository. Initialize with `git init`? (y/n)"
- If yes: Run `git init && git add . && git commit -m "Initial commit"`
- If no: Continue without git

**Project description too vague:**
- Output: "❌ Project description unclear"
- Ask 1-2 clarifying questions before invoking skill:
  - "What's the core functionality?"
  - "Any specific tech requirements?"

**IMPLEMENTATION_PHASES.md exists but empty:**
- Output: "❌ IMPLEMENTATION_PHASES.md is empty"
- Suggest: "project-planning skill may have failed. Check output for errors."
- Stop

---

## Success Criteria

✅ project-planning skill invoked successfully
✅ IMPLEMENTATION_PHASES.md created with validated phases
✅ SESSION.md created with Phase 1 as current
✅ .claude/rules/session-protocol.md created (portable session rules)
✅ Planning docs committed to git (if git repo exists)
✅ User has clear "Next Action" to start Phase 1
✅ User knows where to find all planning docs
