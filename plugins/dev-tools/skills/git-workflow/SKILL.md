---
name: git-workflow
description: "Guided git workflows: prepare PRs, clean up branches, resolve merge conflicts, handle monorepo tags, squash-and-merge patterns. Use when asked to prepare a PR, clean branches, resolve conflicts, or tag a release."
compatibility: Designed for Claude Code (or similar products)
---

# Git Workflow

Guided workflows for common git operations that benefit from structured steps.

## PR Preparation

When preparing a pull request:

1. **Gather context**
   - `git log main..HEAD --oneline` — list all commits on the branch
   - `git diff main...HEAD --stat` — see all changed files
   - `git status` — check for uncommitted work

2. **Draft PR content**
   - Title: under 70 chars, describes the change (not the branch name)
   - Body: summarise the "why", list key changes, add test plan
   - Use the commit history to write the summary — don't rely on memory

3. **Push and create**
   ```bash
   git push -u origin HEAD
   gh pr create --title "..." --body "$(cat <<'EOF'
   ## Summary
   - ...

   ## Test plan
   - [ ] ...

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

4. **Verify** — `gh pr view --web` to open in browser

## Branch Cleanup

Clean up merged branches safely:

1. **Switch to main and pull latest**
   ```bash
   git checkout main && git pull
   ```

2. **List merged branches** (excludes main/master/develop)
   ```bash
   git branch --merged main | grep -vE '^\*|main|master|develop'
   ```

3. **Delete local merged branches**
   ```bash
   git branch --merged main | grep -vE '^\*|main|master|develop' | xargs -r git branch -d
   ```

4. **Prune remote tracking refs**
   ```bash
   git fetch --prune
   ```

5. **List remote branches with no local tracking** (optional)
   ```bash
   git branch -r --merged origin/main | grep -vE 'main|master|develop|HEAD'
   ```

## Merge Conflict Resolution

When a PR has conflicts:

1. **Assess the conflict scope**
   ```bash
   git fetch origin
   git merge origin/main --no-commit --no-ff
   git diff --name-only --diff-filter=U  # List conflicted files
   ```

2. **For each conflicted file**, read the file and resolve:
   - Keep both changes if they're in different areas
   - If architecturally incompatible, prefer the main branch's approach and re-apply the PR's intent on top

3. **If rebase is cleaner** (few commits, no shared history):
   ```bash
   git rebase origin/main
   # Resolve conflicts per commit, then:
   git rebase --continue
   ```

4. **If rebase is messy** (many conflicts, architectural divergence):
   - Abort: `git rebase --abort` or `git merge --abort`
   - Extract useful code: `git show origin/branch:path/to/file > /tmp/extracted.txt`
   - Apply changes manually to main
   - Close original PR with explanation

5. **Verify** — run tests, check the diff looks right

## Monorepo Release Tags

In monorepos, scope tags to the package:

```bash
# ❌ Ambiguous in monorepos
git tag v2.1.0

# ✅ Scoped to package
git tag contextbricks-v2.1.0
git push origin contextbricks-v2.1.0
```

Pattern: `{package-name}-v{semver}`

## .gitignore-First Init

When creating a new repo, always create `.gitignore` BEFORE the first `git add`:

```bash
cat > .gitignore << 'EOF'
node_modules/
.wrangler/
dist/
.dev.vars
*.log
.DS_Store
.env
.env.local
EOF

git init && git add . && git commit -m "Initial commit"
```

**If node_modules is already tracked:**
```bash
git rm -r --cached node_modules/
git commit -m "Remove node_modules from tracking"
```

## Private Repo License Audit

Before publishing or sharing a private repo:

```bash
gh repo view --json visibility -q '.visibility'
```

If `PRIVATE`, ensure:
- `LICENSE` contains proprietary notice (not MIT/Apache)
- `package.json` has `"license": "UNLICENSED"` and `"private": true`
- No `CONTRIBUTING.md` or "contributions welcome" in README
