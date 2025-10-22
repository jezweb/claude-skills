# Durable Objects Migrations Guide

Complete guide to managing DO class lifecycles with migrations.

---

## Why Migrations?

Migrations tell Cloudflare Workers runtime about changes to Durable Object classes:

**Required for:**
- ✅ Creating new DO class
- ✅ Renaming DO class
- ✅ Deleting DO class
- ✅ Transferring DO class to another Worker

**NOT required for:**
- ❌ Code changes to existing DO class
- ❌ Storage schema changes within DO

---

## Migration Types

### 1. Create New DO Class

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",                    // Unique migration identifier
      "new_sqlite_classes": [         // SQLite backend (recommended)
        "Counter"
      ]
    }
  ]
}
```

**For KV backend (legacy):**

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter"]      // KV backend (128MB limit)
    }
  ]
}
```

**CRITICAL:**
- ✅ Use `new_sqlite_classes` for new DOs (1GB storage, atomic operations)
- ❌ **Cannot** change KV backend to SQLite after deployment

---

### 2. Rename DO Class

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "MY_DO",
        "class_name": "NewClassName"    // Updated class name
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["OldClassName"]
    },
    {
      "tag": "v2",                      // New migration tag
      "renamed_classes": [
        {
          "from": "OldClassName",
          "to": "NewClassName"
        }
      ]
    }
  ]
}
```

**What happens:**
- ✅ All existing DO instances keep their data
- ✅ Old bindings automatically forward to new class
- ✅ `idFromName('foo')` still routes to same instance
- ⚠️ **Must export new class** in Worker code

---

### 3. Delete DO Class

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter"]
    },
    {
      "tag": "v2",
      "deleted_classes": ["Counter"]    // Mark for deletion
    }
  ]
}
```

**What happens:**
- ✅ All DO instances **immediately deleted**
- ✅ All storage **permanently deleted**
- ⚠️ **CANNOT UNDO** - data is gone forever

**Before deleting:**
1. Export data if needed
2. Update Workers that reference this DO
3. Consider rename instead (if migrating)

---

### 4. Transfer DO Class to Another Worker

**Destination Worker:**

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "TRANSFERRED_DO",
        "class_name": "TransferredClass"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "transferred_classes": [
        {
          "from": "OriginalClass",
          "from_script": "original-worker",  // Source Worker name
          "to": "TransferredClass"
        }
      ]
    }
  ]
}
```

**What happens:**
- ✅ DO instances move to new Worker
- ✅ All storage is transferred
- ✅ Old bindings automatically forward to new Worker
- ⚠️ **Must export new class** in destination Worker

---

## Migration Rules

### Tags Must Be Unique

```jsonc
// ✅ CORRECT
{
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["A"] },
    { "tag": "v2", "new_sqlite_classes": ["B"] },
    { "tag": "v3", "renamed_classes": [{ "from": "A", "to": "C" }] }
  ]
}

// ❌ WRONG: Duplicate tag
{
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["A"] },
    { "tag": "v1", "new_sqlite_classes": ["B"] }  // ERROR
  ]
}
```

### Tags Are Append-Only

```jsonc
// ✅ CORRECT: Add new tag
{
  "migrations": [
    { "tag": "v1", ... },
    { "tag": "v2", ... }  // Append
  ]
}

// ❌ WRONG: Remove or reorder
{
  "migrations": [
    { "tag": "v2", ... }  // Can't remove v1
  ]
}
```

### Migrations Are Atomic

⚠️ **Cannot use gradual deployments** with migrations

- All DO instances migrate at once when you deploy
- No partial rollout support
- Use canary releases at Worker level, not DO level

---

## Migration Gotchas

### Global Uniqueness

DO class names are **globally unique per account**.

```typescript
// Worker A
export class Counter extends DurableObject { }

// Worker B
export class Counter extends DurableObject { }
// ❌ ERROR: Class name "Counter" already exists in account
```

**Solution:** Use unique class names (e.g., prefix with Worker name)

```typescript
// Worker A
export class CounterA extends DurableObject { }

// Worker B
export class CounterB extends DurableObject { }
```

### Cannot Enable SQLite on Existing KV-backed DO

```jsonc
// Deployed with:
{ "tag": "v1", "new_classes": ["Counter"] }  // KV backend

// ❌ WRONG: Cannot change to SQLite
{ "tag": "v2", "renamed_classes": [{ "from": "Counter", "to": "CounterSQLite" }] }
{ "tag": "v3", "new_sqlite_classes": ["CounterSQLite"] }

// ✅ CORRECT: Create new class instead
{ "tag": "v2", "new_sqlite_classes": ["CounterV2"] }
// Then migrate data from Counter to CounterV2
```

### Code Changes Don't Need Migrations

```typescript
// ✅ CORRECT: Just deploy code changes
export class Counter extends DurableObject {
  async increment(): Promise<number> {
    // Changed implementation
    let value = await this.ctx.storage.get<number>('count') || 0;
    value += 2;  // Changed from += 1
    await this.ctx.storage.put('count', value);
    return value;
  }
}

// No migration needed - deploy directly
```

Only schema changes (new/rename/delete/transfer) need migrations.

---

## Environment-Specific Migrations

You can define migrations per environment:

```jsonc
{
  // Top-level (default) migrations
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["Counter"] }
  ],

  "env": {
    "production": {
      // Production-specific migrations override top-level
      "migrations": [
        { "tag": "v1", "new_sqlite_classes": ["Counter"] },
        { "tag": "v2", "new_sqlite_classes": ["Analytics"] }
      ]
    }
  }
}
```

**Rules:**
- If migration defined at environment level, it overrides top-level
- If NOT defined at environment level, inherits top-level

---

## Migration Workflow

### Example: Rename DO Class

**Step 1:** Current state (v1)

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "MY_DO", "class_name": "OldName" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["OldName"] }
  ]
}
```

**Step 2:** Update wrangler.jsonc

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "MY_DO", "class_name": "NewName" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["OldName"] },
    { "tag": "v2", "renamed_classes": [{ "from": "OldName", "to": "NewName" }] }
  ]
}
```

**Step 3:** Update Worker code

```typescript
// Rename class
export class NewName extends DurableObject { }
export default NewName;
```

**Step 4:** Deploy

```bash
npx wrangler deploy
```

Migration applies atomically on deploy.

---

## Troubleshooting

### Error: "Migration tag already exists"

**Cause:** Trying to reuse a migration tag

**Solution:** Use a new, unique tag

### Error: "Class not found"

**Cause:** Class not exported from Worker

**Solution:** Ensure `export default MyDOClass;`

### Error: "Cannot enable SQLite on existing class"

**Cause:** Trying to migrate KV-backed DO to SQLite

**Solution:** Create new SQLite-backed class, migrate data manually

---

**Official Docs**: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
