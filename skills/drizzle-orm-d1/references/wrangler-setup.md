# Wrangler Setup for D1 and Drizzle

Complete guide to configuring Wrangler for D1 databases with Drizzle ORM.

---

## wrangler.jsonc Configuration

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",

  // Node.js compatibility (recommended for Drizzle)
  "compatibility_flags": ["nodejs_compat"],

  // D1 database bindings
  "d1_databases": [
    {
      // Binding name (used as env.DB in code)
      "binding": "DB",

      // Database name
      "database_name": "my-database",

      // Production database ID (from wrangler d1 create)
      "database_id": "your-production-database-id",

      // Local database ID (for development)
      "preview_database_id": "local-db",

      // Migrations directory (Drizzle generates here)
      "migrations_dir": "./migrations"
    }
  ]
}
```

---

## Environment Variables

Create `.env` file (never commit):

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-database-id
CLOUDFLARE_D1_TOKEN=your-api-token
```

---

## Wrangler Commands

```bash
# Create database
wrangler d1 create my-database

# List databases
wrangler d1 list

# Database info
wrangler d1 info my-database

# Apply migrations (local)
wrangler d1 migrations apply my-database --local

# Apply migrations (remote)
wrangler d1 migrations apply my-database --remote

# Execute SQL directly (local)
wrangler d1 execute my-database --local --command="SELECT * FROM users"

# Execute SQL directly (remote)
wrangler d1 execute my-database --remote --command="SELECT * FROM users"
```

---

## Local vs Remote

**Local Development** (`--local`):
- Uses SQLite file in `.wrangler/state/v3/d1/`
- Fast, no network latency
- Data persists between `wrangler dev` sessions
- Perfect for development and testing

**Remote/Production** (`--remote`):
- Uses actual D1 database in Cloudflare
- Subject to rate limits
- Production data
- Use for staging/production environments

**Always test locally first!**

---

## Migration Workflow

```bash
# 1. Make schema changes in src/db/schema.ts

# 2. Generate migration
npm run db:generate  # or: drizzle-kit generate

# 3. Apply to local database
npm run db:migrate:local  # or: wrangler d1 migrations apply DB --local

# 4. Test locally
npm run dev

# 5. Deploy code
npm run deploy

# 6. Apply to production database
npm run db:migrate:remote  # or: wrangler d1 migrations apply DB --remote
```

---

## Important Notes

1. **migrations_dir**: Must point to where Drizzle generates migrations (usually `./migrations`)
2. **Binding name**: Must match in wrangler.jsonc, Env interface, and code
3. **Local first**: Always test migrations locally before remote
4. **Never commit**: Never commit database IDs or API tokens to version control
