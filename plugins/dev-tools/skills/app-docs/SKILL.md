---
name: app-docs
description: "Generate complete user documentation for a web app with screenshots. Browses the app via browser automation, screenshots every screen, and produces a structured user guide with step-by-step instructions, annotated screenshots, workflow diagrams, and reference tables. Supports quick (key screens), standard (all pages), thorough (every state and flow), and exhaustive (publishable documentation suite). Triggers: 'document the app', 'user guide', 'app documentation', 'screenshot docs', 'generate user docs', 'help docs', 'how-to guide', 'write the docs'."
compatibility: Designed for Claude Code (or similar products)
---

# App Documentation Generator

Browse a running web app, screenshot every screen, and produce documentation good enough to publish. Not a screenshot dump — a structured guide that teaches someone how to use the app.

## Browser Tool Detection

Same as ux-audit — Chrome MCP, Playwright MCP, or playwright-cli.

## URL Resolution

Same as ux-audit — prefer deployed/live URL over localhost.

## Depth Levels

| Depth | Screenshots | What it produces | Duration |
|-------|------------|-----------------|----------|
| **quick** | ~10 | Single-page quick-start guide. Key screens, happy path only. | 10-15 min |
| **standard** | ~30 | Full user guide. All pages, primary workflows, reference tables. | 30-60 min |
| **thorough** | ~80+ | Comprehensive guide. All states, mobile views, every CRUD flow, troubleshooting. | 1-3 hours |
| **exhaustive** | ~150+ | Publishable documentation suite. Everything in thorough plus: getting started tutorial, feature-by-feature deep dives, admin guide, keyboard shortcut reference, FAQ, and HTML version. | 3-6 hours |

Default: **standard**

## Workflow

### 1. Get App Details

Ask the user:
- **App URL** (required — or auto-detect from wrangler.jsonc / running dev server)
- **App name** (for the guide title)
- **Auth** — Chrome MCP uses their session; Playwright needs credentials
- **Depth** — quick, standard, thorough, or exhaustive
- **Audience** — who reads this? (end users, admins, new team members, clients)

### 2. Discover All Routes

Navigate the app and build a complete page inventory:
- Read the sidebar/navigation menu
- Click through all top-level items and sub-items
- Note sub-pages, tabs within pages, and nested navigation
- Check for settings, profile, admin areas, help pages
- Record the URL and purpose of each page
- Note which pages have interactive elements (forms, buttons, filters)

Create a task list to track documentation progress.

### 3. Document Each Page

For each page in the inventory:

#### a. Navigate and Prepare
- Navigate to the page
- Wait for data to load (no skeleton/spinner in screenshot)
- Resize browser to 1280x720 for consistent screenshots
- Make sure the page has realistic data — not "Test Client" or empty tables

#### b. Screenshot the Default State
- Take a clean screenshot showing the page populated with data
- Save to `docs/screenshots/` with descriptive names

#### c. Write the Page Section

For each page, write:

```markdown
## [Page Name]

[One sentence: what this page is for and when you'd use it]

![Page name](screenshots/NN-page-name.png)

### What You'll See
[Describe the key elements: sidebar shows X, main area shows Y, toolbar has Z]

### What You Can Do
[List the actions available, each as a brief description]

### How To: [Primary Action]
1. [Step with screenshot reference]
2. [Step]
3. [Step — screenshot the result]

> **Tip:** [Helpful shortcut or non-obvious feature]
```

#### d. Document Key Workflows

For interactive pages, document step-by-step with screenshots at each significant step:

```markdown
### How To: Add a New Client

1. Click the **"Add Client"** button in the top right
   ![Add button location](screenshots/12-clients-add-button.png)

2. Fill in the required fields — Name and Email are required, everything else is optional
   ![New client form](screenshots/13-clients-new-form.png)

3. Click **"Save"** — you'll be taken to the new client's detail page
   ![Client saved confirmation](screenshots/14-clients-saved.png)

> **Tip:** You can also press **Cmd+N** from anywhere to create a new client.
```

#### e. Depth-Specific Extras

| Extra | quick | standard | thorough | exhaustive |
|-------|-------|----------|----------|-----------|
| Empty states | Skip | Note | Screenshot + document | Screenshot + suggest improvements |
| Error states | Skip | Note | Trigger + screenshot | Every validation error documented |
| Dark mode | Skip | Skip | Screenshot key pages | Screenshot every page |
| Mobile (375px) | Skip | Skip | Screenshot key pages | Screenshot every page |
| All CRUD | Skip | Primary only | Every operation | Every operation + edge cases |
| Settings/config | Skip | List options | Document each | Document each with examples |
| Keyboard shortcuts | Skip | List if visible | Full reference table | Dedicated section |
| Search/filters | Skip | Mention | Document each filter | Document every combination |
| Permissions/roles | Skip | Skip | Note differences | Separate section per role |
| API/integrations | Skip | Skip | Mention if present | Document endpoints + examples |

### 4. Write Supporting Sections

Beyond per-page documentation:

**Getting Started** (all depths):
```markdown
## Getting Started

### Accessing [App Name]
- URL: [production URL]
- Supported browsers: Chrome, Firefox, Safari, Edge
- Mobile: [responsive / PWA / not supported]

### Logging In
[Screenshot of login page + steps]

### Your First 5 Minutes
1. [First thing to do after logging in]
2. [Second thing — the quick win]
3. [Third thing — explore the main feature]
```

**Navigation Guide** (standard+):
```markdown
## Navigation

### Sidebar
[Screenshot with annotations describing each section]

### Quick Actions
- **Cmd+K**: Quick switcher — jump to any page or record
- **Cmd+N**: Create new [item]
[Other shortcuts]

### Breadcrumbs / Back Navigation
[How to navigate back, where breadcrumbs appear]
```

**Keyboard Shortcuts Reference** (thorough+):
```markdown
## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+K | Quick switcher |
| Cmd+N | New [item] |
| Cmd+S | Save |
| Escape | Close dialog / cancel |
```

**Troubleshooting** (thorough+):
```markdown
## Troubleshooting

### [Error message or symptom]
**What it means**: [explanation]
**How to fix**: [steps]

### Common Questions
[FAQ generated from what would confuse a new user — based on the documentation process itself]
```

**Admin Guide** (exhaustive):
```markdown
## Admin Guide

### User Management
[How to invite users, set roles, remove access]

### Settings Reference
| Setting | What it does | Default | Recommendation |
[Every setting documented]

### Data Management
[Export, import, backup, delete account]
```

### 5. Output Formats

**Markdown** (default): `docs/USER_GUIDE.md`
- Relative image paths: `![alt](screenshots/NN-description.png)`
- GitHub-flavoured markdown — renders on GitHub, in VS Code, in Obsidian

**HTML** (exhaustive depth, or on request): `docs/user-guide.html`
- Single self-contained HTML file with Tailwind CDN
- Screenshots as relative paths (not base64 — keeps file size sane)
- Table of contents sidebar with smooth scroll
- Print-friendly CSS (`@media print`)
- Dark mode support

**Screenshot naming**: `docs/screenshots/NN-section-description.png`
- Numbers for sort order: `01-`, `02-`, `03-`
- Section prefix: `01-dashboard-`, `05-clients-`, `12-settings-`
- Descriptive suffix: `-overview.png`, `-add-form.png`, `-saved-confirmation.png`

### 6. Mockups and Diagrams

Mix screenshots with diagrams where it helps understanding:

**Workflow diagrams** (text-based, no external tools):
```markdown
### How a Client Moves Through the System

```
New Enquiry → Create Client → Add Policy → Send Renewal → Archive
     ↓              ↓              ↓             ↓            ↓
  [Email]    [Client Page]   [Policy Page]  [Email Outbox]  [Archive]
```
```

**Annotated screenshots**: When a screenshot needs callouts, describe them in the text:
```markdown
![Dashboard](screenshots/01-dashboard.png)

The dashboard shows:
- **A** (top left): Your client count and active policies
- **B** (centre): Items needing attention today
- **C** (right): Recent activity feed
```

**UI element reference**: For complex pages, a labelled diagram helps:
```markdown
### Editor Layout

| Area | What it does |
|------|-------------|
| Left panel | Folder tree — organise your notes |
| Centre panel | Note list — shows notes in the selected folder |
| Right panel | Editor — write and preview your note |
| Top bar | Navigation, search (Cmd+K), and view toggles |
```

## Screenshot Quality

- **Resolution**: 1280x720 (desktop), 375x812 (mobile)
- **Data**: Realistic data. Not "Test" or "Lorem ipsum". Use the app as it would actually be used.
- **Timing**: Wait for data to load. No spinners, no skeleton screens in final shots.
- **State**: Show the page in a useful state — with data populated, relevant section expanded, key feature visible
- **Consistency**: Same viewport size, same zoom level, same browser throughout
- **Dark mode**: If documenting dark mode, switch BEFORE taking screenshots — don't mix modes in one section

## Autonomy Rules

- **Just do it**: Navigate pages, take screenshots, read page content, write documentation
- **Brief confirmation**: Before writing large doc files
- **Ask first**: Before submitting forms with real data, before clicking delete
- **Thorough/exhaustive mode**: Skip confirmation for writing files and filling forms with test data

## Quality Bar

The documentation should be good enough that:

1. **A new user can complete any task** by following the guide without asking for help
2. **Every screenshot has context** — what am I looking at? What should I do?
3. **Steps are atomic** — one action per numbered step, never "click X and then fill in Y and Z"
4. **Tips reveal hidden value** — shortcuts, power features, things the user wouldn't discover on their own
5. **Troubleshooting is real** — based on actual confusing moments encountered during documentation, not hypothetical FAQs
6. **It's scannable** — headings, screenshots, tables, tips. Nobody reads documentation top-to-bottom. They search for what they need.
