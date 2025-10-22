# Wrangler CLI Commands for Durable Objects

Complete reference for managing Durable Objects with wrangler CLI.

---

## Development Commands

### Dev Server

```bash
# Start local dev server
npx wrangler dev

# Dev with remote Durable Objects (not local)
npx wrangler dev --remote

# Dev with specific port
npx wrangler dev --port 8787
```

### Deployment

```bash
# Deploy to production
npx wrangler deploy

# Deploy specific environment
npx wrangler deploy --env production

# Dry run (show what would be deployed)
npx wrangler deploy --dry-run
```

---

## Durable Objects Commands

### List DO Namespaces

```bash
# List all DO namespaces in account
npx wrangler d1 list
```

### View DO Objects

```bash
# List all instances of a DO class
npx wrangler durable-objects namespace list <BINDING_NAME>

# Get info about specific DO instance
npx wrangler durable-objects namespace get <BINDING_NAME> --id <OBJECT_ID>
```

### Delete DO Instances

```bash
# Delete specific DO instance (deletes all storage)
npx wrangler durable-objects namespace delete <BINDING_NAME> --id <OBJECT_ID>

# DANGEROUS: Delete all instances in namespace
npx wrangler durable-objects namespace delete-all <BINDING_NAME>
```

---

## Logs and Debugging

### Tail Logs

```bash
# Tail logs from deployed Worker
npx wrangler tail

# Tail with filter
npx wrangler tail --format pretty

# Tail specific DO
npx wrangler tail --search "DurableObject"
```

### View Logs

```bash
# View recent logs
npx wrangler pages deployment tail

# Filter by log level
npx wrangler tail --level error
```

---

## Type Generation

### Generate TypeScript Types

```bash
# Generate types for bindings
npx wrangler types

# This creates worker-configuration.d.ts with:
# - DurableObjectNamespace types
# - Env interface
# - Binding types
```

---

## Migrations

**Migrations are configured in `wrangler.jsonc`, not via CLI commands.**

Example migration workflow:

1. Edit `wrangler.jsonc` to add migration
2. Run `npx wrangler deploy`
3. Migration applies atomically on deploy

See `migrations-guide.md` for detailed migration patterns.

---

## Useful Flags

### Common Flags

```bash
# Show help
npx wrangler --help
npx wrangler deploy --help

# Specify config file
npx wrangler deploy --config wrangler.production.jsonc

# Specify environment
npx wrangler deploy --env staging

# Verbose output
npx wrangler deploy --verbose

# Compatibility date
npx wrangler deploy --compatibility-date 2025-10-22
```

---

## Example Workflows

### Initial Setup

```bash
# 1. Initialize project
npm create cloudflare@latest my-do-app -- \
  --template=cloudflare/durable-objects-template \
  --ts --git --deploy false

cd my-do-app

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Deploy
npm run deploy
```

### Update and Deploy

```bash
# 1. Make code changes
# 2. Test locally
npm run dev

# 3. Deploy
npm run deploy

# 4. Tail logs
npx wrangler tail
```

### Add New DO Class

```bash
# 1. Create DO class file (e.g., src/counter.ts)
# 2. Update wrangler.jsonc:
#    - Add binding
#    - Add migration
# 3. Deploy
npm run deploy
```

---

## Troubleshooting

### Check Deployment Status

```bash
npx wrangler deployments list
```

### Rollback Deployment

```bash
# Cloudflare automatically keeps recent versions
# Use dashboard to rollback if needed
```

### Clear Local Cache

```bash
rm -rf .wrangler
```

---

**Official Docs**: https://developers.cloudflare.com/workers/wrangler/commands/
