# Supported Databases and Providers

Complete list of databases and providers compatible with Cloudflare Hyperdrive.

---

## Database Engine Support

| Engine | Supported | Versions | Notes |
|--------|-----------|----------|-------|
| **PostgreSQL** | ✅ Yes | 9.0 - 17.x | Both self-hosted and managed |
| **MySQL** | ✅ Yes | 5.7 - 8.x | Both self-hosted and managed, MariaDB included |
| **SQL Server** | ❌ No | - | Not currently supported |
| **MongoDB** | ❌ No | - | NoSQL not supported (use Atlas Data API) |
| **Oracle** | ❌ No | - | Not currently supported |

---

## PostgreSQL-Compatible Databases

### AWS RDS / Aurora PostgreSQL

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create aws-postgres \
  --connection-string="postgres://admin:password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/postgres"
```

**SSL**: Enabled by default on RDS

**Guide**: [AWS RDS Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/aws-rds-aurora/)

---

### Google Cloud SQL (PostgreSQL)

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create gcp-postgres \
  --connection-string="postgres://postgres:password@34.123.45.67:5432/mydb"
```

**Public IP**: Must enable public IP in Cloud SQL settings

**Guide**: [Google Cloud SQL Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/google-cloud-sql/)

---

### Azure Database for PostgreSQL

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create azure-postgres \
  --connection-string="postgres://myuser@myserver:password@myserver.postgres.database.azure.com:5432/mydb"
```

**Firewall**: Add Cloudflare IP ranges or allow all public IPs

**Guide**: [Azure PostgreSQL Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/azure/)

---

### Neon

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create neon-db \
  --connection-string="postgres://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech:5432/neondb"
```

**Driver**: Use `pg` or `postgres.js` (NOT @neondatabase/serverless driver)

**Guide**: [Neon Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/)

---

### Supabase

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create supabase-db \
  --connection-string="postgres://postgres:password@db.abc123xyz.supabase.co:5432/postgres"
```

**Connection String**: Get from Supabase Dashboard → Settings → Database → Connection string (Direct connection)

**Guide**: [Supabase Guide](https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/)

---

### PlanetScale (PostgreSQL)

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create planetscale-postgres \
  --connection-string="postgres://user:password@aws.connect.psdb.cloud:3306/mydb"
```

**Driver**: Use `pg` or `postgres.js` (NOT PlanetScale serverless driver)

**Guide**: [PlanetScale Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/planetscale-postgres/)

---

### Timescale

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create timescale-db \
  --connection-string="postgres://tsdbadmin:password@abc123xyz.tsdb.cloud.timescale.com:5432/tsdb"
```

**Guide**: [Timescale Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/timescale/)

---

### CockroachDB

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create cockroach-db \
  --connection-string="postgres://user:password@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/defaultdb"
```

**Notes**: PostgreSQL-compatible, uses port 26257

**Guide**: [CockroachDB Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/cockroachdb/)

---

### Materialize

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create materialize-db \
  --connection-string="postgres://user@materialize.example.com:6875/materialize"
```

**Guide**: [Materialize Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/materialize/)

---

### Fly.io PostgreSQL

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create fly-postgres \
  --connection-string="postgres://postgres:password@my-app-db.fly.dev:5432/postgres"
```

**Guide**: [Fly.io Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/fly/)

---

### pgEdge Cloud

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create pgedge-db \
  --connection-string="postgres://user:password@db.pgedge.io:5432/mydb"
```

**Guide**: [pgEdge Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/pgedge/)

---

### Prisma Postgres

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create prisma-postgres \
  --connection-string="postgres://user:password@db.prisma.io:5432/mydb"
```

**Guide**: [Prisma Postgres Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/prisma-postgres/)

---

## MySQL-Compatible Databases

### AWS RDS / Aurora MySQL

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create aws-mysql \
  --connection-string="mysql://admin:password@mydb.abc123.us-east-1.rds.amazonaws.com:3306/mydb"
```

**Guide**: [AWS RDS MySQL Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-database-providers/aws-rds-aurora/)

---

### Google Cloud SQL (MySQL)

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create gcp-mysql \
  --connection-string="mysql://root:password@34.123.45.67:3306/mydb"
```

**Guide**: [Google Cloud SQL MySQL Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/)

---

### Azure Database for MySQL

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create azure-mysql \
  --connection-string="mysql://myuser@myserver:password@myserver.mysql.database.azure.com:3306/mydb"
```

**Guide**: [Azure MySQL Guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-database-providers/azure/)

---

### PlanetScale (MySQL)

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create planetscale-mysql \
  --connection-string="mysql://user:password@aws.connect.psdb.cloud:3306/mydb"
```

**Driver**: Use `mysql2` (NOT PlanetScale serverless driver)

---

### MariaDB

**Status**: ✅ Fully Supported

**Connection Example**:
```bash
npx wrangler hyperdrive create mariadb \
  --connection-string="mysql://user:password@mariadb-host:3306/mydb"
```

**Notes**: MariaDB uses MySQL protocol, fully compatible

---

## Self-Hosted Databases

### Self-Hosted PostgreSQL

**Status**: ✅ Fully Supported

**Requirements**:
- PostgreSQL 9.0+
- SSL/TLS enabled
- Public IP address (or use Cloudflare Tunnel for private)
- Firewall configured to allow public connections

**postgresql.conf**:
```conf
listen_addresses = '*'
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

**pg_hba.conf**:
```conf
# Allow connections from anywhere with SSL
hostssl all all 0.0.0.0/0 md5
```

---

### Self-Hosted MySQL

**Status**: ✅ Fully Supported

**Requirements**:
- MySQL 5.7+
- SSL/TLS enabled
- Public IP address (or use Cloudflare Tunnel)
- Firewall configured

**my.cnf**:
```conf
[mysqld]
bind-address = 0.0.0.0
require_secure_transport = ON
ssl-ca = ca-cert.pem
ssl-cert = server-cert.pem
ssl-key = server-key.pem
```

---

## Private Database Access

### Cloudflare Tunnel

For databases in private networks (VPCs, on-premises):

**Supported**:
- Private AWS VPCs
- Google Cloud private networks
- Azure VNets
- On-premises databases
- Any database behind firewall

**Setup**:
1. Install cloudflared
2. Create tunnel to database
3. Configure Hyperdrive with tunnel hostname

**Guide**: [Cloudflare Tunnel Guide](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/)

---

## Connection Requirements

### All Databases MUST Have

✅ **TLS/SSL enabled** - Hyperdrive requires encryption
✅ **Accessible endpoint** - Public IP or via Cloudflare Tunnel
✅ **User permissions** - User must have read/write permissions
✅ **Correct credentials** - Valid username/password
✅ **Firewall configured** - Allow connections from internet or tunnel

### All Databases CANNOT Have

❌ **Private IP only** (10.x.x.x, 192.168.x.x) - Use Tunnel instead
❌ **SSL disabled** - Hyperdrive requires TLS
❌ **Restrictive firewall** - Must allow Cloudflare connections
❌ **Invalid credentials** - Connection will fail during setup

---

## Unsupported Databases

| Database | Status | Alternative |
|----------|--------|-------------|
| **MongoDB** | ❌ Not Supported | Use MongoDB Atlas Data API or Realm |
| **SQL Server** | ❌ Not Supported | Use Azure SQL Edge (Linux) or wait for support |
| **Oracle Database** | ❌ Not Supported | No current alternative |
| **SQLite** | ❌ Not Needed | Use Cloudflare D1 (serverless SQLite) |
| **Redis** | ❌ Not Supported | Use Upstash Redis or Cloudflare KV |
| **DynamoDB** | ❌ Not Supported | Use AWS SDK directly or Cloudflare KV |
| **Cassandra** | ❌ Not Supported | Use DataStax Astra DB API |

---

## Choosing a Database Provider

### For New Projects

**Recommended**:
1. **Neon** - Serverless PostgreSQL, generous free tier
2. **Supabase** - PostgreSQL + Auth + Storage
3. **PlanetScale** - MySQL, branching workflow
4. **Cloudflare D1** - If you don't need PostgreSQL/MySQL features

### For Existing Apps

Use Hyperdrive with your current provider:
- AWS RDS/Aurora
- Google Cloud SQL
- Azure Database

### For Self-Hosted

Use Cloudflare Tunnel for secure private access.

---

## Performance Comparison

| Provider | Connection Latency | Query Latency | Caching |
|----------|-------------------|---------------|---------|
| **Neon** (US-East) | ~5ms | ~10-20ms | ✅ Yes |
| **Supabase** (US-East) | ~5ms | ~10-20ms | ✅ Yes |
| **AWS RDS** (US-East) | ~5ms | ~15-25ms | ✅ Yes |
| **Self-Hosted** (EU) | ~50ms | ~60-80ms | ✅ Yes |

**Note**: Hyperdrive adds minimal latency (~5ms) but eliminates 7 round trips, resulting in net performance gain.

---

## References

- [Supported Databases Docs](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)
- [PostgreSQL Examples](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/)
- [MySQL Examples](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/)
- [Private Database Guide](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/)
