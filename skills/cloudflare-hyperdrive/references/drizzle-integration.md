# Drizzle ORM Integration Guide

Complete guide to using Drizzle ORM with Cloudflare Hyperdrive.

---

## Overview

**Drizzle ORM** is a lightweight, TypeScript-first ORM with excellent type safety and performance.

**Why Drizzle + Hyperdrive?**
- ✅ Type-safe queries with full TypeScript support
- ✅ Zero runtime overhead (SQL is generated at build time)
- ✅ Works with both PostgreSQL and MySQL via Hyperdrive
- ✅ Simpler than Prisma (no code generation step in Worker)
- ✅ Better performance than traditional ORMs

---

## Installation

### PostgreSQL

```bash
# Drizzle ORM + postgres.js driver
npm install drizzle-orm postgres

# Dev dependencies
npm install -D drizzle-kit @types/node
```

### MySQL

```bash
# Drizzle ORM + mysql2 driver
npm install drizzle-orm mysql2

# Dev dependencies
npm install -D drizzle-kit @types/node
```

---

## PostgreSQL Setup

### 1. Define Schema

Create `src/db/schema.ts`:

```typescript
import { pgTable, serial, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  published: boolean("published").default(false),
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### 2. Use in Worker

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, posts } from "./db/schema";
import { eq } from "drizzle-orm";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    // Create postgres.js connection
    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      prepare: true,  // CRITICAL for caching
      fetch_types: false  // Disable if not using array types
    });

    // Create Drizzle client
    const db = drizzle(sql);

    try {
      // INSERT
      const [newUser] = await db.insert(users).values({
        name: "John Doe",
        email: `john.${Date.now()}@example.com`
      }).returning();

      // SELECT
      const allUsers = await db.select().from(users);

      // WHERE
      const user = await db.select()
        .from(users)
        .where(eq(users.email, "john@example.com"));

      // JOIN
      const usersWithPosts = await db.select()
        .from(users)
        .leftJoin(posts, eq(users.id, posts.authorId));

      // UPDATE
      await db.update(users)
        .set({ name: "Jane Doe" })
        .where(eq(users.id, newUser.id));

      // DELETE
      // await db.delete(users).where(eq(users.id, 123));

      return Response.json({
        newUser,
        allUsers,
        user,
        usersWithPosts
      });
    } finally {
      ctx.waitUntil(sql.end());
    }
  }
};
```

---

### 3. Configure Drizzle Kit (Migrations)

Create `drizzle.config.ts` in project root:

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Create `.env` file (for migrations only, NOT used in Worker):

```bash
# Direct connection to database (for migrations)
DATABASE_URL="postgres://user:password@host:5432/database"
```

---

### 4. Run Migrations

```bash
# Generate migration files from schema
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Push schema directly (no migration files)
npx drizzle-kit push
```

**Generated SQL** (in `drizzle/` folder):
```sql
-- drizzle/0000_initial.sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text,
  "published" boolean DEFAULT false,
  "author_id" serial NOT NULL,
  "created_at" timestamp DEFAULT now()
);

ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk"
  FOREIGN KEY ("author_id") REFERENCES "users"("id");
```

---

## MySQL Setup

### 1. Define Schema

Create `src/db/schema.ts`:

```typescript
import { mysqlTable, int, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = mysqlTable("posts", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  published: boolean("published").default(false),
  authorId: int("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### 2. Use in Worker

```typescript
import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2";
import { users, posts } from "./db/schema";
import { eq } from "drizzle-orm";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    // Create mysql2 connection
    const connection = createConnection({
      host: env.HYPERDRIVE.host,
      user: env.HYPERDRIVE.user,
      password: env.HYPERDRIVE.password,
      database: env.HYPERDRIVE.database,
      port: env.HYPERDRIVE.port,
      disableEval: true  // REQUIRED for Workers
    });

    // Create Drizzle client
    const db = drizzle(connection);

    try {
      // INSERT
      await db.insert(users).values({
        name: "John Doe",
        email: `john.${Date.now()}@example.com`
      });

      // SELECT
      const allUsers = await db.select().from(users);

      // WHERE
      const user = await db.select()
        .from(users)
        .where(eq(users.id, 1));

      return Response.json({ allUsers, user });
    } finally {
      ctx.waitUntil(
        new Promise<void>((resolve) => {
          connection.end(() => resolve());
        })
      );
    }
  }
};
```

---

### 3. Configure Drizzle Kit (MySQL)

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## Common Query Patterns

### Select Queries

```typescript
// All rows
const users = await db.select().from(users);

// With WHERE
const user = await db.select()
  .from(users)
  .where(eq(users.id, 1));

// Multiple conditions (AND)
import { and } from "drizzle-orm";
const activeUsers = await db.select()
  .from(users)
  .where(and(
    eq(users.active, true),
    gt(users.createdAt, new Date('2024-01-01'))
  ));

// Multiple conditions (OR)
import { or } from "drizzle-orm";
const result = await db.select()
  .from(users)
  .where(or(
    eq(users.role, 'admin'),
    eq(users.role, 'moderator')
  ));

// Limit & Offset
const recentUsers = await db.select()
  .from(users)
  .orderBy(users.createdAt)
  .limit(10)
  .offset(20);
```

---

### Insert Queries

```typescript
// Single insert
await db.insert(users).values({
  name: "John",
  email: "john@example.com"
});

// Multiple inserts
await db.insert(users).values([
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" }
]);

// Insert with RETURNING (PostgreSQL only)
const [newUser] = await db.insert(users).values({
  name: "John",
  email: "john@example.com"
}).returning();
```

---

### Update Queries

```typescript
// Update
await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, 1));

// Update with RETURNING (PostgreSQL)
const [updatedUser] = await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, 1))
  .returning();
```

---

### Delete Queries

```typescript
// Delete
await db.delete(users)
  .where(eq(users.id, 1));

// Delete with RETURNING (PostgreSQL)
const [deletedUser] = await db.delete(users)
  .where(eq(users.id, 1))
  .returning();
```

---

### Joins

```typescript
import { eq } from "drizzle-orm";

// Left join
const usersWithPosts = await db.select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));

// Inner join
const usersWithPublishedPosts = await db.select()
  .from(users)
  .innerJoin(posts, eq(users.id, posts.authorId))
  .where(eq(posts.published, true));

// Select specific columns
const result = await db.select({
  userName: users.name,
  postTitle: posts.title
})
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));
```

---

### Aggregations

```typescript
import { count, sum, avg } from "drizzle-orm";

// Count
const [{ total }] = await db.select({
  total: count()
}).from(users);

// Count with GROUP BY
const postCounts = await db.select({
  authorId: posts.authorId,
  count: count()
})
  .from(posts)
  .groupBy(posts.authorId);
```

---

## Relations

### Define Relations

```typescript
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### Query Relations

```typescript
// Include related data
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true
  }
});

// Nested relations
const usersWithPublishedPosts = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.published, true)
    }
  }
});
```

---

## TypeScript Types

### Infer Types from Schema

```typescript
import { users, posts } from "./db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Select types (what you get from SELECT queries)
type User = InferSelectModel<typeof users>;
type Post = InferSelectModel<typeof posts>;

// Insert types (what you need for INSERT queries)
type NewUser = InferInsertModel<typeof users>;
type NewPost = InferInsertModel<typeof posts>;

// Usage
const user: User = await db.select()
  .from(users)
  .where(eq(users.id, 1))
  .then(rows => rows[0]);

const newUser: NewUser = {
  name: "John",
  email: "john@example.com"
};
await db.insert(users).values(newUser);
```

---

## Best Practices

1. **Use prepared statements** (postgres.js: `prepare: true`)
2. **Set max: 5** for connection pools
3. **Use ctx.waitUntil()** for cleanup
4. **Define types** from schema with InferSelectModel
5. **Use relations** for complex queries instead of manual joins
6. **Run migrations** outside of Worker (use drizzle-kit CLI)
7. **Use .env for migrations** (DATABASE_URL), not in Worker
8. **Version control migrations** in `drizzle/` folder

---

## Drizzle vs Raw SQL

### Drizzle ORM

**Pros**:
- ✅ Type-safe queries
- ✅ Auto-completion in IDE
- ✅ Compile-time error checking
- ✅ Easy migrations with drizzle-kit
- ✅ Relational queries with `db.query`

**Cons**:
- ❌ Slight learning curve
- ❌ More setup than raw SQL

### Raw SQL

**Pros**:
- ✅ Full SQL control
- ✅ Simpler for simple queries
- ✅ No ORM overhead

**Cons**:
- ❌ No type safety
- ❌ Manual type definitions
- ❌ More error-prone

**Recommendation**: Use Drizzle for type safety and developer experience.

---

## References

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle PostgreSQL Guide](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle MySQL Guide](https://orm.drizzle.team/docs/get-started-mysql)
- [Drizzle Kit Docs](https://orm.drizzle.team/kit-docs/overview)
- [Hyperdrive Drizzle Example](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/drizzle-orm/)
