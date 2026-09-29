---
name: cloudflare-api
description: "Hit the Cloudflare REST API directly for operations that wrangler and MCP can't handle well. Bulk DNS, custom hostnames, email routing, cache purge, WAF rules, redirect rules, zone settings, Worker routes, D1 cross-database queries, R2 bulk operations, KV bulk read/write, Vectorize queries, Queues, and fleet-wide resource audits. Produces curl commands or scripts. Triggers: 'cloudflare api', 'bulk dns', 'custom hostname', 'email routing', 'cache purge', 'waf rule', 'd1 query', 'r2 bucket', 'kv bulk', 'vectorize query', 'audit resources', 'fleet operation'."
compatibility: claude-code-only
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Cloudflare API

Hit the Cloudflare REST API directly when wrangler CLI or MCP servers aren't the right tool. For bulk operations, fleet-wide changes, and features that wrangler doesn't expose.

## When to Use This Instead of Wrangler or MCP

| Use case | Wrangler | MCP | This skill |
|----------|---------|-----|-----------|
| Deploy a Worker | Yes | Yes | No |
| Create a D1 database | Yes | Yes | No |
| Bulk update 50 DNS records | Slow (one at a time) | Slow (one tool call each) | Yes — batch script |
| Custom hostnames for white-label | No | Partial | Yes |
| Email routing rules | No | Partial | Yes |
| WAF/firewall rules | No | Yes but verbose | Yes — direct API |
| Redirect rules in bulk | No | One at a time | Yes — batch script |
| Zone settings across 20 zones | No | 20 separate calls | Yes — fleet script |
| Cache purge by tag/prefix | No | Yes | Yes (when scripting) |
| Worker route management | Limited | Yes | Yes (when bulk) |
| Analytics/logs query | No | Partial | Yes — GraphQL |
| D1 query/export across databases | One DB at a time | One DB at a time | Yes — cross-DB scripts |
| R2 bulk object operations | No | One at a time | Yes — S3 API + batch |
| KV bulk read/write/delete | One at a time | One at a time | Yes — bulk endpoints |
| Vectorize query/delete | No | Via Worker only | Yes — direct API |
| Queue message injection | No | Via Worker only | Yes — direct API |
| Audit all resources in account | No | Tedious | Yes — inventory script |

**Rule of thumb**: Single operations → MCP or wrangler. Bulk/fleet/scripted → API directly.

## Auth Setup

### API Token (recommended)

Create a scoped token at: Dashboard → My Profile → API Tokens → Create Token

```bash
# Store it
export CLOUDFLARE_API_TOKEN="your-token-here"

# Test it
curl -s "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.success'
```

**Token scopes**: Always use minimal permissions. Common presets:
- "Edit zone DNS" — for DNS operations
- "Edit zone settings" — for zone config changes
- "Edit Cloudflare Workers" — for Worker route management
- "Read analytics" — for GraphQL analytics

### Account and Zone IDs

```bash
# List your zones (find zone IDs)
curl -s "https://api.cloudflare.com/client/v4/zones?per_page=50" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | {name, id}'

# Get zone ID by domain name
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=example.com" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[0].id')
```

Store IDs in environment or a config file — don't hardcode them in scripts.

## Workflows

### Bulk DNS Operations

**Add/update many records at once** (e.g. migrating a domain, setting up a new client):

```bash
# Pattern: read records from a file, create in batch
while IFS=',' read -r type name content proxied; do
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"$type\",\"name\":\"$name\",\"content\":\"$content\",\"proxied\":$proxied,\"ttl\":1}" \
    | jq '{name: .result.name, id: .result.id, success: .success}'
  sleep 0.25  # Rate limit: 1200 req/5min
done < dns-records.csv
```

**Export all records from a zone** (backup or migration):

```bash
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?per_page=100" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq -r '.result[] | [.type, .name, .content, .proxied] | @csv' > dns-export.csv
```

**Find and replace across records** (e.g. IP migration):

```bash
OLD_IP="203.0.113.1"
NEW_IP="198.51.100.1"

# Find records pointing to old IP
RECORDS=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?content=$OLD_IP" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[].id')

# Update each one
for RECORD_ID in $RECORDS; do
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"$NEW_IP\"}" | jq '.success'
done
```

### Custom Hostnames (White-Label Client Domains)

For SaaS apps where clients use their own domain (e.g. `app.clientdomain.com` → your Worker):

```bash
# Create custom hostname
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/custom_hostnames" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "app.clientdomain.com",
    "ssl": {
      "method": "http",
      "type": "dv",
      "settings": {
        "min_tls_version": "1.2"
      }
    }
  }' | jq '{id: .result.id, status: .result.status, ssl_status: .result.ssl.status}'

# List custom hostnames
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/custom_hostnames?per_page=50" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {hostname, status, ssl_status: .ssl.status}'

# Check status (client needs to add CNAME)
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/custom_hostnames/$HOSTNAME_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result.status'
```

**Client setup**: They add a CNAME: `app.clientdomain.com → your-worker.your-domain.com`

### Email Routing Rules

```bash
# Enable email routing on zone
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/enable" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# Create a routing rule (forward info@ to a real address)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/rules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Forward info@",
    "enabled": true,
    "matchers": [{"type": "literal", "field": "to", "value": "info@example.com"}],
    "actions": [{"type": "forward", "value": ["real-inbox@gmail.com"]}]
  }' | jq '.success'

# Create catch-all rule
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/rules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Catch-all",
    "enabled": true,
    "matchers": [{"type": "all"}],
    "actions": [{"type": "forward", "value": ["catchall@company.com"]}]
  }' | jq '.success'

# List rules
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/rules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | {name, enabled, matchers, actions}'
```

### Cache Purge

```bash
# Purge everything (nuclear option)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything": true}'

# Purge specific URLs
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"files": ["https://example.com/styles.css", "https://example.com/app.js"]}'

# Purge by cache tag (requires Enterprise or cache tag headers)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["product-123", "homepage"]}'

# Purge by prefix
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prefixes": ["https://example.com/images/"]}'
```

### Redirect Rules (Bulk)

```bash
# Create a redirect rule
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_dynamic_redirect/entrypoint" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "expression": "(http.request.uri.path eq \"/old-page\")",
        "description": "Redirect old-page to new-page",
        "action": "redirect",
        "action_parameters": {
          "from_value": {
            "target_url": {"value": "https://example.com/new-page"},
            "status_code": 301
          }
        }
      }
    ]
  }'
```

**For bulk redirects** (301s from a CSV), generate the rules array programmatically:

```python
import json, csv

rules = []
with open('redirects.csv') as f:
    for row in csv.reader(f):
        old_path, new_url = row
        rules.append({
            "expression": f'(http.request.uri.path eq "{old_path}")',
            "description": f"Redirect {old_path}",
            "action": "redirect",
            "action_parameters": {
                "from_value": {
                    "target_url": {"value": new_url},
                    "status_code": 301
                }
            }
        })
print(json.dumps({"rules": rules}, indent=2))
```

### Zone Settings (Fleet-Wide)

Apply the same settings across multiple zones:

```bash
# Settings to apply
SETTINGS='{"value":"full"}'  # SSL mode: full (strict)

# Get all active zones
ZONES=$(curl -s "https://api.cloudflare.com/client/v4/zones?status=active&per_page=50" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[].id')

# Apply to each zone
for ZONE in $ZONES; do
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE/settings/ssl" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$SETTINGS" | jq "{zone: .result.id, success: .success}"
  sleep 0.25
done
```

Common fleet settings:
- `ssl` — "full" or "strict"
- `min_tls_version` — "1.2"
- `always_use_https` — "on"
- `security_level` — "medium"
- `browser_cache_ttl` — 14400

### WAF / Firewall Rules

```bash
# Create a WAF custom rule (block by country)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_firewall_custom/entrypoint" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [{
      "expression": "(ip.geoip.country in {\"RU\" \"CN\"})",
      "action": "block",
      "description": "Block traffic from RU and CN"
    }]
  }'

# Rate limiting rule
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_ratelimit/entrypoint" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [{
      "expression": "(http.request.uri.path contains \"/api/\")",
      "action": "block",
      "ratelimit": {
        "characteristics": ["ip.src"],
        "period": 60,
        "requests_per_period": 100
      },
      "description": "Rate limit API to 100 req/min per IP"
    }]
  }'
```

### Worker Routes

```bash
# List routes
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | {pattern, id}'

# Create route
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "api.example.com/*", "script": "my-worker"}'

# Delete route
curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes/$ROUTE_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### Analytics (GraphQL)

```bash
# Worker analytics (requests, errors, CPU time)
curl -s -X POST "https://api.cloudflare.com/client/v4/graphql" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ viewer { zones(filter: {zoneTag: \"'$ZONE_ID'\"}) { httpRequests1dGroups(limit: 7, filter: {date_gt: \"2026-03-10\"}) { dimensions { date } sum { requests pageViews } } } } }"
  }' | jq '.data.viewer.zones[0].httpRequests1dGroups'
```

## Rate Limits

| Endpoint | Limit |
|---------|-------|
| Most API calls | 1200 requests / 5 minutes |
| DNS record operations | 1200 / 5 min (shared with above) |
| Cache purge | 1000 purge calls / day |
| Zone creation | 5 per minute |

**In scripts**: Add `sleep 0.25` between calls for sustained operations. Use `p-limit` or `xargs -P 4` for controlled parallelism.

## Script Generation

When the user describes what they need, generate a script in `.jez/scripts/` that:
- Reads API token from environment (never hardcode)
- Handles pagination for list operations
- Includes error checking (`jq '.success'` after each call)
- Adds rate limit sleep between calls
- Logs what it does
- Supports `--dry-run` where possible

Prefer `curl` + `jq` for simple operations. Use Python for complex logic (pagination loops, error handling, CSV processing). Use TypeScript with the `cloudflare` npm package for type safety in larger scripts.

## API Reference

Base URL: `https://api.cloudflare.com/client/v4/`

Full docs: `https://developers.cloudflare.com/api/`

The API follows a consistent pattern:
- `GET /zones` — list
- `POST /zones` — create
- `GET /zones/:id` — read
- `PATCH /zones/:id` — update
- `DELETE /zones/:id` — delete
- `PUT /zones/:id/settings/:name` — update setting

Every response has `{ success: bool, errors: [], messages: [], result: {} }`.

## Reference Files

| When | Read |
|------|------|
| D1, R2, KV, Workers, Vectorize, Queues API patterns | [references/developer-platform-api.md](references/developer-platform-api.md) |
