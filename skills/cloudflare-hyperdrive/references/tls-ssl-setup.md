# TLS/SSL Setup Guide

Complete guide to configuring SSL/TLS certificates with Hyperdrive.

---

## Overview

**Hyperdrive requires TLS/SSL** for all database connections.

**Supported Configurations**:
1. **Basic TLS** (`require` mode) - Default, validates certificates via WebPKI
2. **Server Certificates** (`verify-ca`, `verify-full`) - Verify server's CA certificate
3. **Client Certificates** (mTLS) - Authenticate Hyperdrive to database

---

## SSL Modes

### 1. require (Default)

**What it does**:
- Enforces TLS encryption
- Validates server certificate using WebPKI (standard browser certificate authorities)
- No additional certificate configuration needed

**When to use**:
- Most cloud databases (AWS RDS, Google Cloud SQL, Azure, Neon, Supabase)
- Standard SSL/TLS setup
- Default choice for most applications

**Example**:
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://user:password@host:5432/database"

# SSL mode is "require" by default
```

**No configuration needed** - this is automatic.

---

### 2. verify-ca

**What it does**:
- Verifies server certificate is signed by expected Certificate Authority (CA)
- Prevents man-in-the-middle attacks
- Requires uploading CA certificate to Hyperdrive

**When to use**:
- Enhanced security requirements
- Self-signed certificates
- Private/internal certificate authorities

**Setup**:

**Step 1: Upload CA certificate**:
```bash
npx wrangler cert upload certificate-authority \
  --ca-cert /path/to/root-ca.pem \
  --name my-ca-cert
```

**Output**:
```
✅ Uploaded CA Certificate my-ca-cert
ID: ca-12345678-1234-1234-1234-123456789012
```

**Step 2: Create Hyperdrive with CA**:
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://user:password@host:5432/database" \
  --ca-certificate-id ca-12345678-1234-1234-1234-123456789012 \
  --sslmode verify-ca
```

---

### 3. verify-full

**What it does**:
- Everything from `verify-ca`, PLUS
- Verifies database hostname matches Subject Alternative Name (SAN) in certificate

**When to use**:
- Maximum security requirements
- Preventing hostname spoofing
- Compliance requirements (PCI-DSS, HIPAA)

**Setup** (same as verify-ca, but use `--sslmode verify-full`):
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://user:password@host:5432/database" \
  --ca-certificate-id ca-12345678-1234-1234-1234-123456789012 \
  --sslmode verify-full
```

---

## Certificate Requirements

### CA Certificate Format

**Must be**:
- PEM format (`.pem` file)
- Root CA or Intermediate CA certificate
- **Region-specific** (not global bundle with multiple CAs)

**Example CA Certificate** (root-ca.pem):
```
-----BEGIN CERTIFICATE-----
MIIDdzCCAl+gAwIBAgIEAgAAuTANBgkqhkiG9w0BAQUFADBaMQswCQYDVQQGEwJJ
...
-----END CERTIFICATE-----
```

**Get CA Certificate**:

**AWS RDS**:
```bash
wget https://truststore.pki.rds.amazonaws.com/us-east-1/us-east-1-bundle.pem
# Use region-specific bundle (NOT global bundle)
```

**Google Cloud SQL**:
```bash
# Download from Cloud SQL instance details page
# Instance → Connections → Server CA certificate
```

**Azure Database**:
```bash
wget https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem
```

---

## Client Certificates (mTLS)

### Overview

**What is mTLS?**
- Mutual TLS: Both client and server authenticate each other
- Hyperdrive provides client certificate to database
- Database verifies certificate before allowing connection

**When to use**:
- Database requires client certificate authentication
- Enhanced security beyond username/password
- Compliance requirements

---

### Setup

**Step 1: Generate Client Certificate** (if needed):
```bash
# Generate private key
openssl genrsa -out client-key.pem 2048

# Generate certificate signing request (CSR)
openssl req -new -key client-key.pem -out client.csr

# Get certificate from your CA (or self-sign for testing)
openssl x509 -req -in client.csr -CA root-ca.pem -CAkey root-ca-key.pem \
  -CAcreateserial -out client-cert.pem -days 365
```

**Step 2: Upload Client Certificate to Hyperdrive**:
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

**Step 3: Create Hyperdrive with Client Certificate**:
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://user:password@host:5432/database" \
  --mtls-certificate-id mtls-87654321-4321-4321-4321-210987654321
```

**Optionally combine with server certificates**:
```bash
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://..." \
  --ca-certificate-id ca-12345678-1234-1234-1234-123456789012 \
  --mtls-certificate-id mtls-87654321-4321-4321-4321-210987654321 \
  --sslmode verify-full
```

---

## Complete Setup Examples

### Example 1: AWS RDS with verify-full

```bash
# 1. Download AWS RDS CA certificate (region-specific)
wget https://truststore.pki.rds.amazonaws.com/us-east-1/us-east-1-bundle.pem

# 2. Upload CA certificate
npx wrangler cert upload certificate-authority \
  --ca-cert us-east-1-bundle.pem \
  --name aws-rds-us-east-1-ca

# Output: ID = ca-abc123...

# 3. Create Hyperdrive
npx wrangler hyperdrive create aws-rds-db \
  --connection-string="postgres://admin:password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/postgres" \
  --ca-certificate-id ca-abc123... \
  --sslmode verify-full
```

---

### Example 2: Self-Hosted with mTLS

```bash
# 1. Upload server CA certificate
npx wrangler cert upload certificate-authority \
  --ca-cert /path/to/server-ca.pem \
  --name my-server-ca

# Output: ID = ca-server123...

# 2. Upload client certificate
npx wrangler cert upload mtls-certificate \
  --cert /path/to/client-cert.pem \
  --key /path/to/client-key.pem \
  --name my-client-cert

# Output: ID = mtls-client456...

# 3. Create Hyperdrive with both
npx wrangler hyperdrive create secure-db \
  --connection-string="postgres://user:password@secure-db.example.com:5432/mydb" \
  --ca-certificate-id ca-server123... \
  --mtls-certificate-id mtls-client456... \
  --sslmode verify-full
```

---

### Example 3: Basic SSL (Default)

```bash
# Most cloud databases (AWS, GCP, Azure, Neon, Supabase)
# No certificate configuration needed
npx wrangler hyperdrive create my-db \
  --connection-string="postgres://user:password@host:5432/database"

# SSL mode "require" is automatic
```

---

## Database Configuration

### PostgreSQL SSL Setup

**postgresql.conf**:
```conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'  # For client certificate verification

# Optional: Require SSL
ssl_min_protocol_version = 'TLSv1.2'
```

**pg_hba.conf** (require SSL):
```conf
# TYPE  DATABASE  USER  ADDRESS    METHOD
hostssl all       all   0.0.0.0/0  md5

# Or require client certificates
hostssl all       all   0.0.0.0/0  cert
```

**Restart PostgreSQL**:
```bash
sudo systemctl restart postgresql
```

---

### MySQL SSL Setup

**my.cnf** or **my.ini**:
```conf
[mysqld]
require_secure_transport = ON
ssl-ca = /path/to/ca-cert.pem
ssl-cert = /path/to/server-cert.pem
ssl-key = /path/to/server-key.pem
```

**Require client certificates** (MySQL user):
```sql
CREATE USER 'hyperdrive'@'%' IDENTIFIED BY 'password' REQUIRE X509;
GRANT ALL PRIVILEGES ON mydb.* TO 'hyperdrive'@'%';
FLUSH PRIVILEGES;
```

**Restart MySQL**:
```bash
sudo systemctl restart mysql
```

---

## Troubleshooting

### Error: "TLS not supported by the database"

**Cause**: Database doesn't have SSL/TLS enabled.

**Solution**:
1. Enable SSL in database configuration
2. Restart database
3. Verify SSL enabled: `SHOW ssl;` (MySQL) or `SHOW ssl;` (PostgreSQL)

**PostgreSQL verification**:
```sql
SHOW ssl;
-- Should return "on"
```

**MySQL verification**:
```sql
SHOW VARIABLES LIKE 'have_ssl';
-- Should return "YES"
```

---

### Error: "TLS handshake failed: cert validation failed"

**Cause**: Server certificate not signed by expected CA.

**Solutions**:
1. Verify correct CA certificate uploaded
2. Check CA certificate is for correct region (AWS RDS)
3. Ensure CA certificate format is PEM
4. Verify connection string hostname matches certificate SAN (verify-full mode)

---

### Error: "Server return error and closed connection"

**Cause**: Database requires client certificate, but none provided.

**Solution**: Upload client certificate and configure Hyperdrive with mTLS:
```bash
npx wrangler cert upload mtls-certificate \
  --cert client-cert.pem \
  --key client-key.pem \
  --name my-cert

npx wrangler hyperdrive create my-db \
  --connection-string="..." \
  --mtls-certificate-id <id>
```

---

### Error: "Certificate has expired"

**Cause**: Server certificate or client certificate expired.

**Solutions**:
1. Renew certificate from certificate authority
2. Upload new certificate to Hyperdrive
3. Update Hyperdrive configuration

---

## Local Development

### SSL in Local Development

**Option 1: Disable SSL for local database** (NOT recommended):
```bash
# Local PostgreSQL without SSL
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgres://user:password@localhost:5432/db?sslmode=disable"
```

**Option 2: Use Tunnel for local database** (Recommended):
```bash
# Use Cloudflare Tunnel to local database (keeps SSL)
cloudflared tunnel create local-db
cloudflared tunnel run local-db

# Hyperdrive connects via tunnel with SSL
```

**Option 3: Self-signed certificates for local dev**:
```bash
# Generate self-signed cert
openssl req -new -x509 -days 365 -nodes -out server.crt -keyout server.key

# Configure local PostgreSQL to use it
# Then use verify-ca mode with local CA
```

---

## Best Practices

1. **Use default `require` mode** unless you have specific security requirements
2. **Use verify-full for production** if handling sensitive data
3. **Store certificates securely** - don't commit to git
4. **Rotate certificates regularly** - before expiration
5. **Test certificate setup** in staging before production
6. **Use region-specific CA bundles** (AWS RDS) not global bundles
7. **Document certificate IDs** in project README
8. **Monitor certificate expiration** (set calendar reminders)

---

## References

- [Hyperdrive TLS/SSL Docs](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/)
- [PostgreSQL SSL Docs](https://www.postgresql.org/docs/current/ssl-tcp.html)
- [MySQL SSL Docs](https://dev.mysql.com/doc/refman/8.0/en/using-encrypted-connections.html)
- [AWS RDS SSL Certificates](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
