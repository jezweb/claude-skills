# Top 12 Common Errors with Solutions

Complete reference for known issues and their solutions.

---

## 1. Zod v4 Type Inference Errors

**Error**: Type inference doesn't work correctly with Zod v4

**Symptoms**:
```typescript
// Types don't match expected structure
const schema = z.object({ name: z.string() })
type FormData = z.infer<typeof schema> // Type issues
```

**Source**: [GitHub Issue #13109](https://github.com/react-hook-form/react-hook-form/issues/13109)

**Solution**:
```typescript
// Use correct Zod v4 patterns
const schema = z.object({ name: z.string() })
type FormData = z.infer<typeof schema>

// Explicitly type useForm if needed
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
})
```

---

## 2. Uncontrolled to Controlled Warning

**Error**: "A component is changing an uncontrolled input to be controlled"

**Symptoms**:
```
Warning: A component is changing an uncontrolled input of type text to be controlled.
Input elements should not switch from uncontrolled to controlled (or vice versa).
```

**Cause**: Not setting defaultValues causes fields to be undefined initially

**Solution**:
```typescript
// BAD
const form = useForm()

// GOOD - Always set defaultValues
const form = useForm({
  defaultValues: {
    email: '',
    password: '',
    remember: false,
  },
})
```

---

## 3. Nested Object Validation Errors

**Error**: Errors for nested fields don't display correctly

**Symptoms**:
```typescript
// errors.address.street is undefined even though validation failed
<span>{errors.address.street?.message}</span> // Shows nothing
```

**Solution**:
```typescript
// Use optional chaining for nested errors
{errors.address?.street && (
  <span>{errors.address.street.message}</span>
)}

// OR check if errors.address exists first
{errors.address && errors.address.street && (
  <span>{errors.address.street.message}</span>
)}
```

---

## 4. Array Field Re-renders

**Error**: Form re-renders excessively with useFieldArray

**Cause**: Using array index as key instead of field.id

**Solution**:
```typescript
// BAD
{fields.map((field, index) => (
  <div key={index}> {/* Using index causes re-renders */}
    ...
  </div>
))}

// GOOD
{fields.map((field) => (
  <div key={field.id}> {/* Use field.id */}
    ...
  </div>
))}
```

---

## 5. Async Validation Race Conditions

**Error**: Multiple validation requests cause conflicting results

**Symptoms**: Old validation results override new ones

**Solution**:
```typescript
// Use debouncing
import { useDebouncedCallback } from 'use-debounce'

const debouncedValidation = useDebouncedCallback(
  () => trigger('username'),
  500 // Wait 500ms after user stops typing
)

// AND cancel pending requests
const abortControllerRef = useRef<AbortController | null>(null)

useEffect(() => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }

  abortControllerRef.current = new AbortController()

  // Make request with abort signal
  fetch('/api/check', { signal: abortControllerRef.current.signal })
}, [value])
```

---

## 6. Server Error Mapping

**Error**: Server validation errors don't map to form fields

**Solution**:
```typescript
const onSubmit = async (data) => {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const { errors } = await response.json()

      // Map server errors to form fields
      Object.entries(errors).forEach(([field, message]) => {
        setError(field, {
          type: 'server',
          message: Array.isArray(message) ? message[0] : message,
        })
      })

      return
    }
  } catch (error) {
    setError('root', {
      type: 'server',
      message: 'Network error',
    })
  }
}
```

---

## 7. Default Values Not Applied

**Error**: Form fields don't show default values

**Cause**: Setting defaultValues after form initialization

**Solution**:
```typescript
// BAD - Set in useState
const [defaultValues, setDefaultValues] = useState({})

useEffect(() => {
  setDefaultValues({ email: 'user@example.com' }) // Too late!
}, [])

const form = useForm({ defaultValues })

// GOOD - Set directly or use reset()
const form = useForm({
  defaultValues: { email: 'user@example.com' },
})

// OR fetch and use reset
useEffect(() => {
  async function loadData() {
    const data = await fetchData()
    reset(data)
  }
  loadData()
}, [reset])
```

---

## 8. Controller Field Not Updating

**Error**: Custom component doesn't update when value changes

**Cause**: Not spreading {...field} in Controller render

**Solution**:
```typescript
// BAD
<Controller
  render={({ field }) => (
    <CustomInput value={field.value} onChange={field.onChange} />
  )}
/>

// GOOD - Spread all field props
<Controller
  render={({ field }) => (
    <CustomInput {...field} />
  )}
/>
```

---

## 9. useFieldArray Key Warnings

**Error**: React warning about duplicate keys in list

**Symptoms**:
```
Warning: Encountered two children with the same key
```

**Solution**:
```typescript
// BAD - Using index as key
{fields.map((field, index) => (
  <div key={index}>...</div>
))}

// GOOD - Use field.id
{fields.map((field) => (
  <div key={field.id}>...</div>
))}
```

---

## 10. Schema Refinement Error Paths

**Error**: Custom validation errors appear at wrong field

**Cause**: Not specifying path in refinement

**Solution**:
```typescript
// BAD - Error appears at form level
z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  // Missing path!
})

// GOOD - Error appears at confirmPassword field
z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Specify path
})
```

---

## 11. Transform vs Preprocess Confusion

**Error**: Data transformation doesn't work as expected

**When to use each**:

```typescript
// Use TRANSFORM for output transformation (after validation)
z.string().transform((val) => val.toUpperCase())
// Input: 'hello' -> Validation: passes -> Output: 'HELLO'

// Use PREPROCESS for input transformation (before validation)
z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().optional()
)
// Input: '' -> Preprocess: undefined -> Validation: passes
```

---

## 12. Multiple Resolver Conflicts

**Error**: Form validation doesn't work with multiple resolvers

**Cause**: Trying to use multiple validation libraries simultaneously

**Solution**:
```typescript
// BAD - Can't use multiple resolvers
const form = useForm({
  resolver: zodResolver(schema),
  resolver: yupResolver(schema), // Overrides previous
})

// GOOD - Use single resolver, combine schemas if needed
const schema1 = z.object({ email: z.string() })
const schema2 = z.object({ password: z.string() })
const combinedSchema = schema1.merge(schema2)

const form = useForm({
  resolver: zodResolver(combinedSchema),
})
```

---

## Debugging Tips

### Enable DevTools

```bash
npm install @hookform/devtools
```

```typescript
import { DevTool } from '@hookform/devtools'

<DevTool control={control} />
```

### Log Form State

```typescript
useEffect(() => {
  console.log('Form State:', formState)
  console.log('Errors:', errors)
  console.log('Values:', getValues())
}, [formState, errors, getValues])
```

### Validate on Change During Development

```typescript
const form = useForm({
  mode: 'onChange', // See errors immediately
  resolver: zodResolver(schema),
})
```

---

**Official Docs**:
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/
