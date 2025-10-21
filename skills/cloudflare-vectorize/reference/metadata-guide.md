# Metadata Filtering Guide

Complete reference for metadata indexes and filtering in Vectorize.

## Overview

Metadata allows you to:
- Store additional data alongside vectors (up to 10 KiB per vector)
- Filter query results based on metadata properties
- Narrow search scope without re-indexing

## Metadata Indexes

**⚠️ CRITICAL**: Metadata indexes MUST be created BEFORE inserting vectors!

Vectors inserted before a metadata index exists won't be filterable on that property.

### Creating Metadata Indexes

```bash
npx wrangler vectorize create-metadata-index <index-name> \
  --property-name=<property> \
  --type=<type>
```

**Types**: `string`, `number`, `boolean`

**Limits**:
- Max **10 metadata indexes** per Vectorize index
- **String**: First 64 bytes indexed (UTF-8 boundaries)
- **Number**: Float64 precision
- **Boolean**: true/false

### Example Setup

```bash
# Create index
npx wrangler vectorize create docs-search --dimensions=768 --metric=cosine

# Create metadata indexes IMMEDIATELY
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=category --type=string

npx wrangler vectorize create-metadata-index docs-search \
  --property-name=published_at --type=number

npx wrangler vectorize create-metadata-index docs-search \
  --property-name=verified --type=boolean

# Verify
npx wrangler vectorize list-metadata-index docs-search
```

## Metadata Schema

### Valid Metadata Keys

```typescript
// ✅ Valid keys
metadata: {
  category: 'docs',
  title: 'Getting Started',
  published_at: 1704067200,
  verified: true,
  nested: { allowed: true }
}

// ❌ Invalid keys
metadata: {
  '': 'value',               // Empty key
  'user.name': 'John',       // Contains dot (reserved for nesting)
  '$admin': true,            // Starts with $
  'key"quoted': 1            // Contains "
}
```

**Key restrictions**:
- Cannot be empty
- Cannot contain `.` (dot) - reserved for nested access
- Cannot contain `"` (double quote)
- Cannot start with `$` (dollar sign)
- Max 512 characters

### Nested Metadata

Use dot notation for nested properties:

```typescript
// Store nested metadata
metadata: {
  author: {
    id: 'user123',
    name: 'John Doe',
    verified: true
  }
}

// Filter with dot notation
filter: { 'author.verified': true }

// Create index for nested property
npx wrangler vectorize create-metadata-index docs-search \
  --property-name=author_verified \
  --type=boolean
```

## Filter Operators

### Equality

```typescript
// Implicit $eq
filter: { category: 'documentation' }

// Explicit $eq
filter: { category: { $eq: 'documentation' } }
```

### Not Equals

```typescript
filter: { status: { $ne: 'archived' } }
```

### In Array

```typescript
filter: { category: { $in: ['docs', 'tutorials', 'guides'] } }
```

### Not In Array

```typescript
filter: { status: { $nin: ['archived', 'draft', 'deleted'] } }
```

### Less Than

```typescript
filter: { published_at: { $lt: 1735689600 } }
```

### Less Than or Equal

```typescript
filter: { priority: { $lte: 5 } }
```

### Greater Than

```typescript
filter: { published_at: { $gt: 1704067200 } }
```

### Greater Than or Equal

```typescript
filter: { score: { $gte: 0.8 } }
```

## Range Queries

### Number Ranges

```typescript
// Documents published in 2024
filter: {
  published_at: {
    $gte: 1704067200,  // >= Jan 1, 2024
    $lt: 1735689600    // < Jan 1, 2025
  }
}

// Scores between 0.7 and 0.9
filter: {
  quality_score: {
    $gte: 0.7,
    $lte: 0.9
  }
}
```

### String Ranges (Prefix Search)

```typescript
// URLs starting with /docs/workers/
filter: {
  url: {
    $gte: '/docs/workers/',
    $lt: '/docs/workersz'  // 'z' after all possible chars
  }
}

// IDs starting with 'user-2024'
filter: {
  id: {
    $gte: 'user-2024',
    $lt: 'user-2025'
  }
}
```

## Combined Filters

Multiple conditions are combined with implicit **AND**:

```typescript
filter: {
  category: 'documentation',     // AND
  language: 'en',                // AND
  published: true,               // AND
  published_at: { $gte: 1704067200 } // AND
}
```

**No OR operator** - for OR logic, make multiple queries.

## Complex Examples

### Multi-field with Ranges

```typescript
filter: {
  category: { $in: ['docs', 'tutorials'] },
  language: 'en',
  status: { $ne: 'archived' },
  published_at: {
    $gte: 1704067200,
    $lt: 1735689600
  },
  'author.verified': true
}
```

### Boolean and String

```typescript
filter: {
  published: true,
  featured: false,
  category: 'documentation',
  language: { $in: ['en', 'es', 'fr'] }
}
```

### Nested with Range

```typescript
filter: {
  'metrics.views': { $gte: 1000 },
  'metrics.rating': { $gte: 4.5 },
  'author.verified': true,
  published_at: { $gt: Date.now() / 1000 - 86400 * 30 } // Last 30 days
}
```

## Cardinality Considerations

**Cardinality** = Number of unique values in a field

### Low Cardinality (Good for Filtering)

```typescript
// Few unique values - efficient
category: 'docs' | 'tutorials' | 'guides'  // ~3-10 values
language: 'en' | 'es' | 'fr'                // ~5-20 values
published: true | false                      // 2 values
```

### High Cardinality (Avoid in Range Queries)

```typescript
// Many unique values - can impact performance
user_id: 'uuid-v4-...'           // Millions of unique values
timestamp_ms: 1704067200123      // Unique per millisecond
email: 'user@example.com'        // Unique per user
```

### Performance Impact

**Range queries** on high-cardinality fields can be slow:

```typescript
// ❌ Slow: High cardinality range
filter: {
  user_id: {  // Millions of unique UUIDs
    $gte: '00000000-0000-0000-0000-000000000000',
    $lt: 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'
  }
}

// ✅ Better: Low cardinality range
filter: {
  published_at: {  // Timestamps in seconds
    $gte: 1704067200,
    $lt: 1735689600
  }
}
```

### Best Practices

1. **Use seconds, not milliseconds** for timestamps
2. **Categorize high-cardinality fields** (e.g., user → user_tier)
3. **Limit range span** to avoid scanning millions of values
4. **Use $eq for high cardinality**, not ranges

## Filter Size Limit

**Max 2048 bytes** (compact JSON representation)

```typescript
// Check filter size
const filterString = JSON.stringify(filter);
if (filterString.length > 2048) {
  console.error('Filter too large!');
}
```

If filter is too large:
- Split into multiple queries
- Simplify conditions
- Use namespace filtering first

## Namespace vs Metadata Filtering

### Namespace Filtering

```typescript
// Insert with namespace
await env.VECTORIZE_INDEX.upsert([{
  id: 'doc-1',
  values: embedding,
  namespace: 'customer-abc123',  // Partition key
  metadata: { type: 'support' }
}]);

// Query with namespace (applied FIRST)
const results = await env.VECTORIZE_INDEX.query(queryVector, {
  namespace: 'customer-abc123',
  filter: { type: 'support' }
});
```

### When to Use Each

| Use Namespace | Use Metadata |
|---------------|--------------|
| Multi-tenant isolation | Fine-grained filtering |
| Customer segmentation | Category filtering |
| Environment (dev/prod) | Date ranges |
| Large partitions | Boolean flags |
| Applied BEFORE metadata | Applied AFTER namespace |

### Combined Strategy

```typescript
// Namespace: Customer isolation
namespace: 'customer-abc123'

// Metadata: Detailed filtering
filter: {
  category: 'support_tickets',
  status: { $ne: 'closed' },
  priority: { $gte: 3 },
  created_at: { $gte: Date.now() / 1000 - 86400 * 7 } // Last 7 days
}
```

## Common Patterns

### Published Content Only

```typescript
filter: {
  published: true,
  status: { $ne: 'archived' }
}
```

### Recent Documents

```typescript
const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
filter: {
  published_at: { $gte: oneWeekAgo }
}
```

### Multi-Language Support

```typescript
filter: {
  language: { $in: ['en', 'es', 'fr'] },
  published: true
}
```

### Verified Authors Only

```typescript
filter: {
  'author.verified': true,
  'author.active': true
}
```

### Time-Based Content

```typescript
// Content from specific quarter
filter: {
  published_at: {
    $gte: 1704067200,  // Q1 2024 start
    $lt: 1711929600    // Q1 2024 end
  }
}
```

## Debugging Filters

### Test Filter Syntax

```bash
npx wrangler vectorize query docs-search \
  --vector="[0.1,0.2,...]" \
  --filter='{"category":"docs","published":true}' \
  --top-k=5
```

### Check Metadata Indexes

```bash
npx wrangler vectorize list-metadata-index docs-search
```

### Verify Metadata Structure

```typescript
const vectors = await env.VECTORIZE_INDEX.getByIds(['doc-1']);
console.log(vectors[0].metadata);
```

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Metadata property not indexed" | No metadata index for property | Create metadata index |
| "Filter exceeds 2048 bytes" | Filter JSON too large | Simplify or split queries |
| "Invalid metadata key" | Key contains `.`, `"`, or starts with `$` | Rename metadata key |
| "Filter must be non-empty object" | Empty filter `{}` | Remove filter or add conditions |

## See Also

- [Vector Operations](./vector-operations.md)
- [Wrangler Commands](./wrangler-commands.md)
- [Index Operations](./index-operations.md)
- [Official Docs](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/)
