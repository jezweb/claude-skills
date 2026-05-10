---
name: github-release
description: "Prepare and publish GitHub releases. Sanitizes code for public release (secrets scan, personal artifacts, LICENSE/README validation), creates version tags, and publishes via gh CLI. Trigger with 'release', 'publish', 'open source', 'prepare for release', 'create release', or 'github release'."
compatibility: Designed for Claude Code (or similar products)
---

# GitHub Release

Sanitize and release projects to GitHub. Two-phase workflow: safety checks first, then tag and publish.

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- `gitleaks` installed for secrets scanning (`brew install gitleaks` or download from GitHub)
- Git repository with a remote configured

## Workflow

### Phase 1: Sanitize

Run these checks before any public release. Stop on blockers.

#### 1. Scan for Secrets (BLOCKER)

```bash
gitleaks detect --no-git --source=. --verbose
```

If secrets found: **STOP**. Remove secrets, move to environment variables. Check git history with `git log -S "secret_value"` — if in history, use BFG Repo-Cleaner.

If gitleaks not installed, do manual checks:

```bash
# Check for .env files
find . -name ".env*" -not -path "*/node_modules/*"

# Check config files for hardcoded secrets
grep -ri "api_key\|token\|secret\|password" wrangler.toml wrangler.jsonc .dev.vars 2>/dev/null
```

#### 2. Remove Personal Artifacts

Check for and remove session/planning files that shouldn't be published:

- `SESSION.md` — session state
- `planning/`, `screenshots/` — working directories
- `test-*.ts`, `test-*.js` — local test files

Either delete them or add to `.gitignore`.

#### 3. Validate LICENSE

```bash
ls LICENSE LICENSE.md LICENSE.txt 2>/dev/null
```

If missing: create one. Check the repo visibility (`gh repo view --json visibility -q '.visibility'`). Use MIT for public repos. For private repos, consider a proprietary license instead.

#### 4. Validate README

Check README exists and has basic sections:

```bash
grep -i "## Install\|## Usage\|## License" README.md
```

If missing sections, add them before release.

#### 5. Check .gitignore

Verify essential patterns are present:

```bash
grep -E "node_modules|\.env|dist/|\.dev\.vars" .gitignore
```

#### 6. Build Test (non-blocking)

```bash
npm run build 2>&1
```

#### 7. Dependency Audit (non-blocking)

```bash
npm audit --audit-level=high
```

#### 8. Create Sanitization Commit

If any changes were made during sanitization:

```bash
git add -A
git commit -m "chore: prepare for release"
```

### Phase 2: Release

#### 1. Determine Version

Check `package.json` for current version, or ask the user. Ensure version starts with `v` prefix.

#### 2. Check Tag Doesn't Exist

```bash
git tag -l "v[version]"
```

If it exists, ask user whether to delete and recreate or use a different version.

#### 3. Show What's Being Released

```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  git log --oneline --no-merges HEAD | head -20
else
  git log --oneline --no-merges ${LAST_TAG}..HEAD
fi
```

#### 4. Create Tag and Push

```bash
git tag -a v[version] -m "Release v[version]"
git push origin $(git branch --show-current)
git push origin --tags
```

#### 5. Create GitHub Release

```bash
gh release create v[version] \
  --title "Release v[version]" \
  --notes "[auto-generated from commits]"
```

For pre-releases add `--prerelease`. For drafts add `--draft`.

#### 6. Report

Show the user:
- Release URL
- Next steps (npm publish if applicable, announcements)

## Reference Files

| When | Read |
|------|------|
| Detailed safety checks | [references/safety-checklist.md](references/safety-checklist.md) |
| Release mechanics | [references/release-workflow.md](references/release-workflow.md) |
