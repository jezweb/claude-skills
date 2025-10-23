# Quick Start Guide

Get your Cloudflare full-stack app running in 5 minutes.

---

## 1. Copy Scaffold

```bash
cp -r /path/to/scaffold/ my-new-app/
cd my-new-app/
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Initialize Services

```bash
npx wrangler d1 create my-app-db
npx wrangler kv:namespace create my-app-kv
npx wrangler r2 bucket create my-app-bucket
npx wrangler vectorize create my-app-index --dimensions=1536
npx wrangler queues create my-app-queue
```

Update `wrangler.jsonc` with the IDs.

## 4. Create Database Tables

```bash
npm run d1:local
```

## 5. Start Development

```bash
npm run dev
```

Visit: http://localhost:5173

---

## Next Steps

### Add UI Components

Ask Claude Code:
```
Use the tailwind-v4-shadcn skill to add Button, Card, and Dialog components
```

### Add API Routes

Ask Claude Code:
```
Use the cloudflare-full-stack-integration skill to create D1 CRUD routes
```

### Enable Authentication (Optional)

```bash
./scripts/enable-auth.sh
```

---

## Deployment

```bash
npm run build
npx wrangler deploy
npm run d1:remote  # Apply schema to production
npx wrangler secret put CLERK_SECRET_KEY
```

---

See `INSTALL.md` for detailed setup instructions.
