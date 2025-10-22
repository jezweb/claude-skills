# Validation Libraries Comparison

Comprehensive comparison of validation libraries for Hono: Zod, Valibot, Typia, and ArkType.

**Last Updated**: 2025-10-22

---

## Quick Comparison

| Feature | Zod | Valibot | Typia | ArkType |
|---------|-----|---------|-------|---------|
| **Bundle Size** | ~57KB | ~1-5KB | ~0KB | ~15KB |
| **Performance** | Good | Excellent | Best | Excellent |
| **Type Safety** | Excellent | Excellent | Best | Excellent |
| **Ecosystem** | Largest | Growing | Small | Growing |
| **Learning Curve** | Easy | Easy | Medium | Easy |
| **Compilation** | Runtime | Runtime | AOT | Runtime |
| **Tree Shaking** | Limited | Excellent | N/A | Good |

---

## Zod

**Install**: `npm install zod @hono/zod-validator`

**Pros**:
- ✅ Most popular (11M+ weekly downloads)
- ✅ Extensive ecosystem and community
- ✅ Excellent TypeScript support
- ✅ Rich feature set (transforms, refinements, etc.)
- ✅ Great documentation

**Cons**:
- ❌ Larger bundle size (~57KB)
- ❌ Slower performance vs alternatives
- ❌ Limited tree-shaking

**Best for**:
- Production applications with complex validation needs
- Projects prioritizing ecosystem and community support
- Teams familiar with Zod

**Example**:
```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
})

app.post('/users', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

---

## Valibot

**Install**: `npm install valibot @hono/valibot-validator`

**Pros**:
- ✅ Tiny bundle size (1-5KB with tree-shaking)
- ✅ Excellent performance
- ✅ Modular design (import only what you need)
- ✅ Similar API to Zod
- ✅ Great TypeScript support

**Cons**:
- ❌ Smaller ecosystem vs Zod
- ❌ Newer library (less battle-tested)
- ❌ Fewer integrations

**Best for**:
- Applications prioritizing bundle size
- Performance-critical applications
- Projects that want Zod-like API with better performance

**Example**:
```typescript
import { vValidator } from '@hono/valibot-validator'
import * as v from 'valibot'

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(18))),
})

app.post('/users', vValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

---

## Typia

**Install**: `npm install typia @hono/typia-validator`

**Pros**:
- ✅ **Fastest** validation (AOT compilation)
- ✅ Zero runtime overhead
- ✅ No bundle size impact
- ✅ Uses TypeScript types directly
- ✅ Compile-time validation

**Cons**:
- ❌ Requires build step (TypeScript transformer)
- ❌ More complex setup
- ❌ Smaller community
- ❌ Limited to TypeScript

**Best for**:
- Maximum performance requirements
- Applications with strict bundle size constraints
- Projects already using TypeScript transformers

**Example**:
```typescript
import { typiaValidator } from '@hono/typia-validator'
import typia from 'typia'

interface User {
  name: string
  email: string
  age?: number
}

const validate = typia.createValidate<User>()

app.post('/users', typiaValidator('json', validate), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

---

## ArkType

**Install**: `npm install arktype @hono/arktype-validator`

**Pros**:
- ✅ Excellent performance (1.5x faster than Zod)
- ✅ Intuitive string-based syntax
- ✅ Great error messages
- ✅ TypeScript-first
- ✅ Small bundle size (~15KB)

**Cons**:
- ❌ Newer library
- ❌ Smaller ecosystem
- ❌ Different syntax (learning curve)

**Best for**:
- Developers who prefer string-based schemas
- Performance-conscious projects
- Projects that value developer experience

**Example**:
```typescript
import { arktypeValidator } from '@hono/arktype-validator'
import { type } from 'arktype'

const schema = type({
  name: 'string',
  email: 'email',
  'age?': 'number>=18',
})

app.post('/users', arktypeValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

---

## Performance Benchmarks

Based on community benchmarks (approximate):

```
Typia:    ~10,000,000 validations/sec  (Fastest - AOT)
Valibot:  ~5,000,000 validations/sec
ArkType:  ~3,500,000 validations/sec
Zod:      ~2,300,000 validations/sec
```

**Note**: Actual performance varies by schema complexity and runtime.

---

## Bundle Size Comparison

```
Typia:   0 KB    (AOT compilation)
Valibot: 1-5 KB  (with tree-shaking)
ArkType: ~15 KB
Zod:     ~57 KB
```

---

## Feature Comparison

### Transformations

| Library | Support | Example |
|---------|---------|---------|
| Zod | ✅ | `z.string().transform(Number)` |
| Valibot | ✅ | `v.pipe(v.string(), v.transform(Number))` |
| Typia | ✅ | Built into types |
| ArkType | ✅ | Type inference |

### Refinements

| Library | Support | Example |
|---------|---------|---------|
| Zod | ✅ | `z.string().refine((val) => val.length > 0)` |
| Valibot | ✅ | `v.pipe(v.string(), v.check((val) => val.length > 0))` |
| Typia | ✅ | Custom validators |
| ArkType | ✅ | Narrow types |

### Default Values

| Library | Support | Example |
|---------|---------|---------|
| Zod | ✅ | `z.string().default('default')` |
| Valibot | ✅ | `v.optional(v.string(), 'default')` |
| Typia | ⚠️ | Limited |
| ArkType | ✅ | Type defaults |

---

## Recommendations

### Choose **Zod** if:
- You want the largest ecosystem and community
- You need extensive documentation and examples
- Bundle size is not a primary concern
- You want battle-tested reliability

### Choose **Valibot** if:
- Bundle size is critical
- You want Zod-like API with better performance
- You're building a modern application with tree-shaking
- You want modular imports

### Choose **Typia** if:
- Performance is absolutely critical
- You can afford a more complex build setup
- Zero runtime overhead is required
- You're already using TypeScript transformers

### Choose **ArkType** if:
- You prefer string-based schema syntax
- You want excellent error messages
- Performance is important but not critical
- You value developer experience

---

## Migration Guide

### Zod → Valibot

```typescript
// Zod
const schema = z.object({
  name: z.string().min(1),
  age: z.number().optional(),
})

// Valibot
const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  age: v.optional(v.number()),
})
```

### Zod → ArkType

```typescript
// Zod
const schema = z.object({
  name: z.string().min(1),
  age: z.number().optional(),
})

// ArkType
const schema = type({
  name: 'string>0',
  'age?': 'number',
})
```

---

## Official Documentation

- **Zod**: https://zod.dev
- **Valibot**: https://valibot.dev
- **Typia**: https://typia.io
- **ArkType**: https://arktype.io
- **Hono Validators**: https://hono.dev/docs/guides/validation
