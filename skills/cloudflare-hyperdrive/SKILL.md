---
name: Cloudflare Hyperdrive
description: |
  Complete knowledge domain for Cloudflare Hyperdrive - connecting Cloudflare Workers to existing PostgreSQL and MySQL databases with global connection pooling, query caching, and reduced latency.

  Use when: connecting Workers to existing databases, migrating PostgreSQL/MySQL to Cloudflare, setting up connection pooling, configuring Hyperdrive bindings, using node-postgres/postgres.js/mysql2 drivers, integrating Drizzle ORM or Prisma ORM, or encountering "Failed to acquire a connection from the pool", "TLS not supported by the database", "connection refused", "nodejs_compat missing", "Code generation from strings disallowed", or Hyperdrive configuration errors.

  Keywords: hyperdrive, cloudflare hyperdrive, workers hyperdrive, postgres workers, mysql workers, connection pooling, query caching, node-postgres, pg, postgres.js, mysql2, drizzle hyperdrive, prisma hyperdrive, workers rds, workers aurora, workers neon, workers supabase, database acceleration, hybrid architecture, cloudflare tunnel database, wrangler hyperdrive, hyperdrive bindings, local development hyperdrive
license: MIT
---

# Cloudflare Hyperdrive

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Dependencies**: cloudflare-worker-base (recommended for Worker setup)
**Latest Versions**: wrangler@4.43.0+, pg@8.13.0+, postgres@3.4.5+, mysql2@3.13.0+

---

## Quick Start (5 Minutes)

### 1. Create Hyperdrive Configuration

```bash
# For PostgreSQL
npx wrangler hyperdrive create my-postgres-db \
  --connection-string="postgres://user:password@db-host.cloud:5432/database"

# For MySQL
npx wrangler hyperdrive create my-mysql-db \
  --connection-string="mysql://user:password@db-host.cloud:3306/database"

# Output:
# ✅ Successfully created Hyperdrive configuration
#
# [[hyperdrive]]
# binding = "HYPERDRIVE"
# id = "a76a99bc-7901-48c9-9c15-c4b11b559606"
```

**Save the `id` value** - you'll need it in the next step!

---

### 2. Configure Bindings in wrangler.jsonc

Add to your `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],  // REQUIRED for database drivers
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",                     // Available as env.HYPERDRIVE
      "id": "a76a99bc-7901-48c9-9c15-c4b11b559606"  // From wrangler hyperdrive create
    }
  ]
}
```

**CRITICAL:**
- `nodejs_compat` flag is **REQUIRED** for all database drivers
- `binding` is how you access Hyperdrive in code (`env.HYPERDRIVE`)
- `id` is the Hyperdrive configuration ID (NOT your database ID)

---

### 3. Install Database Driver

```bash
# For PostgreSQL (choose one)
npm install pg           # node-postgres (most common)
npm install postgres     # postgres.js (modern, minimum v3.4.5)

# For MySQL
npm install mysql2       # mysql2 (minimum v3.13.0)
```

---

### 4. Query Your Database

**PostgreSQL with node-postgres (pg):**
```typescript
import { Client } from "pg";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString
    });

    await client.connect();

    try {
      const result = await client.query('SELECT * FROM users LIMIT 10');
      return Response.json({ users: result.rows });
    } finally {
      // Clean up connection AFTER response is sent
      ctx.waitUntil(client.end());
    }
  }
};
```

**MySQL with mysql2:**
```typescript
import { createConnection } from "mysql2/promise";

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    const connection = await createConnection({
      host: env.HYPERDRIVE.host,
      user: env.HYPERDRIVE.user,
      password: env.HYPERDRIVE.password,
      database: env.HYPERDRIVE.database,
      port: env.HYPERDRIVE.port,
      disableEval: true  // REQUIRED for Workers (eval() not supported)
    });

    try {
      const [rows] = await connection.query('SELECT * FROM users LIMIT 10');
      return Response.json({ users: rows });
    } finally {
      ctx.waitUntil(connection.end());
    }
  }
};
```

---

### 5. Deploy

```bash
npx wrangler deploy
```

**That's it!** Your Worker now connects to your existing database via Hyperdrive with:
- ✅ Global connection pooling
- ✅ Automatic query caching
- ✅ Reduced latency (eliminates 7 round trips)

---

## How Hyperdrive Works

### The Problem
Connecting to traditional databases from Cloudflare's 300+ global locations presents challenges:

1. **High Latency** - Multiple round trips for each connection:
   - TCP handshake (1 round trip)
   - TLS negotiation (3 round trips)
   - Database authentication (3 round trips)
   - **Total: 7 round trips before you can even send a query**

2. **Connection Limits** - Traditional databases handle limited concurrent connections, easily exhausted by distributed traffic

### The Solution
Hyperdrive solves these problems by:

1. **Edge Connection Setup** - Connection handshake happens near your Worker (low latency)
2. **Connection Pooling** - Pool near your database reuses connections (eliminates round trips)
3. **Query Caching** - Popular queries cached at the edge (reduces database load)

**Result**: Single-region databases feel globally distributed.

---

## Complete Setup Process

### Step 1: Prerequisites

**You need:**
- Cloudflare account with Workers access
- Existing PostgreSQL (v9.0-17.x) or MySQL (v5.7-8.x) database
- Database accessible via:
  - **Public internet** (with TLS/SSL enabled), OR
  - **Private network** (via Cloudflare Tunnel)

**Important**: Hyperdrive **requires TLS/SSL**. Ensure your database has encryption enabled.

---

### Step 2: Create Hyperdrive Configuration

**Option A: Wrangler CLI** (Recommended)

```bash
# PostgreSQL connection string format:
# postgres://username:password@hostname:port/database_name

npx wrangler hyperdrive create my-hyperdrive \
  --connection-string="postgres://myuser:mypassword@db.example.com:5432/mydb"

# MySQL connection string format:
# mysql://username:password@hostname:port/database_name

npx wrangler hyperdrive create my-hyperdrive \
  --connection-string="mysql://myuser:mypassword@db.example.com:3306/mydb"
```

**Option B: Cloudflare Dashboard**

1. Go to [Hyperdrive Dashboard](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Click **Create Configuration**
3. Enter connection details:
   - Name: `my-hyperdrive`
   - Protocol: PostgreSQL or MySQL
   - Host: `db.example.com`
   - Port: `5432` (PostgreSQL) or `3306` (MySQL)
   - Database: `mydb`
   - Username: `myuser`
   - Password: `mypassword`
4. Click **Create**

**Connection String Formats:**

```bash
# PostgreSQL (standard)
postgres://user:password@host:5432/database

# PostgreSQL with SSL mode
postgres://user:password@host:5432/database?sslmode=require

# MySQL
mysql://user:password@host:3306/database

# With special characters in password (URL encode)
postgres://user:p%40ssw%24rd@host:5432/database  # p@ssw$rd
```

---

### Step 3: Configure Worker Bindings

Add Hyperdrive binding to `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<your-hyperdrive-id-here>"
    }
  ]
}
```

**Multiple Hyperdrive configs:**
```jsonc
{
  "hyperdrive": [
    {
      "binding": "POSTGRES_DB",
      "id": "postgres-hyperdrive-id"
    },
    {
      "binding": "MYSQL_DB",
      "id": "mysql-hyperdrive-id"
    }
  ]
}
```

**Access in Worker:**
```typescript
type Bindings = {
  POSTGRES_DB: Hyperdrive;
  MYSQL_DB: Hyperdrive;
};

export default {
  async fetch(request, env: Bindings, ctx) {
    // Access different databases
    const pgClient = new Client({ connectionString: env.POSTGRES_DB.connectionString });
    const mysqlConn = await createConnection({ host: env.MYSQL_DB.host, ... });
  }
};
```

---

### Step 4: Install Database Driver

**PostgreSQL Drivers:**

```bash
# Option 1: node-postgres (pg) - Most popular
npm install pg
npm install @types/pg  # TypeScript types

# Option 2: postgres.js - Modern, faster (minimum v3.4.5)
npm install postgres@^3.4.5
```

**MySQL Drivers:**

```bash
# mysql2 (minimum v3.13.0)
npm install mysql2
```

**Driver Comparison:**

| Driver | Database | Pros | Cons | Min Version |
|--------|----------|------|------|-------------|
| **pg** | PostgreSQL | Most popular, stable, well-documented | Slightly slower than postgres.js | 8.13.0+ |
| **postgres** | PostgreSQL | Faster, modern API, streaming support | Newer (less community examples) | 3.4.5+ |
| **mysql2** | MySQL | Promises, prepared statements, fast | Requires `disableEval: true` for Workers | 3.13.0+ |

---

### Step 5: Use Driver in Worker

**PostgreSQL with pg (Client):**

```typescript
import { Client } from "pg";

export default {
  async fetch(request: Request, env: { HYPERDRIVE: Hyperdrive }, ctx: ExecutionContext) {
    // Create client for this request
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString
    });

    await client.connect();

    try {
      // Run query
      const result = await client.query('SELECT $1::text as message', ['Hello from Hyperdrive!']);
      return Response.json(result.rows);
    } catch (error) {
      return new Response(`Database error: ${error.message}`, { status: 500 });
    } finally {
      // CRITICAL: Clean up connection after response
      ctx.waitUntil(client.end());
    }
  }
};
```

**PostgreSQL with pg (Pool for parallel queries):**

```typescript
import { Pool } from "pg";

export default {
  async fetch(request: Request, env: { HYPERDRIVE: Hyperdrive }, ctx: ExecutionContext) {
    // Create pool (max 5 to stay within Workers' 6 connection limit)
    const pool = new Pool({
      connectionString: env.HYPERDRIVE.connectionString,
      max: 5  // CRITICAL: Workers limit is 6 concurrent external connections
    });

    try {
      // Run parallel queries
      const [users, posts] = await Promise.all([
        pool.query('SELECT * FROM users LIMIT 10'),
        pool.query('SELECT * FROM posts LIMIT 10')
      ]);

      return Response.json({
        users: users.rows,
        posts: posts.rows
      });
    } finally {
      ctx.waitUntil(pool.end());
    }
  }
};
```

**PostgreSQL with postgres.js:**

```typescript
import postgres from "postgres";

export default {
  async fetch(request: Request, env: { HYPERDRIVE: Hyperdrive }, ctx: ExecutionContext) {
    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,              // Max 5 connections (Workers limit: 6)
      fetch_types: false,  // Disable if not using array types (reduces latency)
      prepare: true        // CRITICAL: Enable prepared statements for caching
    });

    try {
      const users = await sql`SELECT * FROM users LIMIT 10`;
      return Response.json({ users });
    } finally {
      ctx.waitUntil(sql.end({ timeout: 5 }));
    }
  }
};
```

**MySQL with mysql2:**

```typescript
import { createConnection } from "mysql2/promise";

export default {
  async fetch(request: Request, env: { HYPERDRIVE: Hyperdrive }, ctx: ExecutionContext) {
    const connection = await createConnection({
      host: env.HYPERDRIVE.host,
      user: env.HYPERDRIVE.user,
      password: env.HYPERDRIVE.password,
      database: env.HYPERDRIVE.database,
      port: env.HYPERDRIVE.port,
      disableEval: true  // REQUIRED: eval() not supported in Workers
    });

    try {
      const [rows] = await connection.query('SELECT * FROM users LIMIT 10');
      return Response.json({ users: rows });
    } finally {
      ctx.waitUntil(connection.end());
    }
  }
};
```

---

## Connection Patterns

### Pattern 1: Single Connection (pg.Client)

**When to use**: Simple queries, single query per request

```typescript
import { Client } from "pg";

const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
await client.connect();
const result = await client.query('SELECT ...');
ctx.waitUntil(client.end());
```

**Pros**: Simple, straightforward
**Cons**: Can't run parallel queries

---

### Pattern 2: Connection Pool (pg.Pool)

**When to use**: Multiple parallel queries in single request

```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: env.HYPERDRIVE.connectionString,
  max: 5  // CRITICAL: Stay within Workers' 6 connection limit
});

const [result1, result2] = await Promise.all([
  pool.query('SELECT ...'),
  pool.query('SELECT ...')
]);

ctx.waitUntil(pool.end());
```

**Pros**: Parallel queries, better performance
**Cons**: Must manage max connections

---

### Pattern 3: Connection Cleanup

**CRITICAL**: Always use `ctx.waitUntil()` to clean up connections AFTER response is sent:

```typescript
export default {
  async fetch(request, env, ctx) {
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await client.connect();

    try {
      const result = await client.query('SELECT ...');
      return Response.json(result.rows);  // Response sent here
    } finally {
      // This runs AFTER response is sent (non-blocking)
      ctx.waitUntil(client.end());
    }
  }
};
```

**Why `ctx.waitUntil()`?**
- Allows Worker to return response immediately
- Connection cleanup happens in background
- Prevents connection leaks

**DON'T do this:**
```typescript
await client.end();  // ❌ Blocks response, adds latency
```

---

## ORM Integration

### Drizzle ORM (PostgreSQL)

**1. Install dependencies:**
```bash
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit
```

**2. Define schema (`src/db/schema.ts`):**
```typescript
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**3. Use in Worker:**
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./db/schema";

export default {
  async fetch(request, env: { HYPERDRIVE: Hyperdrive }, ctx) {
    const sql = postgres(env.HYPERDRIVE.connectionString, { max: 5 });
    const db = drizzle(sql);

    const allUsers = await db.select().from(users);

    ctx.waitUntil(sql.end());
    return Response.json({ users: allUsers });
  }
};
```

---

### Prisma ORM (PostgreSQL)

**1. Install dependencies:**
```bash
npm install prisma @prisma/client
npm install pg @prisma/adapter-pg
```

**2. Initialize Prisma:**
```bash
npx prisma init
```

**3. Define schema (`prisma/schema.prisma`):**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}
```

**4. Generate Prisma Client:**
```bash
npx prisma generate --no-engine
```

**5. Use in Worker:**
```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

export default {
  async fetch(request, env: { HYPERDRIVE: Hyperdrive }, ctx) {
    // Create driver adapter with Hyperdrive connection
    const pool = new Pool({ connectionString: env.HYPERDRIVE.connectionString, max: 5 });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const users = await prisma.user.findMany();

    ctx.waitUntil(pool.end());
    return Response.json({ users });
  }
};
```

**IMPORTANT**: Prisma requires driver adapters (`@prisma/adapter-pg`) to work with Hyperdrive.

---

## Local Development

### Option 1: Environment Variable (Recommended)

Set `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING>` environment variable:

```bash
# If your binding is named "HYPERDRIVE"
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://user:password@localhost:5432/local_db"

# Start local dev server
npx wrangler dev
```

**Benefits:**
- No credentials in wrangler.jsonc
- Safe to commit configuration files
- Different devs can use different local databases

---

### Option 2: localConnectionString in wrangler.jsonc

```jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "production-hyperdrive-id",
      "localConnectionString": "postgres://user:password@localhost:5432/local_db"
    }
  ]
}
```

**Caution**: Don't commit real credentials to version control!

---

### Option 3: Remote Development

Connect to production database during local development:

```bash
npx wrangler dev --remote
```

**Warning**: This uses your PRODUCTION database. Changes cannot be undone!

---

## Query Caching

### What Gets Cached

Hyperdrive automatically caches **non-mutating queries** (read-only):

```sql
-- ✅ Cached
SELECT * FROM articles WHERE published = true ORDER BY date DESC LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT * FROM products WHERE category = 'electronics';

-- ❌ NOT Cached
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
UPDATE posts SET published = true WHERE id = 123;
DELETE FROM sessions WHERE expired = true;
SELECT LASTVAL();  -- PostgreSQL volatile function
SELECT LAST_INSERT_ID();  -- MySQL volatile function
```

### How It Works

1. **Wire Protocol Parsing**: Hyperdrive parses database protocol to differentiate mutations
2. **Automatic Detection**: No configuration needed
3. **Edge Caching**: Cached at Cloudflare's edge (near users)
4. **Cache Invalidation**: Writes invalidate relevant cached queries

### Caching Optimization

**postgres.js - Enable prepared statements:**
```typescript
const sql = postgres(env.HYPERDRIVE.connectionString, {
  prepare: true  // CRITICAL for caching
});
```

**Without `prepare: true`, queries are NOT cacheable!**

### Cache Status

Check if query was cached:

```typescript
const response = await fetch('https://your-worker.dev/api/users');
const cacheStatus = response.headers.get('cf-cache-status');
// Values: HIT, MISS, BYPASS, EXPIRED
```

---

## TLS/SSL Configuration

### SSL Modes

Hyperdrive supports 3 TLS/SSL modes:

1. **`require`** (default) - TLS required, basic certificate validation
2. **`verify-ca`** - Verify server certificate signed by expected CA
3. **`verify-full`** - Verify CA + hostname matches certificate SAN

### Server Certificates (verify-ca / verify-full)

**1. Upload CA certificate:**
```bash
npx wrangler cert upload certificate-authority \
  --ca-cert root-ca.pem \
  --name my-ca-cert
```

**2. Create Hyperdrive with CA:**
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://..." \
  --ca-certificate-id <CA_CERT_ID> \
  --sslmode verify-full
```

### Client Certificates (mTLS)

For databases requiring client authentication:

**1. Upload client certificate + key:**
```bash
npx wrangler cert upload mtls-certificate \
  --cert client-cert.pem \
  --key client-key.pem \
  --name my-client-cert
```

**2. Create Hyperdrive with client cert:**
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://..." \
  --mtls-certificate-id <CERT_PAIR_ID>
```

---

## Private Database Access (Cloudflare Tunnel)

Connect Hyperdrive to databases in private networks (VPCs, on-premises):

**1. Install cloudflared:**
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
```

**2. Create tunnel:**
```bash
cloudflared tunnel create my-db-tunnel
```

**3. Configure tunnel (`config.yml`):**
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /path/to/credentials.json

ingress:
  - hostname: db.example.com
    service: tcp://localhost:5432  # Your private database
  - service: http_status:404
```

**4. Run tunnel:**
```bash
cloudflared tunnel run my-db-tunnel
```

**5. Create Hyperdrive:**
```bash
npx wrangler hyperdrive create my-private-db \
  --connection-string="postgres://user:password@db.example.com:5432/database"
```

---

## Critical Rules

### Always Do

✅ Include `nodejs_compat` in `compatibility_flags`
✅ Use `ctx.waitUntil(client.end())` for connection cleanup
✅ Set `max: 5` for connection pools (Workers limit: 6)
✅ Enable TLS/SSL on your database (Hyperdrive requires it)
✅ Use prepared statements for caching (postgres.js: `prepare: true`)
✅ Set `disableEval: true` for mysql2 driver
✅ Handle errors gracefully with try/catch
✅ Use environment variables for local development connection strings
✅ Test locally with `wrangler dev` before deploying

### Never Do

❌ Skip `nodejs_compat` flag (causes "No such module" errors)
❌ Use private IP addresses directly (use Cloudflare Tunnel instead)
❌ Use `await client.end()` (blocks response, use `ctx.waitUntil()`)
❌ Set connection pool max > 5 (exceeds Workers' 6 connection limit)
❌ Wrap all queries in transactions (limits connection multiplexing)
❌ Use SQL-level PREPARE/EXECUTE/DEALLOCATE (unsupported)
❌ Use advisory locks, LISTEN/NOTIFY (PostgreSQL unsupported features)
❌ Use multi-statement queries in MySQL (unsupported)
❌ Commit database credentials to version control

---

## Wrangler Commands Reference

```bash
# Create Hyperdrive configuration
wrangler hyperdrive create <name> --connection-string="postgres://..."

# List all Hyperdrive configurations
wrangler hyperdrive list

# Get details of a configuration
wrangler hyperdrive get <hyperdrive-id>

# Update connection string
wrangler hyperdrive update <hyperdrive-id> --connection-string="postgres://..."

# Delete configuration
wrangler hyperdrive delete <hyperdrive-id>

# Upload CA certificate
wrangler cert upload certificate-authority --ca-cert <file>.pem --name <name>

# Upload client certificate pair
wrangler cert upload mtls-certificate --cert <cert>.pem --key <key>.pem --name <name>
```

---

## Supported Databases

### PostgreSQL (v9.0 - 17.x)
- ✅ AWS RDS / Aurora
- ✅ Google Cloud SQL
- ✅ Azure Database for PostgreSQL
- ✅ Neon
- ✅ Supabase
- ✅ PlanetScale (PostgreSQL)
- ✅ Timescale
- ✅ CockroachDB
- ✅ Materialize
- ✅ Fly.io
- ✅ pgEdge Cloud
- ✅ Prisma Postgres

### MySQL (v5.7 - 8.x)
- ✅ AWS RDS / Aurora
- ✅ Google Cloud SQL
- ✅ Azure Database for MySQL
- ✅ PlanetScale (MySQL)

### NOT Supported
- ❌ SQL Server
- ❌ MongoDB (NoSQL)
- ❌ Oracle Database

---

## Unsupported Features

### PostgreSQL
- SQL-level prepared statements (`PREPARE`, `EXECUTE`, `DEALLOCATE`)
- Advisory locks
- `LISTEN` and `NOTIFY`
- Per-session state modifications

### MySQL
- Non-UTF8 characters in queries
- `USE` statements
- Multi-statement queries
- Protocol-level prepared statements (`COM_STMT_PREPARE`)
- `COM_INIT_DB` messages
- Auth plugins other than `caching_sha2_password` or `mysql_native_password`

**Workaround**: For unsupported features, create a second direct client connection (without Hyperdrive).

---

## Performance Best Practices

1. **Avoid long-running transactions** - Limits connection multiplexing
2. **Use prepared statements** - Enables query caching (postgres.js: `prepare: true`)
3. **Set max: 5 for pools** - Stays within Workers' 6 connection limit
4. **Disable fetch_types if not needed** - Reduces latency (postgres.js)
5. **Use ctx.waitUntil() for cleanup** - Non-blocking connection close
6. **Cache-friendly queries** - Prefer SELECT over complex joins
7. **Index frequently queried columns** - Improves query performance
8. **Monitor with Hyperdrive analytics** - Track cache hit ratios and latency

---

## Troubleshooting

See `references/troubleshooting.md` for complete error reference with solutions.

**Quick fixes:**

| Error | Solution |
|-------|----------|
| "No such module 'node:*'" | Add `nodejs_compat` to compatibility_flags |
| "TLS not supported by database" | Enable SSL/TLS on your database |
| "Connection refused" | Check firewall rules, allow public internet or use Tunnel |
| "Failed to acquire connection" | Use `ctx.waitUntil()` for cleanup, avoid long transactions |
| "Code generation from strings disallowed" | Set `disableEval: true` in mysql2 config |
| "Bad hostname" | Verify DNS resolves, check for typos |
| "Invalid database credentials" | Check username/password (case-sensitive) |

---

## Metrics and Analytics

View Hyperdrive metrics in the dashboard:

1. Go to [Hyperdrive Dashboard](https://dash.cloudflare.com/?to=/:account/workers/hyperdrive)
2. Select your configuration
3. Click **Metrics** tab

**Available Metrics:**
- Query count
- Cache hit ratio (hit vs miss)
- Query latency (p50, p95, p99)
- Connection latency
- Query bytes / result bytes
- Error rate

---

## Migration Strategies

### From Direct Database Connection

**Before (direct connection):**
```typescript
const client = new Client({
  host: 'db.example.com',
  user: 'myuser',
  password: 'mypassword',
  database: 'mydb',
  port: 5432
});
```

**After (with Hyperdrive):**
```typescript
const client = new Client({
  connectionString: env.HYPERDRIVE.connectionString
});
```

**Benefits:**
- ✅ 7 round trips eliminated
- ✅ Query caching enabled
- ✅ Connection pooling automatic
- ✅ Global performance boost

---

### From D1 to Hyperdrive

**When to migrate:**
- Need PostgreSQL/MySQL features (JSON types, full-text search, etc.)
- Existing database with data
- Multi-region read replicas
- Advanced indexing strategies

**Keep D1 if:**
- Building new Cloudflare-native app
- SQLite features sufficient
- No existing database to migrate
- Want simpler serverless setup

---

## Credential Rotation

**Option 1: Create new Hyperdrive config**
```bash
# Create new config with new credentials
wrangler hyperdrive create my-db-v2 --connection-string="postgres://..."

# Update wrangler.jsonc to use new ID
# Deploy gradually (no downtime)
# Delete old config when migration complete
```

**Option 2: Update existing config**
```bash
wrangler hyperdrive update <id> --connection-string="postgres://new-credentials@..."
```

**Best practice**: Use separate Hyperdrive configs for staging and production.

---

## Examples

See `templates/` directory for complete working examples:

- `postgres-basic.ts` - Simple query with pg.Client
- `postgres-pool.ts` - Parallel queries with pg.Pool
- `postgres-js.ts` - Using postgres.js driver
- `mysql2-basic.ts` - MySQL with mysql2 driver
- `drizzle-postgres.ts` - Drizzle ORM integration
- `drizzle-mysql.ts` - Drizzle ORM with MySQL
- `prisma-postgres.ts` - Prisma ORM integration

---

## References

- [Official Documentation](https://developers.cloudflare.com/hyperdrive/)
- [Get Started Guide](https://developers.cloudflare.com/hyperdrive/get-started/)
- [How Hyperdrive Works](https://developers.cloudflare.com/hyperdrive/configuration/how-hyperdrive-works/)
- [Query Caching](https://developers.cloudflare.com/hyperdrive/configuration/query-caching/)
- [Local Development](https://developers.cloudflare.com/hyperdrive/configuration/local-development/)
- [TLS/SSL Certificates](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/)
- [Troubleshooting Guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)
- [Wrangler Commands](https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/)
- [Supported Databases](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)

---

**Last Updated**: 2025-10-22
**Package Versions**: wrangler@4.43.0+, pg@8.13.0+, postgres@3.4.5+, mysql2@3.13.0+
**Production Tested**: Based on official Cloudflare documentation and community examples
