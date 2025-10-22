# Cloudflare Workflows - Common Issues

**Last Updated**: 2025-10-22

This document details all known issues with Cloudflare Workflows and their solutions.

---

## Issue #1: I/O Context Error

**Error Message:**
```
Cannot perform I/O on behalf of a different request
```

**Description:**
When trying to use I/O objects (like fetch responses, file handles, etc.) created in one request context from a different request's handler, Cloudflare Workers throws this error. This is a fundamental Workers platform limitation.

**Root Cause:**
I/O objects are bound to the request context that created them. Workflows create a new execution context for each step, so I/O must happen within the step's callback.

**Prevention:**

❌ **Bad - I/O outside step:**
```typescript
// This will fail!
const response = await fetch('https://api.example.com/data');
const data = await response.json();

await step.do('use data', async () => {
  // Trying to use data from outside step's context
  return data;  // ❌ Error!
});
```

✅ **Good - I/O inside step:**
```typescript
const data = await step.do('fetch data', async () => {
  const response = await fetch('https://api.example.com/data');
  return await response.json();  // ✅ Correct
});
```

**Workaround:**
Always perform all I/O operations (fetch, KV reads, D1 queries, R2 operations) within `step.do()` callbacks.

**Source:** Cloudflare Workers platform limitation

---

## Issue #2: NonRetryableError Behaves Differently in Dev vs Production

**Error Message:**
```
(No specific error - workflow retries when it shouldn't)
```

**Description:**
When throwing a `NonRetryableError` with an empty message in development mode (`wrangler dev`), the workflow incorrectly retries the failed step. In production, it correctly exits without retrying.

**Root Cause:**
Bug in the development environment handling of empty NonRetryableError messages.

**Prevention:**

❌ **Bad - Empty message:**
```typescript
import { NonRetryableError } from 'cloudflare:workflows';

// May retry in dev mode
throw new NonRetryableError();
```

✅ **Good - Always provide message:**
```typescript
import { NonRetryableError } from 'cloudflare:workflows';

// Works consistently in dev and production
throw new NonRetryableError('User not found');
throw new NonRetryableError('Invalid authentication credentials');
throw new NonRetryableError('Amount exceeds limit');
```

**Workaround:**
Always provide a descriptive message when throwing NonRetryableError.

**Source:** [cloudflare/workers-sdk#10113](https://github.com/cloudflare/workers-sdk/issues/10113)
**Status:** Reported July 2025, not yet fixed

---

## Issue #3: WorkflowEvent Export Not Found

**Error Message:**
```
The requested module 'cloudflare:workers' does not provide an export named 'WorkflowEvent'
```

**Description:**
TypeScript cannot find the `WorkflowEvent` export from the `cloudflare:workers` module. This usually happens with outdated type definitions.

**Root Cause:**
- Outdated `@cloudflare/workers-types` package
- Incorrect import statement
- Missing types in tsconfig.json

**Prevention:**

✅ **Ensure latest types installed:**
```bash
npm install -D @cloudflare/workers-types@latest
```

✅ **Correct import:**
```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
```

✅ **Correct tsconfig.json:**
```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types/2023-07-01"],
    "moduleResolution": "bundler"
  }
}
```

**Workaround:**
1. Update workers types: `npm install -D @cloudflare/workers-types@latest`
2. Run type generation: `npx wrangler types`
3. Restart TypeScript server in your editor

**Source:** Community reports, package versioning issues
**Latest Working Version:** @cloudflare/workers-types@4.20251014.0 (verified 2025-10-22)

---

## Issue #4: Serialization Error - Non-Serializable Return Values

**Error Message:**
```
Error: Could not serialize return value
(or workflow hangs without clear error)
```

**Description:**
Attempting to return non-serializable values from `step.do()` or `run()` methods causes serialization failures. The workflow instance may error or hang.

**Root Cause:**
Workflows persist state between steps by serializing return values. Only JSON-serializable types are supported.

**Prevention:**

❌ **Bad - Non-serializable types:**
```typescript
// ❌ Function
await step.do('bad example', async () => {
  return {
    data: [1, 2, 3],
    transform: (x) => x * 2  // ❌ Function not serializable
  };
});

// ❌ Circular reference
await step.do('bad example 2', async () => {
  const obj: any = { name: 'test' };
  obj.self = obj;  // ❌ Circular reference
  return obj;
});

// ❌ Symbol
await step.do('bad example 3', async () => {
  return {
    id: Symbol('unique'),  // ❌ Symbol not serializable
    data: 'test'
  };
});

// ❌ undefined (use null instead)
await step.do('bad example 4', async () => {
  return {
    value: undefined  // ❌ undefined not serializable
  };
});
```

✅ **Good - Only serializable types:**
```typescript
await step.do('good example', async () => {
  return {
    // ✅ Primitives
    string: 'value',
    number: 123,
    boolean: true,
    nullValue: null,

    // ✅ Arrays
    array: [1, 2, 3],

    // ✅ Objects
    nested: {
      data: 'test',
      items: [{ id: 1 }, { id: 2 }]
    }
  };
});
```

✅ **Convert class instances to plain objects:**
```typescript
class User {
  constructor(public id: string, public name: string) {}

  toJSON() {
    return { id: this.id, name: this.name };
  }
}

await step.do('serialize class', async () => {
  const user = new User('123', 'Alice');

  // ✅ Convert to plain object
  return user.toJSON();  // { id: '123', name: 'Alice' }
});
```

**Workaround:**
- Only return primitives, arrays, and plain objects
- Convert class instances to plain objects before returning
- Use `null` instead of `undefined`
- Avoid circular references

**Source:** Cloudflare Workflows documentation
**Reference:** [Workflows Workers API](https://developers.cloudflare.com/workflows/build/workers-api/)

---

## Issue #5: Testing Workflows in CI Environments

**Error Message:**
```
(Tests pass locally but fail in CI)
```

**Description:**
Tests that use `vitest-pool-workers` to test workflows work reliably in local development but fail inconsistently in CI environments (GitHub Actions, GitLab CI, etc.).

**Root Cause:**
- Timing issues in CI environments
- Resource constraints in CI runners
- Race conditions in test setup/teardown

**Prevention:**

✅ **Increase timeouts in CI:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,  // Increase from default 5000ms
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
});
```

✅ **Add retry logic for flaky tests:**
```typescript
describe('Workflow tests', () => {
  it.retry(3)('should complete workflow', async () => {
    // Test code
  });
});
```

✅ **Use proper test isolation:**
```typescript
import { beforeEach, afterEach } from 'vitest';

let instance: WorkflowInstance;

beforeEach(async () => {
  instance = await env.MY_WORKFLOW.create({
    params: { userId: '123' }
  });
});

afterEach(async () => {
  if (instance) {
    try {
      await instance.terminate();
    } catch (error) {
      // Instance may already be terminated
    }
  }
});
```

**Workaround:**
1. Increase test timeouts for CI
2. Add retry logic for flaky tests
3. Use proper test isolation
4. Consider mocking workflows in unit tests, testing real workflows in integration tests

**Source:** [cloudflare/workers-sdk#10600](https://github.com/cloudflare/workers-sdk/issues/10600)
**Status:** Ongoing investigation

---

## Additional Troubleshooting Tips

### Workflow Instance Stuck in "Running" State

**Possible Causes:**
1. Step is sleeping for long duration
2. Step is waiting for event that never arrives
3. Step is retrying with long backoff

**Solution:**
```bash
# Check detailed instance status
npx wrangler workflows instances describe my-workflow <instance-id>

# Look for:
# - Sleep state (shows wake time)
# - waitForEvent state (shows event type and timeout)
# - Retry history (shows attempts and delays)
```

---

### Step Returns Undefined

**Cause:** Missing return statement in step callback

**Solution:**
```typescript
// ❌ Bad - no return
const result = await step.do('get data', async () => {
  const data = await fetchData();
  // Missing return!
});
console.log(result);  // undefined

// ✅ Good - explicit return
const result = await step.do('get data', async () => {
  const data = await fetchData();
  return data;  // ✅ Return the value
});
```

---

### Payload Too Large Error

**Error:**
```
Payload size exceeds limit
```

**Cause:** Workflow parameters or step outputs exceed 128 KB

**Solution:**
```typescript
// ❌ Bad - large payload
await env.MY_WORKFLOW.create({
  params: {
    largeData: hugeArray  // >128 KB
  }
});

// ✅ Good - store in R2/KV, pass reference
const key = `workflow-data/${crypto.randomUUID()}`;
await env.MY_BUCKET.put(key, JSON.stringify(hugeArray));

await env.MY_WORKFLOW.create({
  params: {
    dataKey: key  // Just pass the key
  }
});
```

---

## Getting Help

If you encounter issues not listed here:

1. **Check Cloudflare Status**: https://www.cloudflarestatus.com/
2. **Search GitHub Issues**: https://github.com/cloudflare/workers-sdk/issues
3. **Cloudflare Discord**: https://discord.gg/cloudflaredev
4. **Cloudflare Community**: https://community.cloudflare.com/
5. **Official Docs**: https://developers.cloudflare.com/workflows/

When reporting issues, include:
- Workflow code (sanitized)
- Wrangler configuration
- Error messages and stack traces
- Workflow instance ID
- Steps to reproduce
- Expected vs actual behavior

---

**Last Updated**: 2025-10-22
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
