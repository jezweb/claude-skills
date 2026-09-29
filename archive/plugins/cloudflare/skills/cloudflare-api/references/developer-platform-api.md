# Developer Platform API Patterns

REST API patterns for Cloudflare's developer platform services: D1, R2, KV, Workers, Vectorize, Queues, and Durable Objects. These complement what wrangler does — use the API for bulk operations, cross-database queries, automation scripts, and operations wrangler doesn't expose.

All endpoints use: `https://api.cloudflare.com/client/v4/accounts/{account_id}/...`

---

## D1 (SQL Database)

### List Databases

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {uuid, name, num_tables, file_size, version}'
```

### Query a Database

```bash
# Run SQL directly via API (useful for scripts, automation, debugging)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/query" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM users LIMIT 10"}' \
  | jq '.result[0].results'

# With parameters (prevents SQL injection)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/query" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM users WHERE email = ?1", "params": ["jez@example.com"]}' \
  | jq '.result[0].results'
```

### Raw SQL via API (Batch)

```bash
# Run multiple statements in one call
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/raw" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "INSERT INTO users (id, name, email) VALUES (?1, ?2, ?3); INSERT INTO users (id, name, email) VALUES (?4, ?5, ?6);",
    "params": ["id1", "Alice", "alice@example.com", "id2", "Bob", "bob@example.com"]
  }'
```

### Export/Backup a D1 Database

```bash
# Export as SQL dump
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/export" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"output_format": "file"}' \
  | jq '.result'

# Then poll for the export to complete and download
```

### Cross-Database Operations

Wrangler can only talk to one database at a time. The API lets you script across multiple:

```python
import json, urllib.request

def query_d1(db_id, sql, params=None):
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{db_id}/query"
    payload = {"sql": sql}
    if params:
        payload["params"] = params
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())["result"][0]["results"]

# Query across multiple D1 databases
for db_name, db_id in databases.items():
    users = query_d1(db_id, "SELECT COUNT(*) as count FROM users")
    print(f"{db_name}: {users[0]['count']} users")
```

### D1 Gotchas via API

- Max 100KB per single SQL statement
- Max 1000 bound parameters per query
- `query` endpoint returns results; `raw` endpoint for DDL/DML without result sets
- Export is async — returns a bookmark to poll, not the dump directly

---

## R2 (Object Storage)

### List Buckets

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result.buckets[] | {name, creation_date}'
```

### Create Bucket

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-bucket", "locationHint": "apac"}'
```

### List Objects in a Bucket (S3 API)

R2 objects are managed via the S3-compatible API, not the Cloudflare API:

```bash
# Using AWS CLI with R2 credentials
aws s3api list-objects-v2 \
  --bucket my-bucket \
  --endpoint-url "https://$ACCOUNT_ID.r2.cloudflarestorage.com" \
  --max-keys 100 \
  | jq '.Contents[] | {Key, Size, LastModified}'
```

### Bulk Delete Objects

```bash
# Delete all objects matching a prefix
aws s3 rm "s3://my-bucket/uploads/2025/" \
  --endpoint-url "https://$ACCOUNT_ID.r2.cloudflarestorage.com" \
  --recursive
```

### R2 Usage Stats

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/usage" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result'
```

---

## KV (Key-Value Store)

### List Namespaces

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {id, title}'
```

### Read/Write Values

```bash
# Write
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NS_ID/values/my-key" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -d "my-value"

# Write with metadata and expiration
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NS_ID/values/my-key" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "value=my-value" \
  -F 'metadata={"source": "api"}' \
  -F "expiration_ttl=3600"

# Read
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NS_ID/values/my-key" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# Delete
curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NS_ID/values/my-key" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### List All Keys (with pagination)

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NS_ID/keys?limit=1000" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | .name'
```

### Bulk Write (up to 10,000 pairs)

```bash
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NS_ID/bulk" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"key": "key1", "value": "value1"},
    {"key": "key2", "value": "value2", "expiration_ttl": 3600}
  ]'
```

### Bulk Delete

```bash
curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces/$NS_ID/bulk" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["key1", "key2", "key3"]'
```

---

## Workers

### List Workers

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {id, modified_on, usage_model}'
```

### Get Worker Details

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result'
```

### Get Worker Settings (Bindings, Compatibility)

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/settings" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result | {bindings, compatibility_date, compatibility_flags}'
```

### List All Worker Bindings Across Account

Useful for auditing what's connected to what:

```python
import json, urllib.request

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
workers = json.loads(urllib.request.urlopen(req).read())["result"]

for w in workers:
    settings_url = f"{url}/{w['id']}/settings"
    req = urllib.request.Request(settings_url, headers={"Authorization": f"Bearer {TOKEN}"})
    settings = json.loads(urllib.request.urlopen(req).read())["result"]
    bindings = settings.get("bindings", [])
    if bindings:
        print(f"\n{w['id']}:")
        for b in bindings:
            print(f"  {b['type']}: {b.get('name', '')} → {b.get('namespace_id', b.get('database_id', b.get('bucket_name', '')))}")
```

### Worker Subdomain

```bash
# Get current subdomain
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/subdomain" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result.subdomain'
```

---

## Vectorize

### List Indexes

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/vectorize/v2/indexes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {name, config}'
```

### Get Index Info

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/vectorize/v2/indexes/$INDEX_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result'
```

### Query Vectors

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/vectorize/v2/indexes/$INDEX_NAME/query" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "topK": 10,
    "returnValues": false,
    "returnMetadata": "all",
    "filter": {"type": {"$eq": "client"}}
  }'
```

### Delete Vectors by ID

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/vectorize/v2/indexes/$INDEX_NAME/delete-by-ids" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["vec-1", "vec-2"]}'
```

### Vectorize Gotchas

- Metadata indexes must be created BEFORE inserting vectors (vectors inserted before are NOT retroactively indexed)
- Max 1000 vectors per upsert call
- Metadata filter values are case-sensitive

---

## Queues

### List Queues

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/queues" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {queue_id, queue_name, producers_total_count, consumers_total_count}'
```

### Send Message to Queue

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/queues/$QUEUE_ID/messages" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": {"task": "process_image", "id": "123"}}'
```

### Bulk Send Messages

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/queues/$QUEUE_ID/messages/batch" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"body": {"task": "resize", "id": "1"}},
      {"body": {"task": "resize", "id": "2"}}
    ]
  }'
```

---

## Fleet Operations

### Audit All Resources Across Account

Generate a full inventory of what's deployed:

```python
import json, urllib.request

BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def get(path):
    req = urllib.request.Request(f"{BASE}/{path}", headers=HEADERS)
    return json.loads(urllib.request.urlopen(req).read()).get("result", [])

print("=== Workers ===")
for w in get("workers/scripts"):
    print(f"  {w['id']}")

print("\n=== D1 Databases ===")
for db in get("d1/database"):
    print(f"  {db['name']} ({db['uuid'][:8]}...)")

print("\n=== R2 Buckets ===")
for b in get("r2/buckets").get("buckets", []):
    print(f"  {b['name']}")

print("\n=== KV Namespaces ===")
for ns in get("storage/kv/namespaces"):
    print(f"  {ns['title']} ({ns['id'][:8]}...)")

print("\n=== Vectorize Indexes ===")
for idx in get("vectorize/v2/indexes"):
    print(f"  {idx['name']}")

print("\n=== Queues ===")
for q in get("queues"):
    print(f"  {q['queue_name']}")
```

### Compare Resources Across Two Accounts

Useful when migrating between Jezweb Team and Jez Personal accounts:

```python
accounts = {
    "team": "YOUR_TEAM_ACCOUNT_ID",
    "personal": "YOUR_PERSONAL_ACCOUNT_ID",
}

for name, acct_id in accounts.items():
    workers = get_for_account(acct_id, "workers/scripts")
    d1s = get_for_account(acct_id, "d1/database")
    print(f"\n{name}: {len(workers)} workers, {len(d1s)} D1 databases")
```
