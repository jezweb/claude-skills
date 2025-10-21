# Cloudflare D1 Database Skill

**Auto-Discovery Skill for Claude Code CLI**

Complete knowledge domain for working with Cloudflare D1 - serverless SQLite database on Cloudflare's edge network.

---

## Auto-Trigger Keywords

Claude will automatically suggest this skill when you mention any of these keywords:

### Primary Triggers (Technologies)
- d1
- d1 database
- cloudflare d1
- wrangler d1
- d1 migrations
- d1 bindings
- sqlite workers
- serverless database cloudflare
- edge database
- d1 queries
- sql cloudflare

### Secondary Triggers (Commands & Patterns)
- wrangler d1 create
- wrangler d1 migrations
- prepared statements d1
- batch queries d1
- d1 api
- d1 schema
- d1 indexes
- sqlite cloudflare workers
- sql workers api
- database bindings cloudflare

### Error-Based Triggers
- "D1_ERROR"
- "D1_EXEC_ERROR"
- "D1_TYPE_ERROR"
- "D1_COLUMN_NOTFOUND"
- "statement too long"
- "too many requests queued"
- "DB's isolate exceeded its memory limit"
- "DB exceeded its CPU time limit"
- "Network connection lost"
- "cannot start a transaction within a transaction"

---

## What This Skill Does

- ✅ Creates D1 databases with wrangler CLI
- ✅ Manages SQL migrations (create, list, apply)
- ✅ Configures D1 bindings in wrangler.jsonc
- ✅ Writes type-safe D1 queries in Workers
- ✅ Handles prepared statements with parameter binding
- ✅ Optimizes performance with batch queries
- ✅ Creates indexes for faster queries
- ✅ Implements error handling and retry logic
- ✅ Provides CRUD operation patterns
- ✅ Supports local and remote development workflows

---

## Known Issues Prevented

| Issue | Error Message | How Skill Prevents |
|-------|---------------|-------------------|
| **SQL Injection** | - | Always uses prepared statements with `.bind()` |
| **Statement Too Long** | "statement too long" | Templates show batching inserts (100-250 rows) |
| **Transaction Conflicts** | "cannot start a transaction within a transaction" | Migrations don't include BEGIN TRANSACTION |
| **Type Mismatch** | "D1_TYPE_ERROR" | Uses `null` instead of `undefined` for optional values |
| **Rate Limiting** | "too many requests queued" | Uses `.batch()` instead of individual queries |
| **Memory Exceeded** | "DB's isolate exceeded its memory limit" | Adds LIMIT clauses and pagination patterns |
| **Foreign Key Violations** | "foreign key constraint failed" | Uses `PRAGMA defer_foreign_keys = true` |
| **Index Not Used** | Slow queries | Templates include EXPLAIN QUERY PLAN examples |

---

## Token Efficiency

### Manual D1 Setup (Without Skill):
- Create database: 800 tokens
- Configure bindings: 600 tokens
- Write migrations: 1,200 tokens
- Implement queries: 2,000 tokens
- Add error handling: 800 tokens
- Create indexes: 600 tokens
- **Total: ~6,000 tokens**

### With cloudflare-d1 Skill:
- Reference skill templates: 1,500 tokens
- Customize for your use case: 1,000 tokens
- **Total: ~2,500 tokens**

**Savings: ~58% token reduction** (3,500 tokens saved)

---

## When to Use This Skill

### ✅ Use When:
- Building Cloudflare Workers that need relational data
- Storing user data, content, or application state
- Need SQL queries with JOINs and complex filtering
- Migrating from MySQL/PostgreSQL to edge database
- Building multi-tenant applications (per-user databases)
- Need ACID transactions and data consistency

### ❌ Don't Use When:
- Simple key-value storage needed → Use KV instead
- Large file/blob storage → Use R2 instead
- Real-time collaborative state → Use Durable Objects instead
- Need MySQL/PostgreSQL compatibility → Use Hyperdrive
- Embedding/vector search → Use Vectorize instead

---

## Quick Usage Example

```bash
# Create database
npx wrangler d1 create my-app-db

# Create migration
npx wrangler d1 migrations create my-app-db create_users_table

# Apply migration
npx wrangler d1 migrations apply my-app-db --local
```

```typescript
// Query from Worker
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind('user@example.com')
  .first();
```

---

## File Structure

```
~/.claude/skills/cloudflare-d1/
├── SKILL.md                        # Complete D1 documentation
├── README.md                       # This file (auto-trigger keywords)
├── templates/
│   ├── d1-setup-migration.sh      # Complete workflow script
│   ├── schema-example.sql         # Production-ready schema
│   └── d1-worker-queries.ts       # TypeScript query examples
└── reference/
    ├── query-patterns.md          # All D1 API methods
    └── best-practices.md          # Performance & security tips
```

---

## Dependencies

- **Required**: cloudflare-worker-base skill (for Worker setup)
- **CLI**: wrangler@4.43.0+
- **Types**: @cloudflare/workers-types@4.20251014.0+

---

## Related Skills

- `cloudflare-worker-base` - Base Worker + Hono setup
- `cloudflare-kv` - Key-value storage (simpler than D1)
- `cloudflare-r2` - Object storage for files
- `hono-routing` - Advanced Hono patterns

---

## Learn More

- **SKILL.md**: Complete D1 documentation with examples
- **templates/**: Working code templates for common patterns
- **reference/**: Deep-dive guides for query optimization

---

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Maintainer**: Jeremy Dawes (Jezweb)
