---
name: react-hook-form-zod
description: |
  This skill provides comprehensive knowledge for building type-safe, validated forms in React using React Hook Form and Zod schema validation.

  Use when: building forms with validation in React, integrating Zod schema validation with React Hook Form, using shadcn/ui Form or Field components, implementing client and server-side validation with a single schema, handling complex validation scenarios (nested objects, arrays, conditional fields, async validation), building multi-step forms or wizards, implementing dynamic form fields with useFieldArray, optimizing form performance and re-renders, ensuring accessible form error handling, or debugging form validation issues.

  Keywords: react-hook-form, useForm, zod validation, zodResolver, @hookform/resolvers, form schema, register, handleSubmit, formState, useFieldArray, useWatch, useController, Controller, shadcn form, Field component, client server validation, nested validation, array field validation, dynamic fields, multi-step form, async validation, zod refine, z.infer, form error handling, uncontrolled to controlled, resolver not found, schema validation error

license: MIT
---

# React Hook Form + Zod Validation

**Status**: Production Ready ✅
**Last Updated**: 2025-10-23
**Dependencies**: None (standalone)
**Latest Versions**: react-hook-form@7.65.0, zod@4.1.12, @hookform/resolvers@5.2.2

---

## Quick Start (10 Minutes)

### 1. Install Packages

```bash
npm install react-hook-form@7.65.0 zod@4.1.12 @hookform/resolvers@5.2.2
```

**Why These Packages**:
- **react-hook-form**: Performant, flexible form library with minimal re-renders
- **zod**: TypeScript-first schema validation with type inference
- **@hookform/resolvers**: Adapter to connect Zod (and other validators) to React Hook Form

### 2. Create Your First Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 1. Define validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// 2. Infer TypeScript type from schema
type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  // 3. Initialize form with zodResolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // 4. Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    // Data is guaranteed to be valid here
    console.log('Valid data:', data)
    // Make API call, etc.
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && (
          <span role="alert" className="error">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && (
          <span role="alert" className="error">
            {errors.password.message}
          </span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

**CRITICAL**:
- Always set `defaultValues` to prevent "uncontrolled to controlled" warnings
- Use `zodResolver(schema)` to connect Zod validation
- Type form with `z.infer<typeof schema>` for full type safety
- Validate on both client AND server (never trust client validation alone)

### 3. Add Server-Side Validation

```typescript
// server/api/login.ts
import { z } from 'zod'

// SAME schema on server
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function loginHandler(req: Request) {
  try {
    // Parse and validate request body
    const data = loginSchema.parse(await req.json())

    // Data is type-safe and validated
    // Proceed with authentication logic
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation errors to client
      return { success: false, errors: error.flatten().fieldErrors }
    }
    throw error
  }
}
```

**Why Server Validation**:
- Client validation can be bypassed (inspect element, Postman, curl)
- Server validation is your security layer
- Same Zod schema = single source of truth
- Type safety across frontend and backend

---

## Core Concepts

### useForm Hook Anatomy

```typescript
const {
  register,           // Register input fields
  handleSubmit,       // Wrap onSubmit handler
  watch,              // Watch field values
  formState,          // Form state (errors, isValid, isDirty, etc.)
  setValue,           // Set field value programmatically
  getValues,          // Get current form values
  reset,              // Reset form to defaults
  trigger,            // Trigger validation manually
  control,            // Control object for Controller/useController
} = useForm<FormData>({
  resolver: zodResolver(schema),  // Validation resolver
  mode: 'onSubmit',               // When to validate (onSubmit, onChange, onBlur, all)
  defaultValues: {},              // Initial values (REQUIRED for controlled inputs)
})
```

**useForm Options**:

| Option | Description | Default |
|--------|-------------|---------|
| `resolver` | Validation resolver (e.g., zodResolver) | undefined |
| `mode` | When to validate ('onSubmit', 'onChange', 'onBlur', 'all') | 'onSubmit' |
| `reValidateMode` | When to re-validate after error | 'onChange' |
| `defaultValues` | Initial form values | {} |
| `shouldUnregister` | Unregister inputs when unmounted | false |
| `criteriaMode` | Return all errors or first error only | 'firstError' |

**Form Validation Modes**:
- `onSubmit` - Validate on submit (best performance, less responsive)
- `onChange` - Validate on every change (live feedback, more re-renders)
- `onBlur` - Validate when field loses focus (good balance)
- `all` - Validate on submit, blur, and change (most responsive, highest cost)

### Zod Schema Definition

```typescript
import { z } from 'zod'

// Primitives
const stringSchema = z.string()
const numberSchema = z.number()
const booleanSchema = z.boolean()
const dateSchema = z.date()

// With validation
const emailSchema = z.string().email('Invalid email')
const ageSchema = z.number().min(18, 'Must be 18+').max(120, 'Invalid age')
const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)

// Objects
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().positive(),
})

// Arrays
const tagsSchema = z.array(z.string())
const usersSchema = z.array(userSchema)

// Optional and Nullable
const optionalField = z.string().optional()       // string | undefined
const nullableField = z.string().nullable()       // string | null
const nullishField = z.string().nullish()         // string | null | undefined

// Default values
const withDefault = z.string().default('default value')

// Unions
const statusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('pending'),
])
// Shorthand for literals
const statusEnum = z.enum(['active', 'inactive', 'pending'])

// Nested objects
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/),
})

const profileSchema = z.object({
  name: z.string(),
  address: addressSchema,  // Nested object
})

// Custom error messages
const passwordSchema = z.string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain uppercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain number' })
```

**Type Inference**:
```typescript
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

// Automatically infer TypeScript type
type User = z.infer<typeof userSchema>
// Result: { name: string; age: number }
```

### Zod Refinements (Custom Validation)

```typescript
// Simple refinement
const passwordConfirmSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Error will appear on confirmPassword field
})

// Multiple refinements
const signupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  age: z.number(),
})
  .refine((data) => data.username !== data.email.split('@')[0], {
    message: 'Username cannot be your email prefix',
    path: ['username'],
  })
  .refine((data) => data.age >= 18, {
    message: 'Must be 18 or older',
    path: ['age'],
  })

// Async refinement (for API checks)
const usernameSchema = z.string().refine(async (username) => {
  // Check if username is available via API
  const response = await fetch(`/api/check-username?username=${username}`)
  const { available } = await response.json()
  return available
}, {
  message: 'Username is already taken',
})
```

### Zod Transforms (Data Manipulation)

```typescript
// Transform string to number
const ageSchema = z.string().transform((val) => parseInt(val, 10))

// Transform to uppercase
const uppercaseSchema = z.string().transform((val) => val.toUpperCase())

// Transform date string to Date object
const dateSchema = z.string().transform((val) => new Date(val))

// Trim whitespace
const trimmedSchema = z.string().transform((val) => val.trim())

// Complex transform
const userInputSchema = z.object({
  email: z.string().email().transform((val) => val.toLowerCase()),
  tags: z.string().transform((val) => val.split(',').map(tag => tag.trim())),
})

// Chain transform and refine
const positiveNumberSchema = z.string()
  .transform((val) => parseFloat(val))
  .refine((val) => !isNaN(val), { message: 'Must be a number' })
  .refine((val) => val > 0, { message: 'Must be positive' })
```

### zodResolver Integration

```typescript
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm<FormData>({
  resolver: zodResolver(schema),
})
```

**What zodResolver Does**:
1. Takes your Zod schema
2. Converts it to a format React Hook Form understands
3. Provides validation function that runs on form submission
4. Maps Zod errors to React Hook Form error format
5. Preserves type safety with TypeScript inference

**zodResolver Options**:
```typescript
import { zodResolver } from '@hookform/resolvers/zod'

// With options
const form = useForm({
  resolver: zodResolver(schema, {
    async: false,     // Use async validation
    raw: false,       // Return raw Zod error
  }),
})
```

---

## Form Registration Patterns

### Pattern 1: Simple Input Registration

```typescript
function BasicForm() {
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Spread register result to input */}
      <input {...register('email')} />
      <input {...register('password')} />

      {/* With custom props */}
      <input
        {...register('username')}
        placeholder="Enter username"
        className="input"
      />
    </form>
  )
}
```

**What `register()` Returns**:
```typescript
{
  onChange: (e) => void,
  onBlur: (e) => void,
  ref: (instance) => void,
  name: string,
}
```

### Pattern 2: Controller (for Custom Components)

Use `Controller` when the input doesn't expose `ref` (like custom components, React Select, date pickers, etc.):

```typescript
import { Controller } from 'react-hook-form'

function FormWithCustomInput() {
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <CustomSelect
            {...field}                      // value, onChange, onBlur, ref
            options={categoryOptions}
          />
        )}
      />

      {/* With more control */}
      <Controller
        name="dateOfBirth"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <DatePicker
              selected={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
            {fieldState.error && (
              <span>{fieldState.error.message}</span>
            )}
          </div>
        )}
      />
    </form>
  )
}
```

**When to Use Controller**:
- ✅ Third-party UI libraries (React Select, Material-UI, Ant Design, etc.)
- ✅ Custom components that don't expose ref
- ✅ Components that don't use onChange (like checkboxes with custom handlers)
- ✅ Need fine-grained control over field behavior

**When NOT to Use Controller**:
- ❌ Standard HTML inputs (use `register` instead - it's simpler and faster)
- ❌ When performance is critical (Controller adds minimal overhead)

### Pattern 3: useController (Reusable Controlled Inputs)

```typescript
import { useController } from 'react-hook-form'

// Reusable custom input component
function CustomInput({ name, control, label }) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue: '',
  })

  return (
    <div>
      <label>{label}</label>
      <input {...field} />
      {error && <span>{error.message}</span>}
    </div>
  )
}

// Usage
function MyForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CustomInput name="email" control={control} label="Email" />
      <CustomInput name="username" control={control} label="Username" />
    </form>
  )
}
```

---

## Error Handling

### Displaying Errors

```typescript
function FormWithErrors() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('email')} aria-invalid={errors.email ? 'true' : 'false'} />

        {/* Simple error display */}
        {errors.email && <span>{errors.email.message}</span>}

        {/* Accessible error display */}
        {errors.email && (
          <span role="alert" className="error">
            {errors.email.message}
          </span>
        )}

        {/* Error with icon */}
        {errors.email && (
          <div role="alert" className="error">
            <ErrorIcon />
            <span>{errors.email.message}</span>
          </div>
        )}
      </div>
    </form>
  )
}
```

### Error Object Structure

```typescript
// errors object structure
{
  email: {
    type: 'invalid_string',
    message: 'Invalid email address',
  },
  password: {
    type: 'too_small',
    message: 'Password must be at least 8 characters',
  },
  // Nested errors
  address: {
    street: {
      type: 'invalid_type',
      message: 'Expected string, received undefined',
    },
  },
}
```

### Form-Level Validation Errors

```typescript
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Attach error to confirmPassword field
})

// Without path - creates root error
.refine((data) => someCondition, {
  message: 'Form validation failed',
})

// Access root errors
const { formState: { errors } } = useForm()
errors.root?.message // Root-level error
```

### Server Errors Integration

```typescript
function FormWithServerErrors() {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const { errors: serverErrors } = await response.json()

        // Map server errors to form fields
        Object.entries(serverErrors).forEach(([field, message]) => {
          setError(field, {
            type: 'server',
            message,
          })
        })

        return
      }

      // Success!
    } catch (error) {
      // Generic error
      setError('root', {
        type: 'server',
        message: 'An error occurred. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root && <div role="alert">{errors.root.message}</div>}
      {/* ... */}
    </form>
  )
}
```

---

## Advanced Patterns

### Dynamic Form Fields (useFieldArray)

```typescript
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const contactSchema = z.object({
  contacts: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
    })
  ).min(1, 'At least one contact is required'),
})

type ContactFormData = z.infer<typeof contactSchema>

function ContactListForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contacts: [{ name: '', email: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id}> {/* IMPORTANT: Use field.id, not index */}
          <input
            {...register(`contacts.${index}.name` as const)}
            placeholder="Name"
          />
          {errors.contacts?.[index]?.name && (
            <span>{errors.contacts[index].name.message}</span>
          )}

          <input
            {...register(`contacts.${index}.email` as const)}
            placeholder="Email"
          />
          {errors.contacts?.[index]?.email && (
            <span>{errors.contacts[index].email.message}</span>
          )}

          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: '', email: '' })}
      >
        Add Contact
      </button>

      <button type="submit">Submit</button>
    </form>
  )
}
```

**useFieldArray API**:
- `fields` - Array of field items with unique IDs
- `append(value)` - Add new item to end
- `prepend(value)` - Add new item to beginning
- `insert(index, value)` - Insert item at index
- `remove(index)` - Remove item at index
- `update(index, value)` - Update item at index
- `replace(values)` - Replace entire array

### Async Validation with Debouncing

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDebouncedCallback } from 'use-debounce' // npm install use-debounce

const usernameSchema = z.string().min(3).refine(async (username) => {
  const response = await fetch(`/api/check-username?username=${username}`)
  const { available } = await response.json()
  return available
}, {
  message: 'Username is already taken',
})

function AsyncValidationForm() {
  const { register, handleSubmit, trigger, formState: { errors, isValidating } } = useForm({
    resolver: zodResolver(z.object({ username: usernameSchema })),
    mode: 'onChange', // Validate on every change
  })

  // Debounce validation to avoid too many API calls
  const debouncedValidation = useDebouncedCallback(() => {
    trigger('username')
  }, 500) // Wait 500ms after user stops typing

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('username')}
        onChange={(e) => {
          register('username').onChange(e)
          debouncedValidation()
        }}
      />
      {isValidating && <span>Checking availability...</span>}
      {errors.username && <span>{errors.username.message}</span>}
    </form>
  )
}
```

### Multi-Step Form (Wizard)

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Step schemas
const step1Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

const step2Schema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
})

const step3Schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Invalid card number'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
})

// Combined schema for final validation
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema)

type FormData = z.infer<typeof fullSchema>

function MultiStepForm() {
  const [step, setStep] = useState(1)

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange',
  })

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = []

    if (step === 1) {
      fieldsToValidate = ['name', 'email']
    } else if (step === 2) {
      fieldsToValidate = ['address', 'city']
    }

    // Validate current step fields
    const isValid = await trigger(fieldsToValidate)

    if (isValid) {
      setStep(step + 1)
    }
  }

  const prevStep = () => setStep(step - 1)

  const onSubmit = (data: FormData) => {
    console.log('Final data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Progress indicator */}
      <div className="progress">
        Step {step} of 3
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <h2>Personal Information</h2>
          <input {...register('name')} placeholder="Name" />
          {errors.name && <span>{errors.name.message}</span>}

          <input {...register('email')} placeholder="Email" />
          {errors.email && <span>{errors.email.message}</span>}
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h2>Address</h2>
          <input {...register('address')} placeholder="Address" />
          {errors.address && <span>{errors.address.message}</span>}

          <input {...register('city')} placeholder="City" />
          {errors.city && <span>{errors.city.message}</span>}
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <h2>Payment</h2>
          <input {...register('cardNumber')} placeholder="Card Number" />
          {errors.cardNumber && <span>{errors.cardNumber.message}</span>}

          <input {...register('cvv')} placeholder="CVV" />
          {errors.cvv && <span>{errors.cvv.message}</span>}
        </div>
      )}

      {/* Navigation */}
      <div>
        {step > 1 && (
          <button type="button" onClick={prevStep}>
            Previous
          </button>
        )}
        {step < 3 ? (
          <button type="button" onClick={nextStep}>
            Next
          </button>
        ) : (
          <button type="submit">Submit</button>
        )}
      </div>
    </form>
  )
}
```

### Conditional Validation

```typescript
import { z } from 'zod'

// Schema with conditional validation
const formSchema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('personal'),
    name: z.string().min(1),
  }),
  z.object({
    accountType: z.literal('business'),
    companyName: z.string().min(1),
    taxId: z.string().regex(/^\d{9}$/),
  }),
])

// Alternative: Using refine
const conditionalSchema = z.object({
  hasDiscount: z.boolean(),
  discountCode: z.string().optional(),
}).refine((data) => {
  // If hasDiscount is true, discountCode is required
  if (data.hasDiscount && !data.discountCode) {
    return false
  }
  return true
}, {
  message: 'Discount code is required when discount is enabled',
  path: ['discountCode'],
})
```

---

## shadcn/ui Integration

### Using Form Component (Legacy)

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <button type="submit">Submit</button>
      </form>
    </Form>
  )
}
```

**Note**: shadcn/ui states "We are not actively developing the Form component anymore." They recommend using the Field component for new implementations.

### Using Field Component (Recommended)

Check shadcn/ui documentation for the latest Field component API as it's the actively maintained approach.

---

## Performance Optimization

### Form Mode Strategies

```typescript
// Best performance - validate only on submit
const form = useForm({
  mode: 'onSubmit',
  resolver: zodResolver(schema),
})

// Good balance - validate on blur
const form = useForm({
  mode: 'onBlur',
  resolver: zodResolver(schema),
})

// Live feedback - validate on every change
const form = useForm({
  mode: 'onChange',
  resolver: zodResolver(schema),
})

// Maximum validation - all events
const form = useForm({
  mode: 'all',
  resolver: zodResolver(schema),
})
```

### Controlled vs Uncontrolled Inputs

```typescript
// Uncontrolled (better performance) - use register
<input {...register('email')} />

// Controlled (more control) - use Controller
<Controller
  name="email"
  control={control}
  render={({ field }) => <Input {...field} />}
/>
```

**Recommendation**: Use `register` for standard inputs, `Controller` only when necessary (third-party components, custom behavior).

### Isolation with Controller

```typescript
// BAD: Entire form re-renders when any field changes
function BadForm() {
  const { watch } = useForm()
  const values = watch() // Watches ALL fields

  return <div>{JSON.stringify(values)}</div>
}

// GOOD: Only re-render when specific field changes
function GoodForm() {
  const { watch } = useForm()
  const email = watch('email') // Watches only email field

  return <div>{email}</div>
}
```

### shouldUnregister Flag

```typescript
const form = useForm({
  resolver: zodResolver(schema),
  shouldUnregister: true, // Remove field data when unmounted
})
```

**When to use**:
- ✅ Multi-step forms where steps have different fields
- ✅ Conditional fields that should not persist
- ✅ Want to clear data when component unmounts

**When NOT to use**:
- ❌ Want to preserve form data when toggling visibility
- ❌ Navigating between form sections (tabs, accordions)

---

## Accessibility Best Practices

### ARIA Attributes

```typescript
function AccessibleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>
    </form>
  )
}
```

### Error Announcements

```typescript
import { useEffect } from 'react'

function FormWithAnnouncements() {
  const { formState: { errors, isSubmitted } } = useForm()

  // Announce errors to screen readers
  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) {
      const errorCount = Object.keys(errors).length
      const announcement = `Form submission failed with ${errorCount} error${errorCount > 1 ? 's' : ''}`

      // Create live region for announcement
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('role', 'alert')
      liveRegion.setAttribute('aria-live', 'assertive')
      liveRegion.textContent = announcement
      document.body.appendChild(liveRegion)

      setTimeout(() => {
        document.body.removeChild(liveRegion)
      }, 1000)
    }
  }, [errors, isSubmitted])

  return (
    <form>
      {/* ... */}
    </form>
  )
}
```

### Focus Management

```typescript
import { useRef, useEffect } from 'react'

function FormWithFocus() {
  const { handleSubmit, formState: { errors } } = useForm()
  const firstErrorRef = useRef<HTMLInputElement>(null)

  // Focus first error field on validation failure
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      firstErrorRef.current?.focus()
    }
  }, [errors])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email')}
        ref={errors.email ? firstErrorRef : undefined}
      />
    </form>
  )
}
```

---

## Critical Rules

### Always Do

✅ **Set defaultValues** to prevent "uncontrolled to controlled" warnings
```typescript
const form = useForm({
  defaultValues: { email: '', password: '' }, // ALWAYS set defaults
})
```

✅ **Use zodResolver** for Zod integration
```typescript
const form = useForm({
  resolver: zodResolver(schema), // Required for Zod validation
})
```

✅ **Type forms with z.infer**
```typescript
type FormData = z.infer<typeof schema> // Automatic type inference
```

✅ **Validate on both client AND server**
```typescript
// Client
const form = useForm({ resolver: zodResolver(schema) })

// Server
const data = schema.parse(await req.json()) // SAME schema
```

✅ **Use formState.errors for error display**
```typescript
{errors.email && <span role="alert">{errors.email.message}</span>}
```

✅ **Add ARIA attributes for accessibility**
```typescript
<input
  {...register('email')}
  aria-invalid={errors.email ? 'true' : 'false'}
  aria-describedby="email-error"
/>
```

✅ **Use field.id for useFieldArray keys**
```typescript
{fields.map((field) => <div key={field.id}>{/* ... */}</div>)}
```

✅ **Debounce async validation**
```typescript
const debouncedValidation = useDebouncedCallback(() => trigger('username'), 500)
```

### Never Do

❌ **Skip server-side validation** (security vulnerability!)
```typescript
// BAD: Only client validation
const form = useForm({ resolver: zodResolver(schema) })
// API endpoint has no validation

// GOOD: Validate on both client and server
const form = useForm({ resolver: zodResolver(schema) })
// API: schema.parse(data) on server too
```

❌ **Use Zod v4 without checking type inference**
```typescript
// Issue #13109: Zod v4 has type inference changes
// Test your types carefully when upgrading
```

❌ **Forget to spread {...field} in Controller**
```typescript
// BAD
<Controller render={({ field }) => <Input value={field.value} />} />

// GOOD
<Controller render={({ field }) => <Input {...field} />} />
```

❌ **Mutate form values directly**
```typescript
// BAD
const values = getValues()
values.email = 'new@email.com' // Direct mutation

// GOOD
setValue('email', 'new@email.com') // Use setValue
```

❌ **Use inline validation without debouncing**
```typescript
// BAD: Validates on every keystroke
const form = useForm({ mode: 'onChange' })

// GOOD: Debounce async validation
const debouncedTrigger = useDebouncedCallback(() => trigger(), 500)
```

❌ **Mix controlled and uncontrolled inputs**
```typescript
// BAD: Mixing patterns
<input {...register('email')} value={email} onChange={setEmail} />

// GOOD: Choose one pattern
<input {...register('email')} /> // Uncontrolled
// OR
<Controller render={({ field }) => <Input {...field} />} /> // Controlled
```

❌ **Use index as key in useFieldArray**
```typescript
// BAD
{fields.map((field, index) => <div key={index}>{/* ... */}</div>)}

// GOOD
{fields.map((field) => <div key={field.id}>{/* ... */}</div>)}
```

❌ **Forget defaultValues for all fields**
```typescript
// BAD: Missing defaults causes warnings
const form = useForm({
  resolver: zodResolver(schema),
})

// GOOD: Set defaults for all fields
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '', remember: false },
})
```

---

## Known Issues Prevention

This skill prevents **12** documented issues:

### Issue #1: Zod v4 Type Inference Errors
**Error**: Type inference doesn't work correctly with Zod v4
**Source**: [GitHub Issue #13109](https://github.com/react-hook-form/react-hook-form/issues/13109)
**Why It Happens**: Zod v4 changed how types are inferred
**Prevention**: Use correct type patterns: `type FormData = z.infer<typeof schema>`

### Issue #2: Uncontrolled to Controlled Warning
**Error**: "A component is changing an uncontrolled input to be controlled"
**Source**: React documentation
**Why It Happens**: Not setting defaultValues causes undefined -> value transition
**Prevention**: Always set defaultValues for all fields

### Issue #3: Nested Object Validation Errors
**Error**: Errors for nested fields don't display correctly
**Source**: Common React Hook Form issue
**Why It Happens**: Accessing nested errors incorrectly
**Prevention**: Use optional chaining: `errors.address?.street?.message`

### Issue #4: Array Field Re-renders
**Error**: Form re-renders excessively with array fields
**Source**: Performance issue
**Why It Happens**: Not using field.id as key
**Prevention**: Use `key={field.id}` in useFieldArray map

### Issue #5: Async Validation Race Conditions
**Error**: Multiple validation requests cause conflicting results
**Source**: Common async pattern issue
**Why It Happens**: No debouncing or request cancellation
**Prevention**: Debounce validation and cancel pending requests

### Issue #6: Server Error Mapping
**Error**: Server validation errors don't map to form fields
**Source**: Integration issue
**Why It Happens**: Server error format doesn't match React Hook Form format
**Prevention**: Use setError() to map server errors to fields

### Issue #7: Default Values Not Applied
**Error**: Form fields don't show default values
**Source**: Common mistake
**Why It Happens**: defaultValues set after form initialization
**Prevention**: Set defaultValues in useForm options, not useState

### Issue #8: Controller Field Not Updating
**Error**: Custom component doesn't update when value changes
**Source**: Common Controller issue
**Why It Happens**: Not spreading {...field} in render function
**Prevention**: Always spread {...field} to custom component

### Issue #9: useFieldArray Key Warnings
**Error**: React warning about duplicate keys in list
**Source**: React list rendering
**Why It Happens**: Using array index as key instead of field.id
**Prevention**: Use field.id: `key={field.id}`

### Issue #10: Schema Refinement Error Paths
**Error**: Custom validation errors appear at wrong field
**Source**: Zod refinement behavior
**Why It Happens**: Not specifying path in refinement options
**Prevention**: Add path option: `refine(..., { message: '...', path: ['fieldName'] })`

### Issue #11: Transform vs Preprocess Confusion
**Error**: Data transformation doesn't work as expected
**Source**: Zod API confusion
**Why It Happens**: Using wrong method for use case
**Prevention**: Use transform for output transformation, preprocess for input transformation

### Issue #12: Multiple Resolver Conflicts
**Error**: Form validation doesn't work with multiple resolvers
**Source**: Configuration error
**Why It Happens**: Trying to use multiple validation libraries
**Prevention**: Use single resolver (zodResolver), combine schemas if needed

---

## Templates

See the `templates/` directory for working examples:

1. **basic-form.tsx** - Simple login/signup form
2. **advanced-form.tsx** - Nested objects, arrays, conditional fields
3. **shadcn-form.tsx** - shadcn/ui Form component integration
4. **server-validation.ts** - Server-side validation with same schema
5. **async-validation.tsx** - Async validation with debouncing
6. **dynamic-fields.tsx** - useFieldArray for adding/removing items
7. **multi-step-form.tsx** - Wizard with per-step validation
8. **custom-error-display.tsx** - Custom error formatting
9. **package.json** - Complete dependencies

---

## References

See the `references/` directory for deep-dive documentation:

1. **zod-schemas-guide.md** - Comprehensive Zod schema patterns
2. **rhf-api-reference.md** - Complete React Hook Form API
3. **error-handling.md** - Error messages, formatting, accessibility
4. **accessibility.md** - WCAG compliance, ARIA attributes
5. **performance-optimization.md** - Form modes, validation strategies
6. **shadcn-integration.md** - shadcn/ui Form vs Field components
7. **top-errors.md** - 12 common errors with solutions
8. **links-to-official-docs.md** - Organized documentation links

---

## Official Documentation

- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **@hookform/resolvers**: https://github.com/react-hook-form/resolvers
- **shadcn/ui Form**: https://ui.shadcn.com/docs/components/form

---

**License**: MIT
**Last Verified**: 2025-10-23
**Maintainer**: Jeremy Dawes (jeremy@jezweb.net)
