---
name: db-seed
description: "Generate database seed scripts with realistic sample data. Reads Drizzle schemas or SQL migrations, respects foreign key ordering, produces idempotent TypeScript or SQL seed files. Handles D1 batch limits, unique constraints, and domain-appropriate data. Use when populating dev/demo/test databases. Triggers: 'seed database', 'seed data', 'sample data', 'populate database', 'db seed', 'test data', 'demo data', 'generate fixtures'."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
compatibility: claude-code-only
---

# Database Seed Generator

Generate seed scripts that populate databases with realistic, domain-appropriate sample data. Reads your schema and produces ready-to-run seed files.

## Workflow

### 1. Find the Schema

Scan the project for schema definitions:

| Source | Location pattern |
|--------|-----------------|
| Drizzle schema | `src/db/schema.ts`, `src/schema/*.ts`, `db/schema.ts` |
| D1 migrations | `drizzle/*.sql`, `migrations/*.sql` |
| Raw SQL | `schema.sql`, `db/*.sql` |
| Prisma | `prisma/schema.prisma` |

Read all schema files. Build a mental model of:
- Tables and their columns
- Data types and constraints (NOT NULL, UNIQUE, DEFAULT)
- Foreign key relationships (which tables reference which)
- JSON fields stored as TEXT (common in D1/SQLite)

### 2. Determine Seed Parameters

Ask the user:

| Parameter | Options | Default |
|-----------|---------|---------|
| Purpose | dev, demo, testing | dev |
| Volume | small (5-10 rows/table), medium (20-50), large (100+) | small |
| Domain context | "e-commerce store", "SaaS app", "blog", etc. | Infer from schema |
| Output format | TypeScript (Drizzle), raw SQL, or both | Match project's ORM |

**Purpose affects data quality**:
- **dev**: Varied data, some edge cases (empty fields, long strings, unicode)
- **demo**: Polished data that looks good in screenshots and presentations
- **testing**: Systematic data covering boundary conditions, duplicates, special characters

### 3. Plan Insert Order

Build a dependency graph from foreign keys. Insert parent tables before children.

Example order for a blog schema:
```
1. users        (no dependencies)
2. categories   (no dependencies)
3. posts        (depends on users, categories)
4. comments     (depends on users, posts)
5. tags         (no dependencies)
6. post_tags    (depends on posts, tags)
```

**Circular dependencies**: If table A references B and B references A, use nullable foreign keys and insert in two passes (insert with NULL, then UPDATE).

### 4. Generate Realistic Data

**Do NOT use generic placeholders** like "test123", "foo@bar.com", or "Lorem ipsum". Generate data that matches the domain.

#### Data Generation Patterns (no external libraries needed)

**Names**: Use a hardcoded list of common names. Mix genders and cultural backgrounds.
```typescript
const firstNames = ['Sarah', 'James', 'Priya', 'Mohammed', 'Emma', 'Wei', 'Carlos', 'Aisha'];
const lastNames = ['Chen', 'Smith', 'Patel', 'Garcia', 'Kim', 'O\'Brien', 'Nguyen', 'Wilson'];
```

**Emails**: Derive from names — `sarah.chen@example.com`. Use `example.com` domain (RFC 2606 reserved).

**Dates**: Generate within a realistic range. Use ISO 8601 format for D1/SQLite.
```typescript
const randomDate = (daysBack: number) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString();
};
```

**IDs**: Use `crypto.randomUUID()` for UUIDs, or sequential integers if the schema uses auto-increment.

**Deterministic seeding**: For reproducible data, use a seeded PRNG:
```typescript
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const rand = seededRandom(42); // Same seed = same data every time
```

**Prices/amounts**: Use realistic ranges. `(rand() * 900 + 100).toFixed(2)` for $1-$10 range.

**Descriptions/content**: Write 3-5 realistic variations per content type and cycle through them. Don't generate AI-sounding prose — write like real user data.

### 5. Output Format

#### TypeScript (Drizzle ORM)

```typescript
// scripts/seed.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../src/db/schema';

export async function seed(db: ReturnType<typeof drizzle>) {
  console.log('Seeding database...');

  // Clear existing data (reverse dependency order)
  await db.delete(schema.comments);
  await db.delete(schema.posts);
  await db.delete(schema.users);

  // Insert users
  const users = [
    { id: crypto.randomUUID(), name: 'Sarah Chen', email: 'sarah@example.com', ... },
    // ...
  ];

  // D1 batch limit: 10 rows per INSERT
  for (let i = 0; i < users.length; i += 10) {
    await db.insert(schema.users).values(users.slice(i, i + 10));
  }

  // Insert posts (references users)
  const posts = [
    { id: crypto.randomUUID(), userId: users[0].id, title: '...', ... },
    // ...
  ];

  for (let i = 0; i < posts.length; i += 10) {
    await db.insert(schema.posts).values(posts.slice(i, i + 10));
  }

  console.log(`Seeded: ${users.length} users, ${posts.length} posts`);
}
```

Run with: `npx tsx scripts/seed.ts`

For Cloudflare Workers, add a seed endpoint (remove before production):
```typescript
app.post('/api/seed', async (c) => {
  const db = drizzle(c.env.DB);
  await seed(db);
  return c.json({ ok: true });
});
```

#### Raw SQL (D1)

```sql
-- seed.sql
-- Run: npx wrangler d1 execute DB_NAME --local --file=./scripts/seed.sql

-- Clear existing (reverse order)
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM users;

-- Users
INSERT INTO users (id, name, email, created_at) VALUES
  ('uuid-1', 'Sarah Chen', 'sarah@example.com', '2025-01-15T10:30:00Z'),
  ('uuid-2', 'James Wilson', 'james@example.com', '2025-02-01T14:22:00Z');

-- Posts (max 10 rows per INSERT for D1)
INSERT INTO posts (id, user_id, title, body, created_at) VALUES
  ('post-1', 'uuid-1', 'Getting Started', 'Welcome to...', '2025-03-01T09:00:00Z');
```

### 6. Idempotency

Seed scripts must be safe to re-run:

```typescript
// Option A: Delete-then-insert (simple, loses data)
await db.delete(schema.users);
await db.insert(schema.users).values(seedUsers);

// Option B: Upsert (preserves non-seed data)
for (const user of seedUsers) {
  await db.insert(schema.users)
    .values(user)
    .onConflictDoUpdate({ target: schema.users.id, set: user });
}
```

Default to Option A for dev/testing, Option B for demo (where users may have added their own data).

## D1-Specific Gotchas

| Gotcha | Solution |
|--------|----------|
| Max ~10 rows per INSERT | Batch inserts in chunks of 10 |
| No native BOOLEAN | Use INTEGER (0/1) |
| No native DATETIME | Use TEXT with ISO 8601 strings |
| JSON stored as TEXT | `JSON.stringify()` before insert |
| Foreign keys always enforced | Insert parent tables first |
| 100 bound parameter limit | Keep batch size × columns < 100 |

## Quality Rules

1. **Match the domain** — an e-commerce seed has products with real-sounding names and prices, not "Product 1"
2. **Vary the data** — don't make every user "John Smith" or every price "$9.99"
3. **Include edge cases** (for testing seeds) — empty strings, very long text, special characters, maximum values
4. **Reference real IDs** — foreign keys must point to actually-inserted parent rows
5. **Print what was seeded** — always log counts so the user knows it worked
6. **Document the run command** — put it in a comment at the top of the file
