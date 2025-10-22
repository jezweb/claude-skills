# Comprehensive Zod Schemas Guide

Complete reference for all Zod schema types and patterns.

---

## Primitives

```typescript
// String
z.string()
z.string().min(3, "Min 3 characters")
z.string().max(100, "Max 100 characters")
z.string().length(10, "Exactly 10 characters")
z.string().email("Invalid email")
z.string().url("Invalid URL")
z.string().uuid("Invalid UUID")
z.string().regex(/pattern/, "Does not match pattern")
z.string().trim() // Trim whitespace
z.string().toLowerCase() //Convert to lowercase
z.string().toUpperCase() // Convert to uppercase

// Number
z.number()
z.number().int("Must be integer")
z.number().positive("Must be positive")
z.number().negative("Must be negative")
z.number().min(0, "Min is 0")
z.number().max(100, "Max is 100")
z.number().multipleOf(5, "Must be multiple of 5")
z.number().finite() // No Infinity or NaN
z.number().safe() // Within JS safe integer range

// Boolean
z.boolean()

// Date
z.date()
z.date().min(new Date("2020-01-01"), "Too old")
z.date().max(new Date(), "Cannot be in future")

// BigInt
z.bigint()
```

---

## Objects

```typescript
// Basic object
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

// Nested object
const profileSchema = z.object({
  user: userSchema,
  address: z.object({
    street: z.string(),
    city: z.string(),
  }),
})

// Partial (all fields optional)
const partialUserSchema = userSchema.partial()

// Deep Partial (recursively optional)
const deepPartialSchema = profileSchema.deepPartial()

// Pick specific fields
const nameOnlySchema = userSchema.pick({ name: true })

// Omit specific fields
const withoutAgeSchema = userSchema.omit({ age: true })

// Merge objects
const extendedUserSchema = userSchema.merge(z.object({
  email: z.string().email(),
}))

// Passthrough (allow extra fields)
const passthroughSchema = userSchema.passthrough()

// Strict (no extra fields)
const strictSchema = userSchema.strict()

// Catchall (type for extra fields)
const catchallSchema = userSchema.catchall(z.string())
```

---

## Arrays

```typescript
// Array of strings
z.array(z.string())

// With length constraints
z.array(z.string()).min(1, "At least one item required")
z.array(z.string()).max(10, "Max 10 items")
z.array(z.string()).length(5, "Exactly 5 items")
z.array(z.string()).nonempty("Array cannot be empty")

// Array of objects
z.array(z.object({
  name: z.string(),
  age: z.number(),
}))
```

---

## Tuples

```typescript
// Fixed-length array with specific types
z.tuple([z.string(), z.number(), z.boolean()])

// With rest
z.tuple([z.string(), z.number()]).rest(z.boolean())
```

---

## Enums and Literals

```typescript
// Enum
z.enum(['red', 'green', 'blue'])

// Native enum
enum Color { Red, Green, Blue }
z.nativeEnum(Color)

// Literal
z.literal('hello')
z.literal(42)
z.literal(true)
```

---

## Unions and Discriminated Unions

```typescript
// Union
z.union([z.string(), z.number()])

// Discriminated union (recommended for better errors)
z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), name: z.string() }),
  z.object({ type: z.literal('admin'), permissions: z.array(z.string()) }),
])
```

---

## Optional and Nullable

```typescript
// Optional (value | undefined)
z.string().optional()
z.optional(z.string()) // Same as above

// Nullable (value | null)
z.string().nullable()
z.nullable(z.string()) // Same as above

// Nullish (value | null | undefined)
z.string().nullish()
```

---

## Default Values

```typescript
z.string().default('default value')
z.number().default(0)
z.boolean().default(false)
z.array(z.string()).default([])
```

---

## Refinements (Custom Validation)

```typescript
// Basic refinement
z.string().refine((val) => val.length > 5, {
  message: "String must be longer than 5 characters",
})

// With custom path
z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Multiple refinements
z.string()
  .refine((val) => val.length >= 8, "Min 8 characters")
  .refine((val) => /[A-Z]/.test(val), "Must contain uppercase")
  .refine((val) => /[0-9]/.test(val), "Must contain number")

// Async refinement
z.string().refine(async (val) => {
  const available = await checkAvailability(val)
  return available
}, "Already taken")
```

---

## Transforms

```typescript
// String to number
z.string().transform((val) => parseInt(val, 10))

// Trim whitespace
z.string().transform((val) => val.trim())

// Parse date
z.string().transform((val) => new Date(val))

// Chain transform and refine
z.string()
  .transform((val) => parseInt(val, 10))
  .refine((val) => !isNaN(val), "Must be a number")
```

---

## Preprocess

```typescript
// Process before validation
z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().optional()
)

// Convert to number
z.preprocess(
  (val) => Number(val),
  z.number()
)
```

---

## Intersections

```typescript
const baseUser = z.object({ name: z.string() })
const withEmail = z.object({ email: z.string().email() })

// Intersection (combines both)
const userWithEmail = baseUser.and(withEmail)
// OR
const userWithEmail = z.intersection(baseUser, withEmail)
```

---

## Records and Maps

```typescript
// Record (object with dynamic keys)
z.record(z.string()) // { [key: string]: string }
z.record(z.string(), z.number()) // { [key: string]: number }

// Map
z.map(z.string(), z.number())
```

---

## Sets

```typescript
z.set(z.string())
z.set(z.number()).min(1, "At least one item")
z.set(z.string()).max(10, "Max 10 items")
```

---

## Promises

```typescript
z.promise(z.string())
z.promise(z.object({ data: z.string() }))
```

---

## Custom Error Messages

```typescript
// Field-level
z.string({ required_error: "Name is required" })
z.number({ invalid_type_error: "Must be a number" })

// Validation-level
z.string().min(3, { message: "Min 3 characters" })
z.string().email({ message: "Invalid email format" })

// Custom error map
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "Please enter text" }
    }
  }
  return { message: ctx.defaultError }
}

z.setErrorMap(customErrorMap)
```

---

## Type Inference

```typescript
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

// Infer TypeScript type
type User = z.infer<typeof userSchema>
// Result: { name: string; age: number }

// Input type (before transforms)
type UserInput = z.input<typeof transformSchema>

// Output type (after transforms)
type UserOutput = z.output<typeof transformSchema>
```

---

## Parsing Methods

```typescript
// .parse() - throws on error
const result = schema.parse(data)

// .safeParse() - returns result object
const result = schema.safeParse(data)
if (result.success) {
  console.log(result.data)
} else {
  console.error(result.error)
}

// .parseAsync() - async validation
const result = await schema.parseAsync(data)

// .safeParseAsync() - async with result object
const result = await schema.safeParseAsync(data)
```

---

## Error Handling

```typescript
try {
  schema.parse(data)
} catch (error) {
  if (error instanceof z.ZodError) {
    // Formatted errors
    console.log(error.format())

    // Flattened errors (for forms)
    console.log(error.flatten())

    // Individual issues
    console.log(error.issues)
  }
}
```

---

**Official Docs**: https://zod.dev
