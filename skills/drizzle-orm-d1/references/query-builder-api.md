# Query Builder API Reference

Complete reference for Drizzle's query builder.

---

## SELECT

```typescript
// All columns
db.select().from(users)

// Specific columns
db.select({ id: users.id, name: users.name }).from(users)

// With WHERE
db.select().from(users).where(eq(users.id, 1))

// With multiple conditions
db.select().from(users).where(and(
  eq(users.role, 'admin'),
  gte(users.createdAt, new Date('2024-01-01'))
))

// With ORDER BY
db.select().from(users).orderBy(users.name)
db.select().from(users).orderBy(desc(users.createdAt))

// With LIMIT and OFFSET
db.select().from(users).limit(10).offset(20)

// Execution
.all()  // Returns array
.get()  // Returns first or undefined
```

---

## INSERT

```typescript
// Single insert
db.insert(users).values({ email: 'test@example.com', name: 'Test' })

// Multiple insert
db.insert(users).values([
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
])

// With RETURNING
db.insert(users).values({ ... }).returning()

// Execution
.run()       // No return value
.returning() // Returns inserted rows
```

---

## UPDATE

```typescript
// Update with WHERE
db.update(users)
  .set({ name: 'New Name', updatedAt: new Date() })
  .where(eq(users.id, 1))

// With RETURNING
db.update(users)
  .set({ ... })
  .where(eq(users.id, 1))
  .returning()

// Execution
.run()       // No return value
.returning() // Returns updated rows
```

---

## DELETE

```typescript
// Delete with WHERE
db.delete(users).where(eq(users.id, 1))

// With RETURNING
db.delete(users).where(eq(users.id, 1)).returning()

// Execution
.run()       // No return value
.returning() // Returns deleted rows
```

---

## Operators

### Comparison
- `eq(column, value)` - Equal
- `ne(column, value)` - Not equal
- `gt(column, value)` - Greater than
- `gte(column, value)` - Greater than or equal
- `lt(column, value)` - Less than
- `lte(column, value)` - Less than or equal

### Logical
- `and(...conditions)` - AND
- `or(...conditions)` - OR
- `not(condition)` - NOT

### Pattern Matching
- `like(column, pattern)` - LIKE
- `notLike(column, pattern)` - NOT LIKE

### NULL
- `isNull(column)` - IS NULL
- `isNotNull(column)` - IS NOT NULL

### Arrays
- `inArray(column, values)` - IN
- `notInArray(column, values)` - NOT IN

### Between
- `between(column, min, max)` - BETWEEN
- `notBetween(column, min, max)` - NOT BETWEEN

---

## JOINs

```typescript
// LEFT JOIN
db.select()
  .from(users)
  .leftJoin(posts, eq(posts.authorId, users.id))

// INNER JOIN
db.select()
  .from(users)
  .innerJoin(posts, eq(posts.authorId, users.id))

// Multiple joins
db.select()
  .from(comments)
  .innerJoin(posts, eq(comments.postId, posts.id))
  .innerJoin(users, eq(comments.authorId, users.id))
```

---

## Aggregations

```typescript
import { sql } from 'drizzle-orm';

// COUNT
db.select({ count: sql<number>`count(*)` }).from(users)

// SUM
db.select({ total: sql<number>`sum(${posts.views})` }).from(posts)

// AVG
db.select({ avg: sql<number>`avg(${posts.views})` }).from(posts)

// GROUP BY
db.select({
  role: users.role,
  count: sql<number>`count(*)`
}).from(users).groupBy(users.role)
```

---

## Relational Queries

```typescript
// Must pass schema to drizzle()
const db = drizzle(env.DB, { schema });

// Find many
db.query.users.findMany()

// Find first
db.query.users.findFirst({
  where: eq(users.id, 1)
})

// With relations
db.query.users.findFirst({
  with: {
    posts: true
  }
})

// Nested relations
db.query.users.findFirst({
  with: {
    posts: {
      with: {
        comments: true
      }
    }
  }
})
```

---

## Batch Operations

```typescript
db.batch([
  db.insert(users).values({ ... }),
  db.update(posts).set({ ... }).where(eq(posts.id, 1)),
  db.delete(comments).where(eq(comments.id, 1)),
])
```

---

## Prepared Statements

```typescript
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare();

// Execute
const user = await getUserById.get({ id: 1 });
```
