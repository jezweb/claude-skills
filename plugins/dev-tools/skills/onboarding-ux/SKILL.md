---
name: onboarding-ux
description: "Audit and generate in-app user guidance — onboarding flows, empty states, tooltips, feature tours, contextual help, defaults, and inline hints. Browses the app to find where new users would get stuck, then produces the actual content and code to fix it. Pairs with ux-audit: audit finds problems, this skill builds the solutions. Triggers: 'onboarding', 'help content', 'empty states', 'user guidance', 'first run experience', 'feature tour', 'app is confusing', 'new user experience', 'make the app welcoming'."
compatibility: Designed for Claude Code (or similar products)
---

# Onboarding UX

Audit a web app for onboarding gaps, then generate the in-app guidance to fix them. The goal: a new user should never stare at a blank screen wondering what to do.

## The Problem This Solves

You've built the features. They work. But when a new user logs in for the first time, they see:
- Empty tables with column headers and nothing else
- Sidebars full of labels that mean nothing to them yet
- No indication of where to start or what the app is for
- Features they don't know exist because nothing points to them

This skill finds those gaps and produces the content and code to fill them.

## Browser Tool Detection

Same as ux-audit — detect Chrome MCP, Playwright MCP, or playwright-cli. See ux-audit's browser-tools.md reference if needed.

## URL Resolution

Same as ux-audit — prefer deployed/live URL over localhost. Check wrangler.jsonc, CLAUDE.md, or running dev server.

## Workflow

### Phase 1: Audit — Find the Gaps

Browse the app as a brand new user. On every page, evaluate:

#### Empty States
Navigate to every list/table/collection page. For each:

| Check | Good | Bad |
|-------|------|-----|
| What does a zero-data page show? | "No clients yet. Add your first client to get started." + CTA button | Empty table with column headers, or blank white space |
| Is there a clear action? | Button: "Add your first [thing]" | Nothing — user has to find the action in the nav or a menu |
| Does it explain the feature? | "Clients are the people and businesses you work with. Add one to start tracking your relationships." | Just an empty container |
| Is the empty state designed? | Illustration or icon, helpful copy, prominent CTA | Identical to the populated state minus the data |

#### First Impression
Log in as a new user (or clear state to simulate). Evaluate:

| Check | What to look for |
|-------|-----------------|
| **Landing page** | Does the dashboard/home show something useful or is it empty? |
| **Orientation** | Within 10 seconds, do I know what this app does and where to start? |
| **First action** | Is the #1 thing I should do obvious and prominent? |
| **Cognitive load** | How many menu items, buttons, and options compete for attention? |
| **Welcome content** | Is there a welcome message, tour, or getting-started guide? Or just the raw app? |

#### Feature Discoverability
For each feature in the app:

| Check | What to look for |
|-------|-----------------|
| **Can I find it?** | Is it visible in the nav, or buried in a menu/submenu? |
| **Do I know what it does?** | Does the label explain it, or do I need to click to find out? |
| **Keyboard shortcuts** | Are there shortcuts? Are they discoverable (tooltip, help panel)? |
| **Advanced features** | Filters, bulk actions, search — are these visible or hidden? |
| **Settings and configuration** | Can I find the settings? Do I know what each setting does? |

#### Contextual Help Gaps
On each page:

| Check | What to look for |
|-------|-----------------|
| **Form fields** | Do complex fields have help text or tooltips? |
| **Jargon** | Any labels that a non-expert wouldn't understand? |
| **Consequences** | Do destructive or irreversible actions explain what will happen? |
| **Validation** | When I make a mistake, does the error message tell me how to fix it? |

#### Produce an Audit Report

Write to `.jez/artifacts/onboarding-audit.md`:

```markdown
# Onboarding Audit: [App Name]
**Date**: YYYY-MM-DD
**URL**: [app url]

## First Impression Score
[1-5] — Can a new user figure out what to do within 30 seconds?

## Empty States Found
| Page | Current state | Recommendation |
|------|--------------|----------------|
| /clients | Empty table, no guidance | Add empty state with CTA |

## Missing Guidance
| Location | Gap | Priority |
|----------|-----|----------|
| Dashboard | No welcome or getting started | High |
| Settings | No descriptions on settings | Medium |

## Feature Discovery Issues
| Feature | Problem | Fix |
|---------|---------|-----|
| Keyboard shortcuts | No way to discover them | Add help panel |

## Quick Wins
[Top 5 changes that would have the biggest impact on new user experience]
```

---

### Phase 2: Generate — Build the Solutions

After the audit, generate the actual content and code. Read the project's codebase to match the existing tech stack and component patterns.

#### 1. Empty State Components

For each empty state identified in the audit, generate a component:

```tsx
// Pattern — adapt to the project's component library
function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
```

For each page, write specific copy:
- **Title**: What the feature is ("Clients")
- **Description**: Why it matters, in one sentence ("Track the people and businesses you work with")
- **Action**: What to do next ("Add your first client")

Write the copy so it feels like a helpful colleague, not a manual.

#### 2. Welcome / First-Run Experience

Generate one of these patterns based on the app's complexity:

**Simple app (3-5 features)**: Welcome banner on the dashboard
```tsx
// Dismissable welcome banner — shown until user closes it or completes first action
function WelcomeBanner({ onDismiss }) {
  return (
    <div className="rounded-lg border bg-card p-6 mb-6">
      <h2 className="text-xl font-semibold mb-2">Welcome to [App Name]</h2>
      <p className="text-muted-foreground mb-4">Here's how to get started:</p>
      <ol className="space-y-2 mb-4">
        <li>1. Add your first client</li>
        <li>2. Create a policy for them</li>
        <li>3. Check your dashboard for what needs attention</li>
      </ol>
      <Button variant="outline" size="sm" onClick={onDismiss}>Got it</Button>
    </div>
  );
}
```

**Complex app (6+ features)**: Checklist-style onboarding
```tsx
// Persistent getting-started checklist — tracks progress
function OnboardingChecklist({ steps, completedSteps }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <p className="text-sm text-muted-foreground">
          {completedSteps.length} of {steps.length} complete
        </p>
      </CardHeader>
      <CardContent>
        {steps.map(step => (
          <div key={step.id} className="flex items-center gap-3 py-2">
            <Checkbox checked={completedSteps.includes(step.id)} disabled />
            <span>{step.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

#### 3. Feature Tour

Generate a tour configuration for react-joyride (or equivalent):

```tsx
const tourSteps = [
  {
    target: '[data-tour="sidebar-clients"]',
    content: 'Your clients live here. Add people and businesses you work with.',
    placement: 'right',
  },
  {
    target: '[data-tour="create-button"]',
    content: 'Click here to create something new — a client, policy, or email.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search"]',
    content: 'Use search to find anything fast. Try Cmd+K for the quick switcher.',
    placement: 'bottom',
  },
];
```

Also generate the `data-tour` attributes that need to be added to existing components.

#### 4. Tooltip and Help Content

For each complex UI element, generate tooltip copy:

```tsx
// Pattern for info tooltips
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <InfoIcon className="h-4 w-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Significance shows how important this client is to your business.
      5 = critical (your biggest client), 1 = minimal (one-off interaction).</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Generate a content map: `{ fieldName: tooltipText }` for every field that needs explanation.

#### 5. Contextual Hints

Generate inline hints for features users might not discover:

```tsx
// Shown once, dismissable, stored in localStorage
function ContextualHint({ id, children }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(`hint-${id}`) === 'dismissed'
  );
  if (dismissed) return null;
  return (
    <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 mb-3 flex items-center justify-between">
      <span>{children}</span>
      <button onClick={() => { localStorage.setItem(`hint-${id}`, 'dismissed'); setDismissed(true); }}>
        <XIcon className="h-3 w-3" />
      </button>
    </div>
  );
}

// Usage
<ContextualHint id="keyboard-shortcuts">
  Tip: Press Cmd+K to quickly jump to any page or record.
</ContextualHint>
```

#### 6. Seed Data That Teaches

Generate sample records that demonstrate the app's features:

- A sample client with realistic data (not "Test Client")
- A sample record in each state (draft, active, completed, archived)
- Records that show relationships (client → contact → policy → email)

Use the `db-seed` skill patterns but with **onboarding-quality data** — records that teach the user what good data looks like.

#### 7. Help Page Content

Generate a help/FAQ page with content derived from the actual app:

```markdown
## Frequently Asked Questions

### How do I add a new client?
1. Click "Clients" in the sidebar
2. Click "Add Client" in the top right
3. Fill in the name and domain — everything else is optional
4. Click "Save"

### What does "significance" mean?
Significance is a 1-5 rating of how important a client is...

### Can I undo a deletion?
Deletions are permanent. You'll always see a confirmation before...
```

## Output

All generated content goes to `.jez/artifacts/onboarding/`:

```
.jez/artifacts/onboarding/
├── audit.md                    # The gap analysis report
├── empty-states.tsx            # Empty state components with copy
├── welcome-banner.tsx          # First-run welcome component
├── onboarding-checklist.tsx    # Getting-started checklist (if complex app)
├── tour-steps.ts               # Feature tour configuration
├── tooltip-content.ts          # Tooltip copy map
├── contextual-hints.tsx        # Inline hint component + content
├── seed-data.ts                # Onboarding seed records
└── help-content.md             # FAQ / help page content
```

Tell the user which files were generated and where to integrate them. Provide specific instructions for each: "Add this component to your /clients page when the client list is empty."

## Tips

- Read the project's existing component patterns before generating — match the style, don't introduce new patterns
- Use shadcn/ui components if the project uses them
- Write copy as if you're a helpful colleague, not a manual
- Empty states are the single highest-impact change — do those first
- Feature tours are annoying if they're too long — max 5 steps
- Contextual hints should be dismissable and only shown once
- Sample data should look real — use realistic Australian names, domains, and details
- The help page content can be generated from the "explain it to a colleague" output of ux-audit

## Pairing With Other Skills

| If you also run... | This skill adds... |
|--------------------|--------------------|
| `ux-audit` (thorough) | Uses the audit findings as input — fixes the problems found |
| `db-seed` | Generates onboarding-quality seed data instead of generic test data |
| `app-docs` | The help page content can feed into the user guide |
| `product-showcase` | Empty states and welcome flow make demo screenshots look better |
