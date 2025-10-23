# Customization Guide

How to customize this scaffold for your needs.

---

## 1. Project Name

Update in:
- `package.json` → `name`
- `wrangler.jsonc` → `name`
- `SCRATCHPAD.md` → Project name
- `CLAUDE.md` → Project name

Or use: `./scripts/setup-project.sh <name>` (does this automatically)

---

## 2. Remove Unused Services

Example: Don't need Vectorize?

1. Delete from `wrangler.jsonc`:
```jsonc
// Remove this section
"vectorize": [
  {
    "binding": "VECTORIZE",
    "index_name": "my-app-index"
  }
]
```

2. Delete from `vite.config.ts`:
```typescript
// Remove this binding
VECTORIZE: {
  type: 'vectorize',
  indexName: 'my-app-index',
},
```

3. Update type definition in `backend/src/index.ts`:
```typescript
type Bindings = {
  // Remove VECTORIZE: VectorizeIndex
}
```

---

## 3. Customize Theme

Edit `src/index.css`:

```css
:root {
  --primary: hsl(220 90% 56%);  /* Change your primary color */
  --background: hsl(0 0% 100%); /* Change background */
}
```

---

## 4. Add UI Components

Ask Claude Code:
```
Use the tailwind-v4-shadcn skill to add Button, Card, Dialog, and Input components
```

---

## 5. Add API Routes

Ask Claude Code:
```
Use the cloudflare-full-stack-integration skill to create:
- D1 CRUD routes for users
- KV caching routes
- R2 file upload routes
```

---

## 6. Customize Database Schema

Edit `schema.sql` and `migrations/0001_initial.sql` for your tables.

Then apply:
```bash
npm run d1:local
```

---

## 7. Add New Pages

1. Create in `src/pages/`
2. Add route in `src/App.tsx`
3. Document in `docs/UI_COMPONENTS.md`

---

## 8. Enable Optional Features

**Authentication**:
```bash
./scripts/enable-auth.sh
```

**AI Chat**:
```bash
./scripts/enable-ai-chat.sh
```
