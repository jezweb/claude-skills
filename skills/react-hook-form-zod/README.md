# React Hook Form + Zod Validation

**Status**: Production Ready ✅
**Last Updated**: 2025-10-23
**Production Tested**: Multiple production applications
**Token Savings**: ~60%
**Errors Prevented**: 12 documented issues

---

## Auto-Trigger Keywords

Claude Code automatically discovers this skill when you mention:

### Primary Keywords
- react-hook-form
- useForm
- zod validation
- form validation
- zodResolver
- @hookform/resolvers
- rhf
- form schema
- zod schema
- react forms

### Secondary Keywords
- register form
- handleSubmit
- formState errors
- form validation react
- useFieldArray
- useWatch
- useController
- Controller component
- form errors
- validation schema
- client side validation
- server side validation
- form error handling
- validation errors react

### Framework Integration
- shadcn form
- shadcn/ui form
- Form component shadcn
- Field component shadcn
- next.js form validation
- react form validation
- vite form validation

### Zod-Specific
- z.object
- z.string
- z.number
- z.array
- z.infer
- zod refine
- zod transform
- zod error messages
- schema validation

### Error-Based Keywords
- "resolver not found"
- "zod type inference"
- "form validation failed"
- "schema validation error"
- "useForm types"
- "zod infer"
- "nested validation"
- "array field validation"
- "dynamic fields"
- "uncontrolled to controlled"
- "default values required"
- "field not updating"
- "resolver is not a function"
- "schema parse error"

---

## What This Skill Does

This skill provides comprehensive knowledge for building type-safe, validated forms in React using React Hook Form + Zod:

- **Complete React Hook Form API** - useForm, register, Controller, useFieldArray, useWatch, useController
- **Zod Schema Patterns** - All data types, refinements, transforms, error customization
- **shadcn/ui Integration** - Form and Field component patterns
- **Client + Server Validation** - Dual validation with single source of truth
- **Advanced Patterns** - Dynamic fields, multi-step forms, async validation, nested objects, arrays
- **Error Handling** - Accessible error display, custom formatting, server error mapping
- **Performance Optimization** - Form modes, validation strategies, re-render optimization
- **TypeScript Type Safety** - Full type inference from Zod schemas
- **Accessibility** - WCAG compliance, ARIA attributes, keyboard navigation

---

## Known Issues Prevented

This skill prevents **12** documented issues:

| Issue | Source | Prevention |
|-------|--------|------------|
| Zod v4 type inference errors | [#13109](https://github.com/react-hook-form/react-hook-form/issues/13109) | Correct type patterns for Zod v4 |
| Uncontrolled to controlled warning | React docs | Always set defaultValues |
| Nested object validation errors | Common issue | Proper error path handling |
| Array field re-renders | Performance issue | useFieldArray optimization |
| Async validation race conditions | Common pattern | Debouncing and cancellation |
| Server error mapping | Integration issue | Error structure alignment |
| Default values not applied | Common mistake | Proper initialization |
| Controller field not updating | Common issue | Correct render function usage |
| useFieldArray key warnings | React warnings | Proper key prop usage |
| Schema refinement error paths | Zod behavior | Custom path specification |
| Transform vs preprocess confusion | Zod API | Clear usage guidelines |
| Multiple resolver conflicts | Configuration error | Single resolver pattern |

---

## When to Use This Skill

✅ **Use when**:
- Building forms with validation in React
- Need type-safe form data
- Want client + server validation with single schema
- Using shadcn/ui components
- Need complex validation (nested objects, arrays, conditional)
- Require accessible form error handling
- Building multi-step forms or wizards
- Need dynamic form fields (add/remove items)
- Want performance-optimized forms
- Using Next.js, Vite, or any React framework

❌ **Don't use when**:
- Building simple forms without validation (plain React state is fine)
- Using different validation library (Yup, Joi, etc.)
- Using different form library (Formik, Final Form, etc.)
- Building non-React forms (use appropriate library)

---

## Quick Example

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 1. Define Zod schema
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// 2. Infer TypeScript type
type FormData = z.infer<typeof formSchema>

function LoginForm() {
  // 3. Setup form with zodResolver
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  // 4. Handle submission
  const onSubmit = (data: FormData) => {
    console.log('Valid data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Login</button>
    </form>
  )
}
```

---

## Package Versions

**Latest Tested Versions** (as of 2025-10-23):
- react-hook-form: 7.65.0
- zod: 4.1.12
- @hookform/resolvers: 5.2.2

**Installation**:
```bash
npm install react-hook-form@7.65.0 zod@4.1.12 @hookform/resolvers@5.2.2
```

---

## Token Efficiency

**Manual Setup** (without skill):
- Initial implementation: ~6,000 tokens
- Debugging validation errors: ~3,000 tokens
- Adding advanced features: ~2,000 tokens
- **Total**: ~10,000 tokens

**With Skill**:
- Direct implementation: ~3,000 tokens
- Minimal debugging: ~500 tokens
- Advanced features: ~500 tokens
- **Total**: ~4,000 tokens

**Savings**: ~60% (6,000 tokens saved)

---

## Templates Included

1. **basic-form.tsx** - Simple login/signup form
2. **advanced-form.tsx** - Nested objects, arrays, conditional fields
3. **shadcn-form.tsx** - shadcn/ui Form component integration
4. **server-validation.ts** - Server-side validation with same schema
5. **async-validation.tsx** - Async validation with debouncing
6. **dynamic-fields.tsx** - useFieldArray for adding/removing items
7. **multi-step-form.tsx** - Wizard with per-step validation
8. **custom-error-display.tsx** - Custom error formatting and display
9. **package.json** - Complete dependencies

---

## Reference Documentation

- **zod-schemas-guide.md** - Comprehensive Zod schema patterns
- **rhf-api-reference.md** - Complete React Hook Form API
- **error-handling.md** - Error messages, formatting, accessibility
- **accessibility.md** - WCAG compliance, ARIA attributes
- **performance-optimization.md** - Form modes, validation strategies
- **shadcn-integration.md** - shadcn/ui Form vs Field components
- **top-errors.md** - 12 common errors with solutions
- **links-to-official-docs.md** - Organized documentation links

---

## Dependencies

- React 18+ or React 19+
- TypeScript 5+ (recommended)
- No other Claude Code skills required (standalone)

---

## Production Validation

This skill has been tested in:
- ✅ React + Vite applications
- ✅ Next.js App Router with Server Actions
- ✅ Next.js Pages Router with API routes
- ✅ shadcn/ui Form component integration
- ✅ Complex validation scenarios (nested, arrays, async)
- ✅ TypeScript strict mode

---

## Contributing

Found an issue or have a suggestion? Open an issue at:
https://github.com/jezweb/claude-skills/issues

---

**License**: MIT
**Maintainer**: Jeremy Dawes (jeremy@jezweb.net)
**Repository**: https://github.com/jezweb/claude-skills
