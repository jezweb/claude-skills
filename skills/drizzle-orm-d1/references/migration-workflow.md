# Migration Workflow

Complete guide to database migrations with Drizzle Kit and Wrangler.

---

## Generate vs Push

### `drizzle-kit generate`
- Creates SQL migration files in `./migrations`
- Versioned, trackable in Git
- Can be reviewed before applying
- **Recommended for production**

### `drizzle-kit push`
- Pushes schema directly to database
- No SQL files generated
- Fast for prototyping
- **Not recommended for production**

---

## Complete Workflow

### 1. Make Schema Changes

Edit `src/db/schema.ts`:

```typescript
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  // Add new field
  role: text('role').notNull().default('user'),
});
```

### 2. Generate Migration

```bash
npx drizzle-kit generate
# or
npm run db:generate
```

Output:
```
Generated migration:
./migrations/0002_add_user_role.sql
```

### 3. Review Generated SQL

Check `./migrations/0002_add_user_role.sql`:

```sql
ALTER TABLE users ADD COLUMN role text DEFAULT 'user' NOT NULL;
```

### 4. Apply to Local Database

```bash
npx wrangler d1 migrations apply my-database --local
# or
npm run db:migrate:local
```

### 5. Test Locally

```bash
npm run dev
# Test your changes
```

### 6. Commit Migration

```bash
git add migrations/0002_add_user_role.sql
git commit -m "Add user role field"
git push
```

### 7. Deploy Code

```bash
npm run deploy
```

### 8. Apply to Production

```bash
npx wrangler d1 migrations apply my-database --remote
# or
npm run db:migrate:remote
```

---

## Best Practices

1. **Always test locally first**
2. **Review generated SQL** before applying
3. **Commit migrations to Git**
4. **Apply migrations in CI/CD** for production
5. **Never skip migrations** - apply in order
6. **Backup production database** before major changes

---

## Troubleshooting

### Migration Fails

```bash
# Delete failed migration
rm migrations/0002_bad_migration.sql

# Regenerate
npx drizzle-kit generate
```

### Need to Rollback

D1 doesn't support automatic rollback. Options:
1. Create a new migration to reverse changes
2. Restore from backup
3. Manually edit data with SQL

---

## Migration Naming

Drizzle auto-generates names like:
- `0001_initial_schema.sql`
- `0002_add_user_role.sql`
- `0003_create_posts_table.sql`

---

## Advanced: Custom Migrations

Sometimes you need custom SQL:

```sql
-- migrations/0004_custom.sql

-- Add data
INSERT INTO users (email, name, role) VALUES
  ('admin@example.com', 'Admin', 'admin');

-- Update existing data
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Create index
CREATE INDEX idx_users_role ON users(role);
```
