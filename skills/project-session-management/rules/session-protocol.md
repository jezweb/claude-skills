# Session Protocol

This project uses SESSION.md for progress tracking across work sessions.

## Key Files

- **SESSION.md** - Current progress, next action, known issues (project root)
- **docs/IMPLEMENTATION_PHASES.md** - Full phase specifications
<!-- CUSTOMIZE: Add other planning docs as needed -->

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

```markdown
<!-- ❌ Vague -->
**Next Action**: Continue working on API

<!-- ✅ Concrete -->
**Next Action**: Implement PATCH /api/tasks/:id in src/routes/tasks.ts:47, add ownership validation
```

## Git Checkpoints

After significant progress or before clearing context:

```
checkpoint: Phase [N] [Status] - [Brief Description]

Phase: [N] - [Phase Name]
Status: [Complete/In Progress/Paused]
Session: [What was accomplished]

Files Changed:
- path/to/file.ts (what changed)

Next: [Concrete next action]
```

## Session Workflow

**Ending session**: Update SESSION.md → git checkpoint → note Next Action

**Resuming**: Read SESSION.md → check Next Action → continue from that point
