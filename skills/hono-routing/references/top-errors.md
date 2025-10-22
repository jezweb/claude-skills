# Common Hono Errors and Solutions

Complete troubleshooting guide for Hono routing and middleware errors.

**Last Updated**: 2025-10-22

---

## Error #1: Middleware Response Not Typed in RPC

**Error Message**: Client doesn't infer middleware response types

**Cause**: RPC mode doesn't automatically infer middleware responses by default

**Source**: [honojs/hono#2719](https://github.com/honojs/hono/issues/2719)

**Solution**: Export specific route types that include middleware

```typescript
// ❌ Wrong: Client doesn't see middleware response
const route = app.get('/data', authMiddleware, handler)
export type AppType = typeof app

// ✅ Correct: Export route directly
const route = app.get('/data', authMiddleware, handler)
export type AppType = typeof route
```

---

## Error #2: RPC Type Inference Slow

**Error Message**: IDE becomes slow or unresponsive with many routes

**Cause**: Complex type instantiation from `typeof app` with large number of routes

**Source**: [hono.dev/docs/guides/rpc](https://hono.dev/docs/guides/rpc)

**Solution**: Export specific route groups instead of entire app

```typescript
// ❌ Slow: Export entire app
export type AppType = typeof app

// ✅ Fast: Export specific routes
const userRoutes = app.get('/users', ...).post('/users', ...)
export type UserRoutes = typeof userRoutes

const postRoutes = app.get('/posts', ...).post('/posts', ...)
export type PostRoutes = typeof postRoutes
```

---

## Error #3: Middleware Chain Broken

**Error Message**: Handler not executed, middleware returns early

**Cause**: Forgot to call `await next()` in middleware

**Source**: Official docs

**Solution**: Always call `await next()` unless intentionally short-circuiting

```typescript
// ❌ Wrong: Forgot await next()
app.use('*', async (c, next) => {
  console.log('Before')
  // Missing: await next()
  console.log('After')
})

// ✅ Correct: Call await next()
app.use('*', async (c, next) => {
  console.log('Before')
  await next()
  console.log('After')
})
```

---

## Error #4: Validation Error Not Handled

**Error Message**: Validation fails silently or returns wrong status code

**Cause**: No custom error handler for validation failures

**Source**: Best practices

**Solution**: Use custom validation hooks

```typescript
// ❌ Wrong: Default 400 response with no details
app.post('/users', zValidator('json', schema), handler)

// ✅ Correct: Custom error handler
app.post(
  '/users',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', issues: result.error.issues }, 400)
    }
  }),
  handler
)
```

---

## Error #5: Context Type Safety Lost

**Error Message**: `c.get()` returns `any` type

**Cause**: Not defining `Variables` type in Hono generic

**Source**: Official docs

**Solution**: Define Variables type

```typescript
// ❌ Wrong: No Variables type
const app = new Hono()
app.use('*', (c, next) => {
  c.set('user', { id: 1 }) // No type checking
  await next()
})

// ✅ Correct: Define Variables type
type Variables = {
  user: { id: number; name: string }
}

const app = new Hono<{ Variables: Variables }>()
app.use('*', (c, next) => {
  c.set('user', { id: 1, name: 'Alice' }) // Type-safe!
  await next()
})
```

---

## Error #6: Route Parameter Type Error

**Error Message**: `c.req.param()` returns string but number expected

**Cause**: Route parameters are always strings

**Source**: Official docs

**Solution**: Use validation to transform to correct type

```typescript
// ❌ Wrong: Assuming number type
app.get('/users/:id', (c) => {
  const id = c.req.param('id') // Type: string
  const user = await db.findUser(id) // Error: expects number
  return c.json({ user })
})

// ✅ Correct: Validate and transform
const idSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
})

app.get('/users/:id', zValidator('param', idSchema), async (c) => {
  const { id } = c.req.valid('param') // Type: number
  const user = await db.findUser(id)
  return c.json({ user })
})
```

---

## Error #7: Missing Error Check After Middleware

**Error Message**: Errors in handlers not caught

**Cause**: Not checking `c.error` after `await next()`

**Source**: Official docs

**Solution**: Check `c.error` in middleware

```typescript
// ❌ Wrong: No error checking
app.use('*', async (c, next) => {
  await next()
  // Missing error check
})

// ✅ Correct: Check c.error
app.use('*', async (c, next) => {
  await next()

  if (c.error) {
    console.error('Error:', c.error)
    // Send to error tracking service
  }
})
```

---

## Error #8: HTTPException Misuse

**Error Message**: Errors not handled correctly

**Cause**: Throwing plain Error instead of HTTPException

**Source**: Official docs

**Solution**: Use HTTPException for client errors

```typescript
// ❌ Wrong: Plain Error
app.get('/users/:id', (c) => {
  if (!id) {
    throw new Error('ID is required') // No status code
  }
})

// ✅ Correct: HTTPException
import { HTTPException } from 'hono/http-exception'

app.get('/users/:id', (c) => {
  if (!id) {
    throw new HTTPException(400, { message: 'ID is required' })
  }
})
```

---

## Error #9: Query Parameter Not Validated

**Error Message**: Invalid query parameters cause errors

**Cause**: Accessing `c.req.query()` without validation

**Source**: Best practices

**Solution**: Validate query parameters

```typescript
// ❌ Wrong: No validation
app.get('/search', (c) => {
  const page = parseInt(c.req.query('page') || '1', 10) // May be NaN
  const limit = parseInt(c.req.query('limit') || '10', 10)
  // ...
})

// ✅ Correct: Validate query params
const querySchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1)),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)),
})

app.get('/search', zValidator('query', querySchema), (c) => {
  const { page, limit } = c.req.valid('query') // Type-safe!
  // ...
})
```

---

## Error #10: Incorrect Middleware Order

**Error Message**: Middleware executing in wrong order

**Cause**: Misunderstanding middleware execution flow

**Source**: Official docs

**Solution**: Remember middleware runs top-to-bottom before handler, bottom-to-top after

```typescript
// Middleware execution order:
app.use('*', async (c, next) => {
  console.log('1: Before') // Runs 1st
  await next()
  console.log('4: After') // Runs 4th
})

app.use('*', async (c, next) => {
  console.log('2: Before') // Runs 2nd
  await next()
  console.log('3: After') // Runs 3rd
})

app.get('/', (c) => {
  console.log('Handler') // Runs in between
  return c.json({})
})

// Output: 1, 2, Handler, 3, 4
```

---

## Error #11: JSON Parsing Error

**Error Message**: `SyntaxError: Unexpected token in JSON`

**Cause**: Request body is not valid JSON

**Source**: Common issue

**Solution**: Add validation and error handling

```typescript
app.post('/data', async (c) => {
  try {
    const body = await c.req.json()
    return c.json({ success: true, body })
  } catch (error) {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
})

// Or use validator (handles automatically)
app.post('/data', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

---

## Error #12: CORS Preflight Fails

**Error Message**: CORS preflight request fails

**Cause**: Missing CORS middleware or incorrect configuration

**Source**: Common issue

**Solution**: Configure CORS middleware correctly

```typescript
import { cors } from 'hono/cors'

app.use(
  '/api/*',
  cors({
    origin: ['https://example.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
```

---

## Error #13: Route Not Found

**Error Message**: 404 Not Found for existing route

**Cause**: Route pattern doesn't match request path

**Source**: Common issue

**Solution**: Check route pattern and parameter syntax

```typescript
// ❌ Wrong: Missing colon for parameter
app.get('/users/id', handler) // Matches "/users/id" literally

// ✅ Correct: Parameter with colon
app.get('/users/:id', handler) // Matches "/users/123"
```

---

## Error #14: Response Already Sent

**Error Message**: Cannot set headers after response sent

**Cause**: Trying to modify response after calling `c.json()` or `c.text()`

**Source**: Common issue

**Solution**: Return response immediately, don't modify after

```typescript
// ❌ Wrong: Trying to modify after response
app.get('/data', (c) => {
  const response = c.json({ data: 'value' })
  c.res.headers.set('X-Custom', 'value') // Error!
  return response
})

// ✅ Correct: Set headers before response
app.get('/data', (c) => {
  c.res.headers.set('X-Custom', 'value')
  return c.json({ data: 'value' })
})
```

---

## Error #15: Type Inference Not Working

**Error Message**: TypeScript not inferring types from validator

**Cause**: Not using `c.req.valid()` after validation

**Source**: Official docs

**Solution**: Always use `c.req.valid()` for type-safe access

```typescript
// ❌ Wrong: No type inference
app.post('/users', zValidator('json', schema), async (c) => {
  const body = await c.req.json() // Type: any
  return c.json({ body })
})

// ✅ Correct: Type-safe
app.post('/users', zValidator('json', schema), (c) => {
  const data = c.req.valid('json') // Type: inferred from schema
  return c.json({ data })
})
```

---

## Quick Reference

| Error | Cause | Solution |
|-------|-------|----------|
| Middleware response not typed | RPC doesn't infer middleware | Export route, not app |
| Slow RPC type inference | Too many routes | Export specific route groups |
| Middleware chain broken | Missing `await next()` | Always call `await next()` |
| Validation error unhandled | No custom hook | Use custom validation hook |
| Context type safety lost | No Variables type | Define Variables type |
| Route param type error | Params are strings | Use validation to transform |
| Missing error check | Not checking `c.error` | Check `c.error` after `next()` |
| HTTPException misuse | Using plain Error | Use HTTPException |
| Query param not validated | Direct access | Use query validator |
| Incorrect middleware order | Misunderstanding flow | Review execution order |
| JSON parsing error | Invalid JSON | Add error handling |
| CORS preflight fails | Missing CORS config | Configure CORS middleware |
| Route not found | Wrong pattern | Check route syntax |
| Response already sent | Modifying after send | Set headers before response |
| Type inference not working | Not using `c.req.valid()` | Use `c.req.valid()` |

---

**Official Documentation**: https://hono.dev/docs
