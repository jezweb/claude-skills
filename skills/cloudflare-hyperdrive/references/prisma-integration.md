# Prisma ORM Integration Guide

Complete guide to using Prisma ORM with Cloudflare Hyperdrive.

---

## Overview

**Prisma ORM** is a popular Node.js and TypeScript ORM focused on type safety and developer experience.

**Why Prisma + Hyperdrive?**
- ✅ Excellent TypeScript support and auto-completion
- ✅ Powerful migrations and schema management
- ✅ Intuitive API with `.findMany()`, `.create()`, etc.
- ✅ Works with Hyperdrive via driver adapters

**CRITICAL**: Prisma requires **driver adapters** (`@prisma/adapter-pg`) to work with Hyperdrive.

---

## Installation

```bash
# Prisma CLI and client
npm install prisma @prisma/client

# PostgreSQL driver and adapter
npm install pg @prisma/adapter-pg

# TypeScript types for pg
npm install -D @types/pg
```

---

## Setup

### 1. Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/` directory
- `prisma/schema.prisma` file
- `.env` file

---

### 2. Configure Schema

Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]  // REQUIRED for Hyperdrive
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

---

### 3. Set Database URL

Edit `.env` (for migrations only, NOT used in Worker):

```bash
# Direct connection to database (for migrations)
DATABASE_URL="postgres://user:password@host:5432/database"
```

**Important**: This `.env` file is only for running migrations locally. Workers get connection string from Hyperdrive binding.

---

### 4. Generate Prisma Client

```bash
npx prisma generate --no-engine
```

**CRITICAL**: Use `--no-engine` flag for Workers compatibility.

This generates the Prisma Client in `node_modules/@prisma/client`.

---

### 5. Run Migrations

```bash
# Create and apply migration
npx prisma migrate dev --name init

# Or apply existing migrations
npx prisma migrate deploy
```

**Generated SQL** (in `prisma/migrations/` folder):
```sql
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## Use in Worker

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    // Create pg.Pool for driver adapter
    const pool = new Pool({
      connectionString: env.HYPERDRIVE.connectionString,
      max: 5  // CRITICAL: Workers limit is 6 concurrent connections
    });

    // Create Prisma driver adapter
    const adapter = new PrismaPg(pool);

    // Create Prisma client with adapter
    const prisma = new PrismaClient({ adapter });

    try {
      // Create user
      const newUser = await prisma.user.create({
        data: {
          name: "John Doe",
          email: `john.${Date.now()}@example.com`
        }
      });

      // Find all users
      const allUsers = await prisma.user.findMany();

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: "john@example.com" }
      });

      // Update user
      await prisma.user.update({
        where: { id: newUser.id },
        data: { name: "Jane Doe" }
      });

      // Create post with relation
      await prisma.post.create({
        data: {
          title: "My First Post",
          content: "Hello World!",
          published: true,
          authorId: newUser.id
        }
      });

      // Find users with posts (include relation)
      const usersWithPosts = await prisma.user.findMany({
        include: {
          posts: true
        }
      });

      return Response.json({
        newUser,
        allUsers,
        user,
        usersWithPosts
      });
    } catch (error: any) {
      return Response.json({
        error: error.message
      }, { status: 500 });
    } finally {
      // Clean up pool connections
      ctx.waitUntil(pool.end());
    }
  }
};
```

---

## Common Query Patterns

### Create

```typescript
// Create single record
const user = await prisma.user.create({
  data: {
    name: "John",
    email: "john@example.com"
  }
});

// Create with relation
const post = await prisma.post.create({
  data: {
    title: "Hello",
    content: "World",
    author: {
      connect: { id: userId }
    }
  }
});

// Create with nested relation
const userWithPost = await prisma.user.create({
  data: {
    name: "John",
    email: "john@example.com",
    posts: {
      create: [
        { title: "First Post", content: "Hello" }
      ]
    }
  }
});
```

---

### Read

```typescript
// Find all
const users = await prisma.user.findMany();

// Find with filter
const activeUsers = await prisma.user.findMany({
  where: { active: true }
});

// Find unique
const user = await prisma.user.findUnique({
  where: { email: "john@example.com" }
});

// Find first
const firstUser = await prisma.user.findFirst({
  where: { name: "John" }
});

// Find with relations
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: true
  }
});

// Pagination
const users = await prisma.user.findMany({
  skip: 20,
  take: 10
});

// Sorting
const users = await prisma.user.findMany({
  orderBy: {
    createdAt: 'desc'
  }
});
```

---

### Update

```typescript
// Update one
const user = await prisma.user.update({
  where: { id: 1 },
  data: { name: "Jane" }
});

// Update many
const result = await prisma.user.updateMany({
  where: { active: false },
  data: { deleted: true }
});

// Upsert (update or insert)
const user = await prisma.user.upsert({
  where: { email: "john@example.com" },
  update: { name: "John Updated" },
  create: { name: "John", email: "john@example.com" }
});
```

---

### Delete

```typescript
// Delete one
const user = await prisma.user.delete({
  where: { id: 1 }
});

// Delete many
const result = await prisma.user.deleteMany({
  where: { active: false }
});
```

---

### Aggregations

```typescript
// Count
const count = await prisma.user.count();

// Count with filter
const activeCount = await prisma.user.count({
  where: { active: true }
});

// Aggregate
const result = await prisma.post.aggregate({
  _count: { id: true },
  _avg: { views: true },
  _sum: { views: true },
  _min: { createdAt: true },
  _max: { createdAt: true }
});

// Group by
const result = await prisma.post.groupBy({
  by: ['authorId'],
  _count: { id: true }
});
```

---

### Complex Filters

```typescript
// AND
const users = await prisma.user.findMany({
  where: {
    AND: [
      { active: true },
      { role: 'admin' }
    ]
  }
});

// OR
const users = await prisma.user.findMany({
  where: {
    OR: [
      { role: 'admin' },
      { role: 'moderator' }
    ]
  }
});

// NOT
const users = await prisma.user.findMany({
  where: {
    NOT: {
      email: {
        endsWith: '@example.com'
      }
    }
  }
});

// Comparison operators
const users = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lt: new Date('2024-12-31')
    }
  }
});

// String filters
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@gmail.com'  // or startsWith, endsWith
    }
  }
});
```

---

## Transactions

```typescript
// Sequential operations (default)
const result = await prisma.$transaction([
  prisma.user.create({ data: { name: "John", email: "john@example.com" } }),
  prisma.post.create({ data: { title: "Hello", authorId: 1 } })
]);

// Interactive transactions
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { name: "John", email: "john@example.com" }
  });

  const post = await tx.post.create({
    data: { title: "Hello", authorId: user.id }
  });

  return { user, post };
});

// Transaction with error handling
try {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { ... } });

    if (someCondition) {
      throw new Error("Rollback transaction");
    }

    return user;
  });
} catch (error) {
  console.error("Transaction failed:", error);
}
```

---

## TypeScript Types

Prisma automatically generates TypeScript types:

```typescript
import { User, Post, Prisma } from "@prisma/client";

// Model types
const user: User = await prisma.user.findUnique({ where: { id: 1 } });

// Input types
const createUserData: Prisma.UserCreateInput = {
  name: "John",
  email: "john@example.com"
};

// Return types with relations
type UserWithPosts = Prisma.UserGetPayload<{
  include: { posts: true }
}>;

const user: UserWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }
});
```

---

## Prisma Studio

View and edit database with Prisma Studio:

```bash
npx prisma studio
```

**Note**: Runs locally, connects to database directly (not via Hyperdrive).

---

## Best Practices

1. **Use driver adapters** (`@prisma/adapter-pg`) - REQUIRED for Hyperdrive
2. **Generate with --no-engine** - Required for Workers compatibility
3. **Set max: 5 for pg.Pool** - Stay within Workers' 6 connection limit
4. **Use ctx.waitUntil()** for cleanup
5. **Run migrations outside Worker** - Use `prisma migrate` locally
6. **Version control migrations** in `prisma/migrations/` folder
7. **Use `.env` for migrations only** - Not used in Worker runtime
8. **Re-generate client** after schema changes: `npx prisma generate --no-engine`

---

## Prisma vs Drizzle

| Feature | Prisma | Drizzle |
|---------|--------|---------|
| **Type Safety** | ✅ Excellent | ✅ Excellent |
| **Migrations** | ✅ Prisma Migrate (powerful) | ✅ Drizzle Kit (simpler) |
| **API Style** | `.findMany()`, `.create()` | `.select().from()` (SQL-like) |
| **Bundle Size** | ⚠️ Larger | ✅ Smaller |
| **Workers Setup** | ⚠️ Needs adapters + --no-engine | ✅ Simpler setup |
| **Learning Curve** | ⚠️ Steeper | ✅ Easier (if you know SQL) |
| **Performance** | ✅ Good | ✅ Excellent |

**Recommendation**:
- **Use Prisma** if you want powerful migrations and intuitive API
- **Use Drizzle** if you want lighter bundle size and SQL-like queries

---

## Common Issues

### Error: "PrismaClient is unable to run in this browser environment"

**Cause**: Prisma Client not generated with `--no-engine` flag.

**Solution**:
```bash
npx prisma generate --no-engine
```

---

### Error: "Cannot find module '@prisma/client'"

**Cause**: Prisma Client not generated.

**Solution**:
```bash
npm install @prisma/client
npx prisma generate --no-engine
```

---

### Error: "Database xxx does not exist"

**Cause**: DATABASE_URL in `.env` points to non-existent database.

**Solution**:
1. Create database: `CREATE DATABASE xxx;`
2. Verify DATABASE_URL in `.env`

---

### Error: "No such module 'node:*'"

**Cause**: `nodejs_compat` flag not enabled.

**Solution**: Add to `wrangler.jsonc`:
```jsonc
{
  "compatibility_flags": ["nodejs_compat"]
}
```

---

## Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate --no-engine",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:push": "prisma db push"
  }
}
```

Usage:
```bash
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Create and apply migration
npm run db:studio    # Open Prisma Studio
```

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [Hyperdrive Prisma Example](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/prisma-orm/)
- [Prisma with Workers](https://www.prisma.io/docs/orm/more/under-the-hood/engines#using-custom-engine-binaries)
