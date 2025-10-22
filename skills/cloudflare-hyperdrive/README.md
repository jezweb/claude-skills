# Cloudflare Hyperdrive

Complete knowledge domain for Cloudflare Hyperdrive - Connect Cloudflare Workers to existing PostgreSQL and MySQL databases with global connection pooling, query caching, and reduced latency.

---

## Auto-Trigger Keywords

### Primary Keywords
- hyperdrive
- cloudflare hyperdrive
- workers hyperdrive
- postgres workers
- postgresql workers
- mysql workers
- hyperdrive bindings
- wrangler hyperdrive
- connection pooling cloudflare
- workers database connection
- database acceleration workers

### Secondary Keywords
- node-postgres hyperdrive
- pg hyperdrive
- postgres.js workers
- mysql2 workers
- drizzle hyperdrive
- drizzle orm hyperdrive
- prisma hyperdrive
- prisma orm workers
- query caching cloudflare
- hyperdrive configuration
- workers rds
- workers aurora
- workers neon
- workers supabase
- workers planetscale
- existing database workers
- migrate database to cloudflare
- hybrid architecture workers

### Error-Based Keywords
- Failed to acquire a connection from the pool
- TLS not supported by the database
- connection refused hyperdrive
- nodejs_compat missing
- disableEval mysql2
- Code generation from strings disallowed
- Uncaught Error: No such module "node:
- Bad hostname hyperdrive
- Invalid database credentials hyperdrive
- Server connection attempt failed
- TLS handshake failed

### Framework Integration Keywords
- hono hyperdrive
- express workers hyperdrive
- workers ai database
- vectorize hyperdrive
- d1 vs hyperdrive
- hyperdrive local development
- wrangler dev hyperdrive
- cloudflare tunnel database

---

## What This Skill Does

This skill provides complete Hyperdrive knowledge including:

- ✅ **Connection Pooling** - Eliminates 7 round trips (TCP handshake + TLS negotiation + authentication)
- ✅ **Query Caching** - Automatic caching of read queries at the edge
- ✅ **Global Acceleration** - Makes single-region databases feel globally distributed
- ✅ **PostgreSQL Support** - All versions 9.0-17.x (RDS, Aurora, Neon, Supabase, etc.)
- ✅ **MySQL Support** - All versions 5.7-8.x (RDS, Aurora, PlanetScale, etc.)
- ✅ **Driver Integration** - node-postgres (pg), postgres.js, mysql2
- ✅ **ORM Support** - Drizzle ORM and Prisma ORM patterns
- ✅ **Local Development** - Full local dev workflow with wrangler
- ✅ **TLS/SSL Configuration** - Server certificates, client certificates, mTLS
- ✅ **Private Database Access** - Connect via Cloudflare Tunnel

---

## Known Issues Prevented

| Issue | Description | Prevention |
|-------|-------------|------------|
| **"nodejs_compat" flag missing** | Worker crashes with "No such module" error | Always include nodejs_compat in compatibility_flags |
| **TLS not supported error (2012)** | Database doesn't have SSL enabled | Ensure database has TLS/SSL enabled before creating Hyperdrive config |
| **Connection refused (2011)** | Firewall blocking Hyperdrive | Allow public internet connections or use Cloudflare Tunnel |
| **Failed to acquire connection** | Connection pool exhausted | Use ctx.waitUntil() for cleanup, avoid long-running transactions |
| **mysql2 eval() error** | mysql2 uses eval() which is blocked | Set disableEval: true in mysql2 connection config |
| **Connection limit exceeded** | Workers limit: 6 concurrent connections | Set max: 5 for pg.Pool to stay within limits |
| **Queries not cached** | postgres.js configured with prepare: false | Enable prepared statements with prepare: true |
| **Invalid credentials (2013)** | Username or password incorrect | Verify credentials are correct (case-sensitive password) |
| **Private IP not supported (2009)** | Trying to connect to 192.168.x.x or 10.x.x.x | Use Cloudflare Tunnel for private database access |
| **Database doesn't exist (2014)** | Wrong database name in connection string | Verify database (not table) name exists |

---

## Quick Example

```typescript
import { Client } from "pg";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    // Connect to PostgreSQL via Hyperdrive
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString
    });

    await client.connect();

    try {
      // Query your database
      const result = await client.query('SELECT * FROM users LIMIT 10');

      return Response.json({
        users: result.rows,
        // Hyperdrive metadata
        origin: env.HYPERDRIVE.host,
        cacheStatus: request.cf?.cacheStatus
      });
    } finally {
      // Clean up connection after response is sent
      ctx.waitUntil(client.end());
    }
  }
};
```

**wrangler.jsonc:**
```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<your-hyperdrive-id>"
    }
  ]
}
```

**Create Hyperdrive config:**
```bash
npx wrangler hyperdrive create my-database \
  --connection-string="postgres://user:password@host:5432/database"
```

---

## Token Efficiency

**Without this skill:**
- 15-20 searches for connection pooling patterns
- 10+ lookups for driver configuration
- 8-12 troubleshooting attempts for common errors
- ~12,000 tokens of repetitive research

**With this skill:**
- 1 skill invocation with complete knowledge
- ~5,000 tokens of focused, production-ready patterns
- **~58% token savings**

---

## Coverage

### Database Providers
**PostgreSQL**: AWS RDS/Aurora, Google Cloud SQL, Azure Database, Neon, Supabase, PlanetScale, Timescale, CockroachDB, Materialize, Fly.io, pgEdge, Prisma Postgres

**MySQL**: AWS RDS/Aurora, Google Cloud SQL, Azure Database, PlanetScale

### Drivers
- **PostgreSQL**: node-postgres (pg), postgres.js (v3.4.5+)
- **MySQL**: mysql2 (v3.13.0+), mysql (legacy)

### ORMs
- **Drizzle ORM**: PostgreSQL & MySQL support
- **Prisma ORM**: PostgreSQL with driver adapters

### Patterns
- Single connection per request (pg.Client)
- Connection pooling for parallel queries (pg.Pool, max: 5)
- Query caching optimization
- Local development setup
- TLS/SSL certificate configuration
- Error handling and retry strategies
- Connection cleanup with ctx.waitUntil()

### Production Topics
- Connection limits (Workers: 6 concurrent, use max: 5 for pools)
- Query caching behavior (SELECT cached, INSERT/UPDATE not cached)
- Transaction impact on connection multiplexing
- Unsupported features (PREPARE/EXECUTE, advisory locks, LISTEN/NOTIFY)
- Credential rotation strategies
- Metrics and analytics

---

## When to Use This Skill

Use this skill when you see keywords like:
- "connect Workers to existing database"
- "migrate PostgreSQL to Cloudflare"
- "Workers with RDS/Aurora/Neon/Supabase"
- "connection pooling for Workers"
- "query caching for database"
- "Hyperdrive configuration error"
- "Failed to acquire connection from pool"
- "TLS not supported by database"
- "Drizzle ORM with Workers"
- "Prisma ORM with Cloudflare"

---

## When NOT to Use This Skill

- **New Cloudflare-native apps** → Use D1 (serverless SQLite) instead
- **Key-value storage** → Use Workers KV
- **Document storage** → Use R2 or Durable Objects
- **NoSQL databases** → Hyperdrive doesn't support MongoDB (use Atlas Data API or Realm)
- **SQL Server** → Not currently supported by Hyperdrive

---

## References

- [Hyperdrive Documentation](https://developers.cloudflare.com/hyperdrive/)
- [Get Started Guide](https://developers.cloudflare.com/hyperdrive/get-started/)
- [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/)
- [Supported Databases](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)
- [Troubleshooting Guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)
- [Query Caching](https://developers.cloudflare.com/hyperdrive/configuration/query-caching/)
- [Wrangler Commands](https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/)
