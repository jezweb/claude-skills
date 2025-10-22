# Hyperdrive Wrangler Commands Reference

Complete CLI reference for managing Hyperdrive configurations with Wrangler.

**Minimum Wrangler Version**: 3.11.0+

---

## Create Hyperdrive Configuration

Create a new Hyperdrive configuration that connects to a database.

### PostgreSQL

```bash
npx wrangler hyperdrive create <name> \
  --connection-string="postgres://user:password@host:port/database"
```

**Example**:
```bash
npx wrangler hyperdrive create my-postgres-db \
  --connection-string="postgres://myuser:mypass@db.example.com:5432/mydb"
```

### MySQL

```bash
npx wrangler hyperdrive create <name> \
  --connection-string="mysql://user:password@host:port/database"
```

**Example**:
```bash
npx wrangler hyperdrive create my-mysql-db \
  --connection-string="mysql://myuser:mypass@db.example.com:3306/mydb"
```

### With SSL Mode (PostgreSQL)

```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://..." \
  --sslmode require  # or verify-ca, verify-full
```

### With Server CA Certificate

```bash
# First, upload CA certificate
npx wrangler cert upload certificate-authority \
  --ca-cert root-ca.pem \
  --name my-ca-cert

# Then create Hyperdrive with CA
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://..." \
  --ca-certificate-id <CA_CERT_ID> \
  --sslmode verify-full
```

### With Client Certificates (mTLS)

```bash
# First, upload client certificate + key
npx wrangler cert upload mtls-certificate \
  --cert client-cert.pem \
  --key client-key.pem \
  --name my-client-cert

# Then create Hyperdrive with client cert
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://..." \
  --mtls-certificate-id <CERT_PAIR_ID>
```

**Output**:
```
✅ Successfully created Hyperdrive configuration

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "a76a99bc-7901-48c9-9c15-c4b11b559606"
```

---

## List Hyperdrive Configurations

List all Hyperdrive configurations in your account.

```bash
npx wrangler hyperdrive list
```

**Output**:
```
┌──────────────────────────────────────┬─────────────────┬────────────────┐
│ id                                   │ name            │ database       │
├──────────────────────────────────────┼─────────────────┼────────────────┤
│ a76a99bc-7901-48c9-9c15-c4b11b559606 │ my-postgres-db  │ PostgreSQL     │
│ b8c12345-6789-12ab-cdef-012345678901 │ my-mysql-db     │ MySQL          │
└──────────────────────────────────────┴─────────────────┴────────────────┘
```

---

## Get Hyperdrive Configuration Details

Get details of a specific Hyperdrive configuration.

```bash
npx wrangler hyperdrive get <hyperdrive-id>
```

**Example**:
```bash
npx wrangler hyperdrive get a76a99bc-7901-48c9-9c15-c4b11b559606
```

**Output**:
```json
{
  "id": "a76a99bc-7901-48c9-9c15-c4b11b559606",
  "name": "my-postgres-db",
  "origin": {
    "host": "db.example.com",
    "port": 5432,
    "database": "mydb",
    "user": "myuser",
    "scheme": "postgres"
  },
  "caching": {
    "disabled": false
  }
}
```

**Note**: Password is never returned for security reasons.

---

## Update Hyperdrive Configuration

Update connection string or other settings of an existing configuration.

### Update Connection String

```bash
npx wrangler hyperdrive update <hyperdrive-id> \
  --connection-string="postgres://newuser:newpass@newhost:5432/newdb"
```

### Update Name

```bash
npx wrangler hyperdrive update <hyperdrive-id> \
  --name="my-renamed-db"
```

### Disable Caching

```bash
npx wrangler hyperdrive update <hyperdrive-id> \
  --caching-disabled
```

### Enable Caching

```bash
npx wrangler hyperdrive update <hyperdrive-id> \
  --caching-disabled=false
```

**Use Case - Credential Rotation**:
```bash
# Update with new password
npx wrangler hyperdrive update a76a99bc-7901-48c9-9c15-c4b11b559606 \
  --connection-string="postgres://user:new_password@host:5432/db"
```

---

## Delete Hyperdrive Configuration

Delete a Hyperdrive configuration.

```bash
npx wrangler hyperdrive delete <hyperdrive-id>
```

**Example**:
```bash
npx wrangler hyperdrive delete a76a99bc-7901-48c9-9c15-c4b11b559606
```

**Confirmation Prompt**:
```
? Are you sure you want to delete Hyperdrive configuration a76a99bc-7901-48c9-9c15-c4b11b559606? › (y/N)
```

**Warning**: This action cannot be undone. Workers using this configuration will fail until updated.

---

## Certificate Management

### Upload CA Certificate (Server Certificate)

Upload a certificate authority (CA) certificate for `verify-ca` or `verify-full` SSL modes.

```bash
npx wrangler cert upload certificate-authority \
  --ca-cert <path-to-ca-cert.pem> \
  --name <custom-name>
```

**Example**:
```bash
npx wrangler cert upload certificate-authority \
  --ca-cert /path/to/root-ca.pem \
  --name aws-rds-ca-2024
```

**Output**:
```
✅ Uploaded CA Certificate aws-rds-ca-2024
ID: ca-12345678-1234-1234-1234-123456789012
```

**Important**: You must use region-specific CA certificates, not global bundles containing multiple CAs.

---

### Upload Client Certificate (mTLS)

Upload client certificate and private key pair for mutual TLS authentication.

```bash
npx wrangler cert upload mtls-certificate \
  --cert <path-to-client-cert.pem> \
  --key <path-to-private-key.pem> \
  --name <custom-name>
```

**Example**:
```bash
npx wrangler cert upload mtls-certificate \
  --cert /path/to/client-cert.pem \
  --key /path/to/client-key.pem \
  --name my-client-cert
```

**Output**:
```
✅ Uploaded client certificate my-client-cert
ID: mtls-87654321-4321-4321-4321-210987654321
```

---

## Connection String Formats

### PostgreSQL

**Basic**:
```
postgres://username:password@hostname:port/database
```

**With SSL Mode**:
```
postgres://username:password@hostname:port/database?sslmode=require
```

**With Special Characters in Password**:
```bash
# Password: p@ssw$rd
# URL-encoded: p%40ssw%24rd
postgres://user:p%40ssw%24rd@host:5432/database
```

**URL Encoding Reference**:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`

---

### MySQL

**Basic**:
```
mysql://username:password@hostname:port/database
```

**Example**:
```
mysql://admin:mypass123@mysql-prod.example.com:3306/app_db
```

---

## Workflow Examples

### Complete Setup Workflow

```bash
# 1. Create Hyperdrive configuration
npx wrangler hyperdrive create my-database \
  --connection-string="postgres://user:pass@host:5432/db"

# Output: id = a76a99bc-7901-48c9-9c15-c4b11b559606

# 2. Add to wrangler.jsonc
cat >> wrangler.jsonc <<EOF
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "a76a99bc-7901-48c9-9c15-c4b11b559606"
    }
  ]
}
EOF

# 3. Deploy Worker
npx wrangler deploy
```

---

### Credential Rotation Workflow

**Option A: Update Existing Config**
```bash
# Update with new credentials
npx wrangler hyperdrive update a76a99bc-7901-48c9-9c15-c4b11b559606 \
  --connection-string="postgres://user:NEW_PASSWORD@host:5432/db"

# Deploy (Workers automatically use new credentials)
npx wrangler deploy
```

**Option B: Create New Config (Zero Downtime)**
```bash
# 1. Create new config with new credentials
npx wrangler hyperdrive create my-database-v2 \
  --connection-string="postgres://user:NEW_PASSWORD@host:5432/db"

# Output: id = b8c12345-6789-12ab-cdef-012345678901

# 2. Update wrangler.jsonc with new ID
# 3. Deploy gradually with gradual deployments

# 4. Delete old config when migration complete
npx wrangler hyperdrive delete a76a99bc-7901-48c9-9c15-c4b11b559606
```

---

### Multiple Database Workflow

```bash
# Create multiple Hyperdrive configs
npx wrangler hyperdrive create postgres-db \
  --connection-string="postgres://..."

npx wrangler hyperdrive create mysql-db \
  --connection-string="mysql://..."

# Configure in wrangler.jsonc
cat >> wrangler.jsonc <<EOF
{
  "hyperdrive": [
    {
      "binding": "POSTGRES_DB",
      "id": "<postgres-id>"
    },
    {
      "binding": "MYSQL_DB",
      "id": "<mysql-id>"
    }
  ]
}
EOF
```

---

## Troubleshooting Commands

### Test Connection

Hyperdrive tests the connection when creating/updating. If creation succeeds, connection works.

```bash
# This command will fail fast if connection doesn't work
npx wrangler hyperdrive create test-connection \
  --connection-string="postgres://user:pass@host:5432/db"
```

### Verify Configuration

```bash
# Check config exists and view details
npx wrangler hyperdrive get <hyperdrive-id>

# List all configs
npx wrangler hyperdrive list
```

### Check Wrangler Version

```bash
# Ensure you have wrangler 3.11.0+
npx wrangler --version
```

---

## Common Errors

### "Hyperdrive will attempt to connect to your database..."

**Full message**:
```
Hyperdrive will attempt to connect to your database with the provided
credentials to verify they are correct before creating a configuration.
```

This is an **info message**, not an error. Hyperdrive is testing the connection.

**If connection fails**, you'll see specific error (2008-2016). See `troubleshooting.md` for solutions.

---

### "wrangler: command not found"

**Cause**: Wrangler not installed.

**Solution**:
```bash
npm install -g wrangler
# or use npx
npx wrangler@latest hyperdrive list
```

---

### "Missing required argument: --connection-string"

**Cause**: Forgot to provide connection string when creating Hyperdrive.

**Solution**:
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://user:pass@host:5432/db"
```

---

## Best Practices

1. **Use npx** for consistent wrangler versions: `npx wrangler hyperdrive ...`
2. **Store connection strings securely** - Never commit to git
3. **Use environment variables** for sensitive data:
   ```bash
   export DB_PASSWORD="secret"
   npx wrangler hyperdrive create my-db \
     --connection-string="postgres://user:$DB_PASSWORD@host:5432/db"
   ```
4. **Test locally first** with `localConnectionString` before deploying
5. **Use gradual deployments** when rotating credentials
6. **Document Hyperdrive IDs** in your project README
7. **Separate configs** for staging and production

---

## References

- [Official Wrangler Commands Docs](https://developers.cloudflare.com/hyperdrive/reference/wrangler-commands/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Gradual Deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)
