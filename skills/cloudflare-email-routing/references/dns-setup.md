# DNS Setup for Email Routing

Complete guide to DNS configuration for Cloudflare Email Routing.

**Last Updated**: 2025-10-23
**Official Docs**: https://developers.cloudflare.com/email-routing/postmaster

---

## Overview

Cloudflare Email Routing requires specific DNS records to function:
1. **MX Records** - Direct incoming email to Cloudflare servers
2. **SPF Record** - Authorize Cloudflare to send email on your behalf
3. **DKIM Records** - Cryptographically sign outgoing emails
4. **DMARC Record** (Optional) - Policy for handling failed authentication

**Good News**: When you enable Email Routing in the dashboard, Cloudflare automatically configures MX, SPF, and DKIM records for you.

---

## Automatic Setup (Recommended)

### Step 1: Enable Email Routing

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. Go to **Email** > **Email Routing**
4. Click **Enable Email Routing**
5. Review records that will be added:
   - 3 MX records (Cloudflare mail servers)
   - 1 SPF TXT record
   - DKIM TXT records (automatically managed)
6. Click **Add records and enable**

### Step 2: Verify DNS Propagation

```bash
# Check MX records
dig MX yourdomain.com

# Expected output:
yourdomain.com. 300 IN MX 13 amir.mx.cloudflare.net.
yourdomain.com. 300 IN MX 86 linda.mx.cloudflare.net.
yourdomain.com. 300 IN MX 24 isaac.mx.cloudflare.net.

# Check SPF record
dig TXT yourdomain.com

# Expected output (among other TXT records):
yourdomain.com. 300 IN TXT "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

**DNS Propagation Time**: Usually 5-30 minutes, can take up to 24 hours globally.

---

## DNS Records Explained

### MX Records (Mail Exchange)

MX records tell other mail servers where to send email destined for your domain.

**Cloudflare's MX Records**:
```
Priority  Hostname
13        amir.mx.cloudflare.net.
24        isaac.mx.cloudflare.net.
86        linda.mx.cloudflare.net.
```

**Priority**: Lower numbers are tried first. If one server is unavailable, the next priority is used.

**IMPORTANT**:
- Only Cloudflare's MX records can be active when Email Routing is enabled
- Existing MX records (e.g., from Google Workspace, Microsoft 365) must be deleted
- You cannot run Email Routing simultaneously with other email providers

---

### SPF Record (Sender Policy Framework)

SPF authorizes which mail servers can send email on behalf of your domain.

**Cloudflare's SPF Record**:
```
v=spf1 include:_spf.mx.cloudflare.net ~all
```

**Breakdown**:
- `v=spf1` - SPF version 1
- `include:_spf.mx.cloudflare.net` - Authorize Cloudflare's servers
- `~all` - Soft fail for all other servers (recommended)

**If You Already Have SPF**:

❌ **Wrong** (multiple SPF records):
```
yourdomain.com. TXT "v=spf1 include:_spf.google.com ~all"
yourdomain.com. TXT "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

✅ **Correct** (combined SPF record):
```
yourdomain.com. TXT "v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all"
```

**Note**: SPF has a 10 DNS lookup limit. Too many `include:` statements will cause SPF to fail.

**Test SPF**: Use [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx)

---

### DKIM Records (DomainKeys Identified Mail)

DKIM cryptographically signs outgoing emails to prove they came from your domain.

**Cloudflare's DKIM**:
- Automatically configured when you enable Email Routing
- Records look like: `cf2024-1._domainkey.yourdomain.com`
- Managed by Cloudflare (you don't need to configure manually)

**To View DKIM Records**:
```bash
dig TXT cf2024-1._domainkey.yourdomain.com
```

**IMPORTANT**: DKIM selectors change periodically. Cloudflare rotates keys automatically for security.

---

### DMARC Record (Optional but Recommended)

DMARC tells receiving mail servers what to do with emails that fail SPF or DKIM checks.

**Basic DMARC Record**:
```
_dmarc.yourdomain.com. TXT "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

**Breakdown**:
- `v=DMARC1` - DMARC version 1
- `p=none` - Policy: don't reject or quarantine failed emails (monitoring mode)
- `rua=mailto:dmarc@yourdomain.com` - Send aggregate reports to this address

**Progressive DMARC Policies**:

**Phase 1** (Monitoring - Start Here):
```
_dmarc.yourdomain.com. TXT "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

**Phase 2** (Quarantine - After 1-2 weeks):
```
_dmarc.yourdomain.com. TXT "v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc@yourdomain.com"
```
- `p=quarantine` - Failed emails go to spam
- `pct=10` - Apply to 10% of emails (gradual rollout)

**Phase 3** (Reject - After 1-2 months):
```
_dmarc.yourdomain.com. TXT "v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com"
```
- `p=reject` - Failed emails are rejected outright

**Why Progressive?**: Start with `p=none` to monitor for legitimate emails being marked as failures before enforcing strict policies.

---

## Manual DNS Configuration

If you need to configure DNS manually (not recommended):

### Adding MX Records

**Cloudflare Dashboard**:
1. Go to **DNS** > **Records**
2. Click **Add record**
3. Select **MX**
4. Configure:
   - **Name**: `@` (or your domain)
   - **Mail server**: `amir.mx.cloudflare.net`
   - **Priority**: `13`
   - **TTL**: `Auto`
5. Repeat for other MX servers

**Example API Call**:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "MX",
    "name": "yourdomain.com",
    "content": "amir.mx.cloudflare.net",
    "priority": 13,
    "ttl": 1
  }'
```

### Adding SPF Record

**Cloudflare Dashboard**:
1. Go to **DNS** > **Records**
2. Click **Add record**
3. Select **TXT**
4. Configure:
   - **Name**: `@`
   - **Content**: `v=spf1 include:_spf.mx.cloudflare.net ~all`
   - **TTL**: `Auto`

---

## DNS Verification

### Check All Records

```bash
#!/bin/bash
DOMAIN="yourdomain.com"

echo "=== MX Records ==="
dig MX $DOMAIN +short

echo ""
echo "=== SPF Record ==="
dig TXT $DOMAIN +short | grep "v=spf1"

echo ""
echo "=== DKIM Records ==="
dig TXT cf2024-1._domainkey.$DOMAIN +short

echo ""
echo "=== DMARC Record ==="
dig TXT _dmarc.$DOMAIN +short
```

### Online Testing Tools

- **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
  - Comprehensive email DNS testing
  - SPF, DKIM, DMARC validation
  - Blacklist checking

- **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/checkmx/
  - MX record verification
  - Mail flow testing

- **DMARC Analyzer**: https://www.dmarcanalyzer.com/dmarc-checker/
  - DMARC policy validation

---

## Common DNS Issues

### Issue: MX Records Not Updating

**Symptoms**: Emails not being received after enabling Email Routing

**Causes**:
- DNS propagation delay (wait 24 hours)
- Old MX records still cached by mail servers
- Incorrect MX record configuration

**Solution**:
```bash
# 1. Verify MX records are correct
dig MX yourdomain.com

# 2. Check from external DNS (not cached)
dig MX yourdomain.com @8.8.8.8

# 3. Wait for TTL expiration (check old records)
# 4. Clear DNS cache on your machine
# Linux: sudo systemd-resolve --flush-caches
# macOS: sudo dscacheutil -flushcache
# Windows: ipconfig /flushdns
```

---

### Issue: SPF Hard Fail

**Symptoms**: Sent emails are rejected or marked as spam

**Error**:
```
550 5.7.1 SPF check failed
```

**Causes**:
- SPF record missing
- SPF record doesn't include Cloudflare
- Multiple SPF records (only one allowed)

**Solution**:
```bash
# Check SPF record
dig TXT yourdomain.com +short | grep "v=spf1"

# Verify Cloudflare is included
# Should see: include:_spf.mx.cloudflare.net

# If missing, add SPF record (see above)
# If multiple SPF records exist, combine into one
```

---

### Issue: DMARC Rejection

**Symptoms**: Emails rejected by recipients with DMARC policies

**Error**:
```
550 5.7.1 DMARC policy violation
```

**Causes**:
- DMARC policy set to `p=reject` too early
- SPF or DKIM failing

**Solution**:
```bash
# 1. Check SPF and DKIM are passing
# 2. Start with p=none policy
_dmarc.yourdomain.com. TXT "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"

# 3. Monitor DMARC reports
# 4. Gradually move to p=quarantine, then p=reject
```

---

### Issue: Conflicting Email Services

**Symptoms**: Email Routing won't enable, says "Conflicting MX records exist"

**Causes**:
- Existing MX records from another email provider (Google Workspace, Microsoft 365, etc.)
- Cannot run multiple email services simultaneously

**Solution**:
1. **Backup** existing MX records (screenshot or export)
2. Go to **DNS** > **Records**
3. Delete all existing MX records
4. Enable Email Routing (Cloudflare adds its MX records)
5. **IMPORTANT**: You cannot receive email from previous provider after this

**Migration Path**:
- Export/backup emails from old provider first
- Update email addresses in services to use new forwarding addresses
- Test Email Routing thoroughly before fully migrating

---

## DNS Security Best Practices

### 1. Lock DNS Records

After configuring Email Routing:
1. Go to **Email** > **Email Routing** > **Settings**
2. Ensure **Email DNS records configured** shows green
3. Click **Lock DNS records** to prevent accidental changes

**What this does**:
- Protects MX, SPF, and DKIM records from deletion
- Requires disabling Email Routing to modify records
- Prevents accidental disruption of email service

---

### 2. Enable DNSSEC

DNSSEC prevents DNS spoofing attacks:
1. Go to **DNS** > **Settings**
2. Scroll to **DNSSEC**
3. Click **Enable DNSSEC**
4. Add DS records to your domain registrar

**Why**: Ensures DNS records can't be tampered with by attackers.

---

### 3. Monitor DNS Changes

Set up monitoring for unauthorized DNS changes:
- Use Cloudflare's Audit Logs
- Enable email notifications for DNS modifications
- Use third-party monitoring (DNSWatch, etc.)

---

## Advanced: Subdomain Email Routing

You can route email for subdomains (e.g., `support@subdomain.yourdomain.com`):

### Option 1: Separate Email Routing

1. Add subdomain to Cloudflare (as separate zone if needed)
2. Enable Email Routing for subdomain
3. Configure separate MX/SPF/DKIM records

### Option 2: Wildcard MX Records (Not Recommended)

```
*.yourdomain.com. MX 13 amir.mx.cloudflare.net.
```

**Warning**: Catches all subdomains, can be confusing and hard to manage.

---

## DNS Testing Checklist

Before deploying Email Routing to production:

- [ ] MX records point to Cloudflare (3 records)
- [ ] SPF record includes `_spf.mx.cloudflare.net`
- [ ] DKIM records exist (check `cf2024-1._domainkey`)
- [ ] DMARC record configured (start with `p=none`)
- [ ] DNS propagation complete (wait 24 hours)
- [ ] Test with online tools (MXToolbox, etc.)
- [ ] Send test email from external provider
- [ ] Verify test email is received at destination
- [ ] Check SPF/DKIM pass on received email headers
- [ ] DNS records locked in Cloudflare dashboard

---

## Troubleshooting Commands

```bash
# Quick DNS check script
#!/bin/bash
DOMAIN="$1"

echo "=== DNS Records for $DOMAIN ==="
echo ""

echo "MX Records:"
dig MX $DOMAIN +short

echo ""
echo "SPF Record:"
dig TXT $DOMAIN +short | grep "v=spf1"

echo ""
echo "DKIM Record (cf2024-1):"
dig TXT cf2024-1._domainkey.$DOMAIN +short

echo ""
echo "DMARC Record:"
dig TXT _dmarc.$DOMAIN +short

echo ""
echo "=== Testing from Google DNS (8.8.8.8) ==="
echo "MX Records:"
dig MX $DOMAIN @8.8.8.8 +short

# Usage: ./dns-check.sh yourdomain.com
```

---

## Additional Resources

- **Cloudflare Email Routing Postmaster**: https://developers.cloudflare.com/email-routing/postmaster
- **DNS Records Guide**: https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/
- **SPF Record Syntax**: https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/
- **DKIM Guide**: https://www.cloudflare.com/learning/dns/dns-records/dns-dkim-record/
- **DMARC Guide**: https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/
- **MXToolbox**: https://mxtoolbox.com/
- **Google Admin Toolbox**: https://toolbox.googleapps.com/

---

**Last Updated**: 2025-10-23
**Skill Version**: 1.0.0
