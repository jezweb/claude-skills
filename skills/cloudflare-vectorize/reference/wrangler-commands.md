# Wrangler Vectorize Commands Reference

Complete CLI reference for managing Cloudflare Vectorize indexes with Wrangler.

**Minimum Version Required**: Wrangler 3.71.0+

## Index Management

### create

Create a new Vectorize index.

**⚠️ CRITICAL**: Dimensions and metric cannot be changed after creation!

```bash
npx wrangler vectorize create <INDEX_NAME> \
  --dimensions=<NUMBER> \
  --metric=<METRIC> \
  [--description=<TEXT>]
```

**Parameters**:
- `INDEX_NAME` (required): Name of the index (lowercase, alphanumeric, dashes, max 32 chars)
- `--dimensions` (required): Vector width (768 for Workers AI bge-base, 1536 for OpenAI small, 3072 for OpenAI large)
- `--metric` (required): Distance metric (`cosine`, `euclidean`, or `dot-product`)
- `--description` (optional): Human-readable description

**Examples**:
```bash
# Workers AI @cf/baai/bge-base-en-v1.5 (768 dimensions)
npx wrangler vectorize create docs-search \
  --dimensions=768 \
  --metric=cosine \
  --description="Documentation semantic search"

# OpenAI text-embedding-3-small (1536 dimensions)
npx wrangler vectorize create product-recs \
  --dimensions=1536 \
  --metric=cosine

# OpenAI text-embedding-3-large (3072 dimensions)
npx wrangler vectorize create high-accuracy-index \
  --dimensions=3072 \
  --metric=euclidean
```

### list

List all Vectorize indexes in your account.

```bash
npx wrangler vectorize list
```

**Output**: Table with index names, dimensions, and distance metrics.

### get

Get details about a specific index.

```bash
npx wrangler vectorize get <INDEX_NAME>
```

**Returns**: Index configuration (name, dimensions, metric, description).

### info

Get additional information about an index.

```bash
npx wrangler vectorize info <INDEX_NAME>
```

**Returns**: Vector count, last processed mutation, index status.

### delete

Delete a Vectorize index (irreversible!).

```bash
npx wrangler vectorize delete <INDEX_NAME> [--force]
```

**Parameters**:
- `--force` (optional): Skip confirmation prompt

**Example**:
```bash
npx wrangler vectorize delete old-index --force
```

## Metadata Indexes

**⚠️ CRITICAL**: Create metadata indexes BEFORE inserting vectors! Vectors added before a metadata index exists won't be filterable on that property.

### create-metadata-index

Enable metadata filtering on a specific property.

```bash
npx wrangler vectorize create-metadata-index <INDEX_NAME> \
  --property-name=<PROPERTY> \
  --type=<TYPE>
```

**Parameters**:
- `INDEX_NAME` (required): Vectorize index name
- `--property-name` (required): Metadata field name
- `--type` (required): Data type (`string`, `number`, or `boolean`)

**Limits**:
- Max 10 metadata indexes per Vectorize index
- String indexes: First 64 bytes (UTF-8)
- Number indexes: Float64 precision

**Examples**:
```bash
# String metadata (category filtering)
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=category \
  --type=string

# Number metadata (timestamp filtering)
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=published_at \
  --type=number

# Boolean metadata (published status)
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=published \
  --type=boolean

# Nested metadata (use dot notation)
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=author_verified \
  --type=boolean
```

### list-metadata-index

List all metadata indexes for an index.

```bash
npx wrangler vectorize list-metadata-index <INDEX_NAME>
```

**Output**: Table with property names and types.

### delete-metadata-index

Disable metadata filtering on a property.

```bash
npx wrangler vectorize delete-metadata-index <INDEX_NAME> \
  --property-name=<PROPERTY>
```

**Example**:
```bash
npx wrangler vectorize delete-metadata-index docs-search \
  --property-name=category
```

## Vector Operations

### insert

Insert vectors from a file (NDJSON format).

```bash
npx wrangler vectorize insert <INDEX_NAME> \
  --file=<PATH>
```

**File Format** (NDJSON - one JSON object per line):
```json
{"id":"1","values":[0.1,0.2,0.3],"metadata":{"title":"Doc 1"}}
{"id":"2","values":[0.4,0.5,0.6],"metadata":{"title":"Doc 2"}}
```

**Example**:
```bash
npx wrangler vectorize insert docs-search --file=vectors.ndjson
```

### query

Query vectors directly from CLI.

```bash
npx wrangler vectorize query <INDEX_NAME> \
  --vector="[<COMMA_SEPARATED_FLOATS>]" \
  [--top-k=<NUMBER>] \
  [--return-metadata=<MODE>] \
  [--namespace=<NAMESPACE>] \
  [--filter=<JSON>]
```

**Parameters**:
- `--vector` (required): Query vector as JSON array
- `--top-k` (optional): Number of results (default: 10)
- `--return-metadata` (optional): `none`, `indexed`, or `all` (default: `none`)
- `--namespace` (optional): Query specific namespace
- `--filter` (optional): Metadata filter as JSON string

**Examples**:
```bash
# Simple query
npx wrangler vectorize query docs-search \
  --vector="[0.1,0.2,0.3,...]" \
  --top-k=5 \
  --return-metadata=all

# Query with filter
npx wrangler vectorize query docs-search \
  --vector="[0.1,0.2,...]" \
  --filter='{"category":"documentation","published":true}' \
  --top-k=3

# Query specific namespace
npx wrangler vectorize query docs-search \
  --vector="[0.1,0.2,...]" \
  --namespace="customer-123" \
  --top-k=5
```

### list-vectors

List vector IDs in paginated manner.

```bash
npx wrangler vectorize list-vectors <INDEX_NAME> \
  [--count=<NUMBER>] \
  [--cursor=<CURSOR>]
```

**Parameters**:
- `--count` (optional): Vectors per page (1-1000, default: 100)
- `--cursor` (optional): Pagination cursor from previous response

**Example**:
```bash
# Get first 100 vector IDs
npx wrangler vectorize list-vectors docs-search --count=100

# Get next page (use cursor from previous response)
npx wrangler vectorize list-vectors docs-search \
  --count=100 \
  --cursor="abc123..."
```

### get-vectors

Fetch specific vectors by ID.

```bash
npx wrangler vectorize get-vectors <INDEX_NAME> \
  --ids=<ID1,ID2,ID3>
```

**Example**:
```bash
npx wrangler vectorize get-vectors docs-search \
  --ids="doc-1,doc-2,doc-3"
```

### delete-vectors

Delete vectors by ID.

```bash
npx wrangler vectorize delete-vectors <INDEX_NAME> \
  --ids=<ID1,ID2,ID3>
```

**Example**:
```bash
npx wrangler vectorize delete-vectors docs-search \
  --ids="old-doc-1,old-doc-2"
```

## Common Workflows

### Initial Setup

```bash
# 1. Create index
npx wrangler vectorize create my-index \
  --dimensions=768 \
  --metric=cosine

# 2. Create metadata indexes (BEFORE inserting!)
npx wrangler vectorize create-metadata-index my-index \
  --property-name=category --type=string

npx wrangler vectorize create-metadata-index my-index \
  --property-name=timestamp --type=number

# 3. Verify metadata indexes
npx wrangler vectorize list-metadata-index my-index

# 4. Now safe to insert vectors (via Worker or CLI)
```

### Bulk Data Import

```bash
# Prepare NDJSON file
cat > vectors.ndjson << 'EOF'
{"id":"doc-1","values":[0.1,0.2,0.3,...],"metadata":{"category":"docs"}}
{"id":"doc-2","values":[0.4,0.5,0.6,...],"metadata":{"category":"tutorials"}}
EOF

# Import
npx wrangler vectorize insert my-index --file=vectors.ndjson

# Verify
npx wrangler vectorize info my-index
```

### Debug / Inspect

```bash
# Check index configuration
npx wrangler vectorize get my-index

# Check vector count
npx wrangler vectorize info my-index

# List some vector IDs
npx wrangler vectorize list-vectors my-index --count=10

# Inspect specific vectors
npx wrangler vectorize get-vectors my-index --ids="doc-1,doc-2"

# Test query
npx wrangler vectorize query my-index \
  --vector="[0.1,0.2,...]" \
  --top-k=3 \
  --return-metadata=all
```

### Cleanup

```bash
# Delete specific vectors
npx wrangler vectorize delete-vectors my-index --ids="doc-1,doc-2"

# Delete entire index (irreversible!)
npx wrangler vectorize delete my-index --force
```

## Tips & Best Practices

1. **Always use latest Wrangler**: `npx wrangler@latest vectorize ...`
2. **Create metadata indexes first**: Before any vector insertion
3. **Test with small data**: Use `--count=10` when listing/testing
4. **Batch operations**: Use Workers for bulk operations (faster than CLI)
5. **Monitor vector count**: Use `info` command to track index size
6. **Verify before delete**: Always check with `get` before `delete`

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Wrangler version 3.71.0 required" | Old Wrangler | Update: `npm install -g wrangler@latest` |
| "Vector dimensions do not match" | Wrong embedding size | Check model output dimensions |
| "Metadata property not indexed" | Metadata index missing | Create metadata index before querying |
| "Index name already exists" | Duplicate name | Use different name or delete old index |
| "Invalid filter syntax" | Malformed JSON filter | Check JSON syntax and operators |

## See Also

- [Index Operations](./index-operations.md)
- [Vector Operations](./vector-operations.md)
- [Metadata Guide](./metadata-guide.md)
- [Official Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/commands/#vectorize)
