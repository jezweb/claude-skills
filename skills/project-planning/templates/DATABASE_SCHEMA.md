# Database Schema: [Project Name]

**Database**: Cloudflare D1 (SQLite)
**Migrations**: `migrations/` directory
**ORM**: [Drizzle ORM / Raw SQL / None]
**Schema Version**: 1.0
**Last Updated**: [Date]

---

## Overview

This document defines the complete database schema including tables, relationships, indexes, and migrations.

**Design Principles**:
- Normalize data to reduce redundancy
- Index frequently queried columns
- Use foreign keys for referential integrity
- Include timestamps for audit trail
- Use INTEGER for IDs (SQLite auto-increment)
- Use TEXT for strings (SQLite doesn't enforce varchar limits)
- Use INTEGER for booleans (0 = false, 1 = true)
- Use INTEGER for timestamps (Unix epoch)

---

## Tables

### `users`
**Purpose**: User accounts and authentication data

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | INTEGER | PRIMARY KEY | AUTO | Auto-increment |
| `email` | TEXT | UNIQUE, NOT NULL | - | Login identifier |
| `clerk_id` | TEXT | UNIQUE, NOT NULL | - | Clerk user ID |
| `display_name` | TEXT | NULL | - | User's display name |
| `avatar_url` | TEXT | NULL | - | Profile picture URL (R2) |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp |

**Indexes**:
- `idx_users_email` on `email` (for login lookups)
- `idx_users_clerk_id` on `clerk_id` (for auth verification)

**Relationships**:
- One-to-many with `[related_table]`

**Notes**:
- `clerk_id` comes from Clerk authentication
- `avatar_url` points to R2 storage if user uploads custom avatar
- Emails are unique and used for account identification

---

### `[table_name]`
**Purpose**: [Description of what this table stores]

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | INTEGER | PRIMARY KEY | AUTO | Auto-increment |
| `user_id` | INTEGER | FOREIGN KEY, NOT NULL | - | References `users(id)` |
| `[field]` | [TYPE] | [CONSTRAINTS] | [DEFAULT] | [Notes] |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp |

**Indexes**:
- `idx_[table]_user_id` on `user_id` (for user-specific queries)
- `idx_[table]_[field]` on `[field]` (if frequently queried)

**Relationships**:
- Many-to-one with `users`
- [Other relationships]

**Notes**:
- [Important details about this table]

---

### `[junction_table]` (for many-to-many relationships)
**Purpose**: Links [table_a] and [table_b] in many-to-many relationship

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | INTEGER | PRIMARY KEY | AUTO | Auto-increment |
| `[table_a]_id` | INTEGER | FOREIGN KEY, NOT NULL | - | References `[table_a](id)` |
| `[table_b]_id` | INTEGER | FOREIGN KEY, NOT NULL | - | References `[table_b](id)` |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp |

**Indexes**:
- `idx_[junction]_[table_a]_id` on `[table_a]_id`
- `idx_[junction]_[table_b]_id` on `[table_b]_id`
- `idx_[junction]_composite` on `([table_a]_id, [table_b]_id)` UNIQUE

**Relationships**:
- Many-to-one with `[table_a]`
- Many-to-one with `[table_b]`

**Notes**:
- Composite unique index prevents duplicate associations

---

## Relationships Diagram

```
┌─────────────┐
│   users     │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│  [child_table]  │
└─────────────────┘

[Add more relationships as needed]
```

---

## Migrations

### Migration 0001: Initial Schema
**File**: `migrations/0001_initial_schema.sql`
**Created**: [Date]
**Purpose**: Create initial tables for [core entities]

**Creates**:
- `users` table
- `[other_tables]` tables

**Indexes**:
- All primary indexes for frequently queried columns

**Run**:
```bash
npx wrangler d1 execute [DB_NAME] --local --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute [DB_NAME] --remote --file=migrations/0001_initial_schema.sql
```

---

### Migration 0002: [Description]
**File**: `migrations/0002_[name].sql`
**Created**: [Date]
**Purpose**: [What this migration does]

**Changes**:
- Add `[column]` to `[table]`
- Create `[new_table]` table
- Add index `[index_name]`

**Run**:
```bash
npx wrangler d1 execute [DB_NAME] --local --file=migrations/0002_[name].sql
npx wrangler d1 execute [DB_NAME] --remote --file=migrations/0002_[name].sql
```

---

## Seed Data

For development and testing, seed the database with sample data.

**File**: `migrations/seed.sql` (run manually, not in production)

**Sample Data**:
- 3-5 test users
- [Other sample data relevant to testing]

**Run**:
```bash
npx wrangler d1 execute [DB_NAME] --local --file=migrations/seed.sql
```

**Sample Users**:
```sql
INSERT INTO users (email, clerk_id, display_name, created_at, updated_at)
VALUES
  ('test1@example.com', 'clerk_test_1', 'Test User 1', strftime('%s', 'now'), strftime('%s', 'now')),
  ('test2@example.com', 'clerk_test_2', 'Test User 2', strftime('%s', 'now'), strftime('%s', 'now')),
  ('test3@example.com', 'clerk_test_3', 'Test User 3', strftime('%s', 'now'), strftime('%s', 'now'));
```

---

## Query Patterns

### Common Queries

**Get user by email**:
```sql
SELECT * FROM users WHERE email = ?;
```

**Get all [items] for a user**:
```sql
SELECT * FROM [table] WHERE user_id = ? ORDER BY created_at DESC;
```

**Get [item] with related data**:
```sql
SELECT
  [table].*,
  users.display_name,
  users.avatar_url
FROM [table]
JOIN users ON [table].user_id = users.id
WHERE [table].id = ?;
```

---

## Constraints and Validation

### Enforced at Database Level
- Primary keys (unique, not null)
- Foreign keys (referential integrity)
- Unique constraints (email, composite indexes)
- Not null constraints (required fields)

### Enforced at Application Level (Zod)
- Email format validation
- String length limits
- Enum values
- Complex business logic

**Why split?**: Database enforces data integrity, application provides user-friendly error messages.

---

## Backup and Restore

### Export Database
```bash
npx wrangler d1 export [DB_NAME] --local --output=backup.sql
npx wrangler d1 export [DB_NAME] --remote --output=backup.sql
```

### Import Database
```bash
npx wrangler d1 execute [DB_NAME] --local --file=backup.sql
npx wrangler d1 execute [DB_NAME] --remote --file=backup.sql
```

---

## Performance Considerations

**Indexes**: All frequently queried columns are indexed
**Query Optimization**: Use `EXPLAIN QUERY PLAN` to check query performance
**Pagination**: Use `LIMIT` and `OFFSET` for large result sets
**Caching**: Consider Workers KV for frequently accessed, rarely changed data

---

## Future Enhancements

Potential schema changes to consider:
- [ ] [Feature requiring schema change]
- [ ] [Another potential enhancement]

---

## Revision History

**v1.0** ([Date]): Initial schema design
**v1.1** ([Date]): [Changes made]
