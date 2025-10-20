# Research Protocol for Building Claude Skills

**Purpose**: Ensure every skill is built on accurate, current, official documentation
**Last Updated**: 2025-10-20

---

## 🎯 Core Principle

**Bad skills are worse than no skills.** They perpetuate errors, waste tokens, and damage trust.

Every skill MUST be:
- ✅ Based on official documentation
- ✅ Tested in real environments
- ✅ Using current package versions
- ✅ Preventing known, verified errors
- ✅ Documented with evidence

---

## 📋 Pre-Build Research Checklist

**Before writing ANY skill files, complete this checklist:**

### Step 1: Identify Official Sources (30 min)

- [ ] **Find official documentation** (not blog posts or tutorials)
  - Package docs (e.g., https://tailwindcss.com/docs)
  - GitHub repositories (official repos only)
  - API documentation (latest version)

- [ ] **Check Context7 MCP** for library documentation
  ```
  Use: mcp__context7__resolve-library-id
  Then: mcp__context7__get-library-docs
  ```

- [ ] **Use Cloudflare Docs MCP** (if Cloudflare-related)
  ```
  Use: mcp__cloudflare-docs__search_cloudflare_documentation
  ```

- [ ] **Verify documentation is current**
  - Check "Last Updated" dates
  - Verify version numbers match latest stable
  - Read changelog/release notes

### Step 2: Verify Package Versions (15 min)

- [ ] **Check npm for latest versions**
  ```bash
  npm view <package-name> version
  npm view <package-name> versions --json | tail -20
  ```

- [ ] **Document versions explicitly**
  ```markdown
  ## Tested Versions
  - @cloudflare/vite-plugin: 1.2.3 (latest stable as of 2025-10-20)
  - hono: 4.5.1
  - wrangler: 3.72.0
  ```

- [ ] **Check for breaking changes**
  - Read migration guides
  - Check GitHub issues for "breaking"
  - Note any deprecation warnings

### Step 3: Research Known Issues (30 min)

- [ ] **Search GitHub issues** for common problems
  ```
  Search: "[package-name] error" or "[package-name] doesn't work"
  Filter: Open issues, recently updated
  ```

- [ ] **Check community discussions**
  - Official Discord/Slack if available
  - Stack Overflow for common errors
  - Reddit r/[technology] discussions

- [ ] **Document actual errors encountered**
  ```markdown
  ## Known Issues This Skill Prevents
  | Error | Why It Happens | Source | Fix |
  |-------|---------------|---------|-----|
  | "tw-animate-css not found" | shadcn init adds non-existent import | Issue #123 | Remove line 4 in index.css |
  ```

### Step 4: Build Working Example (1-3 hours)

- [ ] **Create test project from scratch**
  ```bash
  mkdir test-skill-example
  cd test-skill-example
  # Follow your own skill instructions
  ```

- [ ] **Test in target environment**
  - Local development (npm run dev)
  - Production build (npm run build)
  - Deployment (if applicable)

- [ ] **Document actual errors you hit**
  - Screenshot error messages
  - Note console warnings
  - Record fix steps

- [ ] **Verify the fix works**
  - Test multiple times
  - Try different scenarios
  - Confirm no regressions

### Step 5: Cross-Reference Sources (15 min)

- [ ] **Compare official docs to examples**
  - Do official examples work?
  - Are there conflicting patterns?
  - Which is more current?

- [ ] **Check for version-specific issues**
  - Does v4 work like v3?
  - Are there deprecated patterns?
  - What changed recently?

- [ ] **Verify with multiple sources**
  - Official docs
  - Official GitHub repo examples
  - Community-verified solutions

---

## 🔍 Research Documentation Template

For each skill, create a research log:

```markdown
## Research Log: [Skill Name]

### Official Sources Consulted

1. **Primary Documentation**
   - URL: https://...
   - Version: X.Y.Z
   - Last Checked: 2025-10-20
   - Key Pages: [list relevant pages]

2. **GitHub Repository**
   - URL: https://github.com/...
   - Latest Release: vX.Y.Z (date)
   - Issues Reviewed: [list key issues]

3. **Context7 Libraries**
   - Library ID: /org/project
   - Documentation Version: latest
   - Topic Focused: [specific area]

### Version Information

| Package | Current | Latest | Tested | Notes |
|---------|---------|--------|--------|-------|
| @cloudflare/vite-plugin | 1.2.3 | 1.2.3 | ✅ | Stable |
| hono | 4.5.0 | 4.5.1 | ⚠️ | Update available |

### Known Issues Discovered

1. **Issue**: [Description]
   - **Source**: GitHub Issue #123
   - **Cause**: [Root cause]
   - **Fix**: [Solution]
   - **Verified**: ✅ Tested in production

2. **Issue**: [Description]
   - ...

### Working Example

- **Built**: 2025-10-20
- **Location**: /path/to/example
- **Deployed**: https://example.com (if applicable)
- **Status**: ✅ Working
- **Errors Encountered**: [list any]
- **Time to Build**: ~2 hours

### Community Verification

- **Discussions Reviewed**: [links]
- **Stack Overflow**: [relevant questions]
- **Discord/Slack**: [key threads]
- **Consensus**: [what the community confirms works]

### Uncertainties / Questions

- [ ] [Any unclear points]
- [ ] [Conflicting information]
- [ ] [Need to verify X]

### Sign-Off

- [x] All official docs reviewed
- [x] Latest versions verified
- [x] Example project working
- [x] Known issues documented
- [x] Ready to build skill

**Researcher**: [Your Name]
**Date**: 2025-10-20
```

---

## 🚨 Red Flags - Stop and Investigate

If you encounter any of these, STOP and investigate further:

### Documentation Red Flags
- ❌ Examples in docs don't work when tested
- ❌ Multiple conflicting approaches in same docs
- ❌ Documentation last updated >1 year ago
- ❌ "This feature is experimental" warnings
- ❌ No version information provided

### Community Red Flags
- ❌ Many recent issues about same problem
- ❌ Official team not responding to issues
- ❌ Community says "docs are wrong"
- ❌ Workarounds instead of official solutions
- ❌ Deprecated warnings in console

### Technical Red Flags
- ❌ Package has known security vulnerabilities
- ❌ Last npm publish >2 years ago
- ❌ Breaking changes not documented
- ❌ Dependencies conflict with each other
- ❌ Tests failing in official repo

**Action**: Document the red flag, investigate root cause, decide if skill is viable.

---

## 🛠️ Tools We Have

### Context7 MCP
```typescript
// Find library ID
mcp__context7__resolve-library-id({ libraryName: "tailwindcss" })

// Get documentation
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/websites/tailwindcss",
  topic: "configuration"
})
```

### Cloudflare Docs MCP
```typescript
mcp__cloudflare-docs__search_cloudflare_documentation({
  query: "workers static assets"
})
```

### WebFetch
```typescript
WebFetch({
  url: "https://docs.example.com/latest",
  prompt: "What are the setup instructions?"
})
```

### WebSearch
```typescript
WebSearch({
  query: "tailwind v4 css variables not working 2025"
})
```

---

## ✅ Quality Gates

A skill can only proceed to implementation if:

### Research Complete
- [x] Official documentation reviewed thoroughly
- [x] Context7 MCP checked for library docs
- [x] Latest package versions verified on npm
- [x] Known issues researched on GitHub
- [x] Community discussions reviewed

### Example Working
- [x] Test project built from scratch
- [x] Local development tested
- [x] Production build succeeds
- [x] Deployed (if applicable)
- [x] All errors documented and fixed

### Documentation Accurate
- [x] Official docs linked (specific pages)
- [x] Version numbers documented
- [x] Known issues have sources
- [x] Breaking changes noted
- [x] Last verified date recorded

---

## 📝 After Building the Skill

### Verification Checklist

- [ ] **Templates match research**
  - Versions in templates match tested versions
  - Configuration follows official docs
  - No deprecated patterns used

- [ ] **Documentation is accurate**
  - Links to official docs work
  - Version numbers are current
  - Known issues are real (not theoretical)

- [ ] **Example project proves it works**
  - Can be built from templates
  - Runs without errors
  - Deployed successfully

- [ ] **Research log is complete**
  - All sources documented
  - All tests recorded
  - Sign-off completed

---

## 🔄 Maintenance Protocol

Skills need periodic updates when:

### Trigger Events
- New major version of key dependency
- Security vulnerability reported
- Breaking change announced
- Official docs updated significantly
- Community reports skill doesn't work

### Update Process
1. Re-run research checklist
2. Update version numbers
3. Test with new versions
4. Update templates
5. Update documentation
6. Mark "Last Updated" date
7. Commit with changelog

### Update Schedule
- **Quarterly**: Check for version updates
- **Monthly**: Review GitHub issues
- **On-demand**: When users report problems

---

## 📖 Reference Standards

This protocol ensures skills meet these standards:
- [Official Standards Analysis](official-standards-analysis.md)
- [Skills Roadmap](skills-roadmap.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Remember**: 15 minutes of research saves hours of debugging. Always verify before building.
