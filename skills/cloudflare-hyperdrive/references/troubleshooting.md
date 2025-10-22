# Hyperdrive Troubleshooting Guide

Complete error reference with solutions for Cloudflare Hyperdrive.

---

## Configuration Errors

These errors occur when creating or updating a Hyperdrive configuration.

### Error 2008: Bad hostname

**Error Message**: `Bad hostname`

**Cause**: Hyperdrive could not resolve the database hostname via DNS.

**Solutions**:
1. Verify hostname exists in public DNS: `nslookup db.example.com`
2. Check for typos in hostname
3. Ensure hostname is publicly resolvable (not internal-only DNS)
4. For private databases, use Cloudflare Tunnel

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2009: Private IP address not supported

**Error Message**: `The hostname does not resolve to a public IP address, or the IP address is not a public address`

**Cause**: Hyperdrive cannot connect to private IP addresses (10.x.x.x, 192.168.x.x, 172.16.x.x).

**Solutions**:
1. Use Cloudflare Tunnel for private database access
2. Expose database with public IP (ensure firewall configured)
3. Use cloud provider's public endpoint (e.g., AWS RDS public endpoint)

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2010: Cannot connect to host:port

**Error Message**: `Cannot connect to the host:port`

**Cause**: Hyperdrive could not route to the hostname/port.

**Solutions**:
1. Verify hostname has public DNS record
2. Check port is correct (5432 for PostgreSQL, 3306 for MySQL)
3. Ensure hostname resolves to public IP address
4. Check for typos in hostname

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2011: Connection refused

**Error Message**: `Connection refused`

**Cause**: A network firewall or access control list (ACL) is rejecting requests from Hyperdrive.

**Solutions**:
1. Allow connections from the public internet in database firewall
2. Check cloud provider security groups (AWS, GCP, Azure)
3. Verify database is listening on correct IP/port
4. For private databases, use Cloudflare Tunnel

**Example - AWS RDS Security Group**:
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: 0.0.0.0/0 (or restrict to Cloudflare IPs)
```

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2012: TLS (SSL) not supported by the database

**Error Message**: `TLS (SSL) not supported by the database`

**Cause**: Database does not have SSL/TLS enabled.

**Solutions**:
1. Enable SSL/TLS on your database
2. For AWS RDS: SSL is enabled by default
3. For self-hosted PostgreSQL: Edit postgresql.conf and set `ssl = on`
4. For self-hosted MySQL: Edit my.cnf and configure SSL certificates

**Hyperdrive requires TLS/SSL for all connections.**

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2013: Invalid database credentials

**Error Message**: `Invalid database credentials`

**Cause**: Username or password incorrect.

**Solutions**:
1. Verify username is correct and exists in database
2. Check password is correct (case-sensitive)
3. Test credentials locally: `psql postgres://user:password@host:port/database`
4. Ensure user has permissions to connect remotely
5. Check for special characters in password (may need URL encoding)

**Special Characters in Password**:
```bash
# Original password: p@ssw$rd
# URL-encoded: p%40ssw%24rd
postgres://user:p%40ssw%24rd@host:5432/database
```

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2014: Database name does not exist

**Error Message**: `The specified database name does not exist`

**Cause**: Database (not table) name provided does not exist.

**Solutions**:
1. Verify database name: `SHOW DATABASES;` (MySQL) or `\l` (PostgreSQL)
2. Check for typos in database name
3. Create database if needed: `CREATE DATABASE mydb;`
4. Ensure you're providing database name, not table name

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2015: Generic error

**Error Message**: `Generic error`

**Cause**: Hyperdrive failed to connect but could not determine a specific reason.

**Solutions**:
1. Check for ongoing Hyperdrive incidents: https://www.cloudflarestatus.com/
2. Contact Cloudflare Support with your Hyperdrive configuration ID
3. Review all previous error codes to eliminate other issues

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Error 2016: Test query failed

**Error Message**: `Test query failed`

**Cause**: User does not have permissions to read/write to database.

**Solutions**:
1. Grant necessary permissions to database user
2. PostgreSQL: `GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;`
3. MySQL: `GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'%';`
4. Verify user can run basic queries

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

## Runtime Errors

These errors occur when querying the database from your Worker.

### Failed to acquire a connection from the pool

**Error Message**: `Failed to acquire a connection from the pool`

**Cause**: Hyperdrive timed out waiting for a connection, or connection pool exhausted.

**Why This Happens**:
- Too many connections held open too long by Worker
- Long-running queries or transactions
- Not cleaning up connections properly

**Solutions**:

**1. Use ctx.waitUntil() for cleanup**:
```typescript
// ✅ Correct
ctx.waitUntil(client.end());

// ❌ Wrong
await client.end();  // Blocks response
```

**2. Set connection pool max to 5**:
```typescript
const pool = new Pool({
  connectionString: env.HYPERDRIVE.connectionString,
  max: 5  // Workers limit: 6 concurrent external connections
});
```

**3. Avoid long-running transactions**:
```typescript
// ❌ Bad: Long transaction holds connection
await client.query('BEGIN');
// ... many queries ...
await client.query('COMMIT');

// ✅ Good: Short transactions, or no transaction
const result = await client.query('SELECT ...');
```

**4. Check for connection leaks**:
```typescript
// Ensure every connection is closed
try {
  // queries
} finally {
  ctx.waitUntil(client.end());  // Always runs
}
```

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Server connection attempt failed: connection_refused

**Error Message**: `Server connection attempt failed: connection_refused`

**Cause**: Hyperdrive cannot create new connections to origin database.

**Why This Happens**:
- Firewall or ACL rejecting requests
- Database connection limit reached
- Database stopped or restarting

**Solutions**:
1. Allow public internet connections in database firewall
2. Check database connection limit: `SHOW VARIABLES LIKE 'max_connections';` (MySQL)
3. Verify database is running
4. Check cloud provider connection limits (e.g., AWS RDS max connections)

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Hyperdrive does not currently support MySQL COM_STMT_PREPARE

**Error Message**: `Hyperdrive does not currently support MySQL COM_STMT_PREPARE messages`

**Cause**: Hyperdrive doesn't support prepared statements for MySQL.

**Solution**: Remove prepared statements from MySQL queries or driver configuration.

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### Internal error

**Error Message**: `Internal error`

**Cause**: Something is broken on Cloudflare's side.

**Solutions**:
1. Check Cloudflare status: https://www.cloudflarestatus.com/
2. Contact Cloudflare Support
3. Retry query if appropriate for your use case

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

## Node.js Compatibility Errors

### Uncaught Error: No such module "node:\<module\>"

**Error Message**: `Uncaught Error: No such module "node:fs"` (or other node module)

**Cause**: Worker or library trying to access Node.js module, but nodejs_compat flag not enabled.

**Solution**: Add `nodejs_compat` to compatibility_flags in wrangler.jsonc:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"],
  "compatibility_date": "2024-09-23"
}
```

**CRITICAL**: This flag is **REQUIRED** for all database drivers (pg, postgres, mysql2).

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

## Driver-Specific Errors

### mysql2: Code generation from strings disallowed

**Error Message**: `Code generation from strings disallowed for this context`

**Cause**: mysql2 driver trying to use `eval()`, which is not supported in Workers.

**Solution**: Set `disableEval: true` in mysql2 configuration:

```typescript
const connection = await createConnection({
  host: env.HYPERDRIVE.host,
  user: env.HYPERDRIVE.user,
  password: env.HYPERDRIVE.password,
  database: env.HYPERDRIVE.database,
  port: env.HYPERDRIVE.port,
  disableEval: true  // REQUIRED for Workers
});
```

**Source**: [Hyperdrive Troubleshooting Docs](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

### postgres.js: Queries not cached

**Error**: Queries aren't being cached even though caching is enabled.

**Cause**: postgres.js configured with `prepare: false`.

**Solution**: Enable prepared statements:

```typescript
const sql = postgres(env.HYPERDRIVE.connectionString, {
  prepare: true  // CRITICAL for caching
});
```

**Hyperdrive can only cache prepared statements.**

**Source**: [Hyperdrive Configuration Guide](https://developers.cloudflare.com/hyperdrive/observability/troubleshooting/)

---

## TLS/SSL Errors

### Server return error and closed connection

**Error Message**: `Server return error and closed connection`

**Cause**: Database has client certificate verification enabled, but Hyperdrive not configured with client certificates.

**Solution**: Configure Hyperdrive with client certificates (mTLS):

```bash
# 1. Upload client certificate
npx wrangler cert upload mtls-certificate \
  --cert client-cert.pem \
  --key client-key.pem \
  --name my-client-cert

# 2. Create Hyperdrive with client cert
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://..." \
  --mtls-certificate-id <CERT_PAIR_ID>
```

**Source**: [Hyperdrive TLS/SSL Guide](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/)

---

### TLS handshake failed: cert validation failed

**Error Message**: `TLS handshake failed: cert validation failed`

**Cause**: Server certificate not signed by expected CA certificate.

**Solutions**:
1. Verify correct CA certificate uploaded to Hyperdrive
2. Check SSL mode is correct (verify-ca or verify-full)
3. Ensure CA certificate matches database's certificate authority
4. Verify connecting to correct database hostname

**Source**: [Hyperdrive TLS/SSL Guide](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/)

---

## Performance Issues

### High query latency

**Symptoms**: Queries taking longer than expected.

**Causes & Solutions**:

**1. Missing indexes**:
```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Add index
CREATE INDEX idx_users_email ON users(email);
```

**2. Large result sets**:
```sql
-- ❌ Bad: Fetching all rows
SELECT * FROM products;

-- ✅ Good: Limit results
SELECT * FROM products LIMIT 100;
```

**3. Long-running transactions**:
```typescript
// ❌ Bad: Transaction holds connection
await sql.begin(async sql => {
  // many queries
});

// ✅ Good: Keep transactions short
await sql`INSERT INTO users VALUES (...)`;
```

**4. Not using connection pooling**:
```typescript
// ❌ Bad: New connection per query
const client = new Client(...);

// ✅ Good: Use pool for parallel queries
const pool = new Pool({ max: 5 });
```

---

### Low cache hit ratio

**Symptoms**: Most queries showing cache MISS instead of HIT.

**Causes & Solutions**:

**1. Writing queries (not cached)**:
- Hyperdrive only caches SELECT queries
- INSERT/UPDATE/DELETE never cached

**2. Volatile functions**:
```sql
-- ❌ Not cached: Uses volatile function
SELECT LASTVAL(), * FROM articles;

-- ✅ Cached: No volatile functions
SELECT * FROM articles LIMIT 50;
```

**3. Prepared statements disabled (postgres.js)**:
```typescript
// ❌ Not cached
const sql = postgres(url, { prepare: false });

// ✅ Cached
const sql = postgres(url, { prepare: true });
```

---

## Getting Help

If you're still stuck:

1. **Check Cloudflare Status**: https://www.cloudflarestatus.com/
2. **Review Documentation**: https://developers.cloudflare.com/hyperdrive/
3. **Community Forum**: https://community.cloudflare.com/
4. **Support Ticket**: https://dash.cloudflare.com/?to=/:account/support

**Include in support request**:
- Hyperdrive configuration ID
- Error message (exact text)
- Database provider (AWS RDS, Neon, etc.)
- Driver and version (pg@8.13.0, etc.)
- Minimal code reproducing issue
