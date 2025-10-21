# Skill Compliance Checklist ✅

**Print this page and check off items as you build your skill.**

---

## PRE-BUILD CHECKLIST

Before starting a new skill, verify:

- [ ] Read [START_HERE.md](START_HERE.md) for workflow overview
- [ ] Read [planning/research-protocol.md](planning/research-protocol.md)
- [ ] Copied template: `cp -r templates/skill-skeleton/ skills/my-skill/`
- [ ] Checked skill doesn't already exist in this repo
- [ ] Checked official Anthropic skills: https://github.com/anthropics/skills
- [ ] Identified target use cases (3-5 concrete examples)
- [ ] Verified this is atomic (one domain, not a bundle)

---

## RESEARCH CHECKLIST

Research completed before building:

- [ ] Checked Context7 MCP for library documentation
- [ ] Verified latest package versions on npm
- [ ] Reviewed official documentation (bookmarked URLs)
- [ ] Searched GitHub issues for common problems
- [ ] Built working example project from scratch
- [ ] Documented all errors encountered and fixes
- [ ] Created research log in `planning/research-logs/[skill-name].md`
- [ ] Identified token savings vs manual setup (≥50%)

---

## YAML FRONTMATTER CHECKLIST

`SKILL.md` frontmatter is complete and correct:

- [ ] **name**: Present, lowercase hyphen-case (e.g., `my-skill-name`)
- [ ] **name**: Matches directory name exactly
- [ ] **description**: Present and comprehensive (3+ sentences)
- [ ] **description**: Uses third-person ("This skill should be used when..." not "Use this skill when...")
- [ ] **description**: Includes "Use when" scenarios
- [ ] **description**: Includes keywords (technologies, use cases, error messages)
- [ ] **license**: Present (e.g., `MIT` or `Complete terms in LICENSE.txt`)
- [ ] **allowed-tools** (optional): Included if pre-approving tools
- [ ] **metadata** (optional): Used if custom fields needed

**Example:**
```yaml
---
name: my-skill-name
description: |
  This skill provides comprehensive knowledge for [technology]. It should be used when
  building projects with [use case], configuring [feature], or encountering [error].

  Keywords: technology, use-case, error-message, related-tech
license: MIT
---
```

---

## SKILL.MD BODY CHECKLIST

Skill instructions are clear and actionable:

- [ ] Written in **imperative/infinitive form** (verb-first: "To do X, run Y")
- [ ] NOT written in second person (avoid "you should")
- [ ] Quick start section (< 5 minutes to first result)
- [ ] Step-by-step instructions with code examples
- [ ] Configuration examples with actual values
- [ ] Critical rules section ("Always Do" / "Never Do")
- [ ] Common issues section with sources (GitHub issues, etc.)
- [ ] Dependencies clearly listed
- [ ] References to bundled resources (scripts/, references/, assets/)
- [ ] Official documentation links included
- [ ] Package versions documented with "Last Verified" date

---

## BUNDLED RESOURCES CHECKLIST

Resources are properly organized:

- [ ] **scripts/**: Executable code placed here (Python, Bash, etc.)
- [ ] **references/**: Documentation files placed here (schemas, guides)
- [ ] **assets/**: Output files placed here (templates, images, fonts)
- [ ] All resources referenced in SKILL.md body
- [ ] Scripts have proper permissions (chmod +x)
- [ ] No hardcoded secrets or credentials
- [ ] Templates are complete and tested
- [ ] Documentation is current and accurate

---

## README.MD CHECKLIST

Quick reference is complete:

- [ ] Status badge present (Production Ready / Beta / Experimental)
- [ ] Last Updated date current
- [ ] Production tested evidence included
- [ ] Auto-trigger keywords comprehensive
  - [ ] Primary keywords (3-5 exact tech names)
  - [ ] Secondary keywords (5-10 related terms)
  - [ ] Error-based keywords (2-5 common errors)
- [ ] "What This Skill Does" section clear
- [ ] "Known Issues Prevented" table with sources
- [ ] "When to Use / Not Use" sections present
- [ ] Token efficiency metrics documented
- [ ] Quick usage example included

---

## TESTING CHECKLIST

Skill works in practice:

- [ ] Installed skill: `./scripts/install-skill.sh my-skill`
- [ ] Verified symlink: `ls -la ~/.claude/skills/my-skill`
- [ ] Tested auto-discovery: Claude suggests skill when relevant
- [ ] Built example project using skill templates
- [ ] All templates work without errors
- [ ] All scripts execute successfully
- [ ] Configuration files valid
- [ ] Package versions correct
- [ ] HMR/dev server works (if applicable)
- [ ] Production build succeeds (if applicable)
- [ ] Deployed example (if applicable)

---

## COMPLIANCE CHECKLIST

Skill meets official standards:

- [ ] Compared against https://github.com/anthropics/skills/blob/main/agent_skills_spec.md
- [ ] Compared against [planning/claude-code-skill-standards.md](planning/claude-code-skill-standards.md)
- [ ] Reviewed [planning/STANDARDS_COMPARISON.md](planning/STANDARDS_COMPARISON.md)
- [ ] Checked [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md)
- [ ] Referenced working example (tailwind-v4-shadcn or Cloudflare skills)
- [ ] No deprecated patterns used
- [ ] No non-standard frontmatter fields (except allowed-tools, metadata)
- [ ] Writing style consistent (imperative, third-person)

---

## TOKEN EFFICIENCY CHECKLIST

Skill provides measurable value:

- [ ] Manual setup tokens measured (before skill)
- [ ] With-skill tokens measured (using skill)
- [ ] Token savings ≥ 50%
- [ ] Errors encountered documented (manual vs skill)
- [ ] Error prevention = 100% (all known errors prevented)
- [ ] Metrics documented in README.md

**Typical Metrics**:
```
Manual:  ~12,000 tokens, 2-3 errors
Skill:   ~4,500 tokens, 0 errors
Savings: ~62%, 100% error prevention
```

---

## DOCUMENTATION CHECKLIST

All required documentation present:

- [ ] SKILL.md complete
- [ ] README.md complete
- [ ] LICENSE field in frontmatter
- [ ] Research log in planning/research-logs/
- [ ] Templates tested and documented
- [ ] Scripts documented with usage examples
- [ ] References accurate and current
- [ ] Links to official docs work
- [ ] Version numbers current
- [ ] "Last Updated" date accurate

---

## QUALITY GATES CHECKLIST

Before committing:

- [ ] Read entire SKILL.md out loud (catches awkward phrasing)
- [ ] Ask someone unfamiliar to follow instructions (if possible)
- [ ] Built example project in fresh directory
- [ ] No errors in console during development
- [ ] No warnings about deprecated packages
- [ ] Git status clean (no untracked files)
- [ ] Skill name matches directory name
- [ ] All relative paths correct
- [ ] No placeholder text (TODO, FIXME, etc.)
- [ ] No debug code or console.log statements

---

## GIT CHECKLIST

Ready to commit:

- [ ] Working in feature branch (not main)
- [ ] Added skill files: `git add skills/my-skill/`
- [ ] Updated planning/skills-roadmap.md
- [ ] Commit message descriptive with:
  - [ ] What the skill does
  - [ ] Token savings metric
  - [ ] Errors prevented count
  - [ ] Production testing evidence
- [ ] Checked git diff before committing
- [ ] No sensitive data in commit
- [ ] All files have correct permissions

**Commit Template**:
```bash
git commit -m "Add my-skill for [use case]

- Provides [what it does]
- Token savings: ~XX%
- Errors prevented: X
- Package versions: [key-package]@X.Y.Z

Production tested: [evidence/link]
Research log: planning/research-logs/my-skill.md"
```

---

## POST-COMMIT CHECKLIST

After pushing:

- [ ] Pushed to GitHub: `git push`
- [ ] Created PR if appropriate
- [ ] Updated CHANGELOG.md
- [ ] Verified GitHub Actions pass (if configured)
- [ ] Skill appears in repo
- [ ] README renders correctly on GitHub
- [ ] Links work in GitHub UI
- [ ] Shared with team/community (if applicable)

---

## MAINTENANCE CHECKLIST

Quarterly (every 3 months):

- [ ] Check for package updates: `npm view [package] version`
- [ ] Review GitHub issues for skill-related problems
- [ ] Re-test skill in fresh environment
- [ ] Update "Last Verified" date if still current
- [ ] Update package versions if needed
- [ ] Document breaking changes (if any)
- [ ] Re-measure token efficiency
- [ ] Check official Anthropic skills for new patterns

---

## FINAL SIGN-OFF

I certify that:

- [ ] ✅ All checklists above are complete
- [ ] ✅ Skill tested and working in production
- [ ] ✅ Compliant with official Anthropic standards
- [ ] ✅ Documentation accurate and current
- [ ] ✅ Token efficiency ≥ 50%
- [ ] ✅ Zero errors from documented issues
- [ ] ✅ Ready for production use

**Skill Name**: ______________________
**Date**: ______________________
**Builder**: ______________________
**Verified By**: ______________________

---

**If all boxes checked: SHIP IT! 🚀**

**If any boxes unchecked**: Go back and complete those items before committing.

---

**Quick Links**:
- [START_HERE.md](START_HERE.md) - Navigation
- [QUICK_WORKFLOW.md](QUICK_WORKFLOW.md) - Step-by-step process
- [planning/COMMON_MISTAKES.md](planning/COMMON_MISTAKES.md) - What to avoid
- [CLOUDFLARE_SKILLS_AUDIT.md](CLOUDFLARE_SKILLS_AUDIT.md) - Example audit
