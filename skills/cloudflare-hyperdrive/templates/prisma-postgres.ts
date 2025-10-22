/**
 * Prisma ORM with PostgreSQL
 *
 * Type-safe ORM for PostgreSQL via Hyperdrive using driver adapters.
 *
 * Install: npm install prisma @prisma/client pg @prisma/adapter-pg
 *
 * Setup:
 * 1. npx prisma init
 * 2. Define schema in prisma/schema.prisma
 * 3. npx prisma generate --no-engine
 * 4. npx prisma migrate dev (for migrations)
 *
 * CRITICAL: Must use driver adapters (@prisma/adapter-pg) for Hyperdrive
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
};

/**
 * Example Prisma schema (prisma/schema.prisma):
 *
 * generator client {
 *   provider        = "prisma-client-js"
 *   previewFeatures = ["driverAdapters"]
 * }
 *
 * datasource db {
 *   provider = "postgresql"
 *   url      = env("DATABASE_URL")
 * }
 *
 * model User {
 *   id        Int      @id @default(autoincrement())
 *   name      String
 *   email     String   @unique
 *   createdAt DateTime @default(now())
 *   posts     Post[]
 * }
 *
 * model Post {
 *   id        Int      @id @default(autoincrement())
 *   title     String
 *   content   String?
 *   published Boolean  @default(false)
 *   authorId  Int
 *   author    User     @relation(fields: [authorId], references: [id])
 * }
 */

export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create pg.Pool for driver adapter
    const pool = new Pool({
      connectionString: env.HYPERDRIVE.connectionString,
      max: 5
    });

    // Create Prisma driver adapter
    const adapter = new PrismaPg(pool);

    // Create Prisma client with adapter
    const prisma = new PrismaClient({ adapter });

    try {
      // Example: Create user
      const newUser = await prisma.user.create({
        data: {
          name: "John Doe",
          email: `john.${Date.now()}@example.com`
        }
      });

      // Example: Find all users
      const allUsers = await prisma.user.findMany({
        include: {
          posts: true  // Include related posts
        }
      });

      // Example: Find user by email
      const user = await prisma.user.findUnique({
        where: {
          email: "john@example.com"
        }
      });

      // Example: Update user
      await prisma.user.update({
        where: { id: newUser.id },
        data: { name: "Jane Doe" }
      });

      // Example: Create post with relation
      await prisma.post.create({
        data: {
          title: "My First Post",
          content: "Hello World!",
          published: true,
          authorId: newUser.id
        }
      });

      // Example: Complex query with filters
      const recentUsers = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date('2024-01-01')
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      return Response.json({
        success: true,
        data: {
          newUser,
          allUsers,
          user,
          recentUsers
        }
      });

    } catch (error: any) {
      console.error("Database error:", error);

      return Response.json({
        success: false,
        error: error.message
      }, {
        status: 500
      });

    } finally {
      // Clean up connections
      ctx.waitUntil(pool.end());
    }
  }
};
