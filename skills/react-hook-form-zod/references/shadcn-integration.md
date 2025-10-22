# shadcn/ui Integration Guide

Complete guide for using shadcn/ui with React Hook Form + Zod.

---

## Form Component (Legacy)

**Status**: "Not actively developed" according to shadcn/ui documentation
**Recommendation**: Use Field component for new projects (coming soon)

### Installation

```bash
npx shadcn@latest add form
```

### Basic Usage

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

const schema = z.object({
  username: z.string().min(2),
})

function ProfileForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

---

## Form Component Anatomy

### FormField

```typescript
<FormField
  control={form.control}  // Required
  name="fieldName"        // Required
  render={({ field, fieldState, formState }) => (
    // Your field component
  )}
/>
```

### FormItem

Container for field, label, description, and message.

```typescript
<FormItem>
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input {...field} />
  </FormControl>
  <FormDescription>Helper text</FormDescription>
  <FormMessage />
</FormItem>
```

### FormControl

Wraps the actual input component.

```typescript
<FormControl>
  <Input {...field} />
</FormControl>
```

### FormLabel

Accessible label with automatic linking to input.

```typescript
<FormLabel>Email Address</FormLabel>
```

### FormDescription

Helper text for the field.

```typescript
<FormDescription>
  We'll never share your email.
</FormDescription>
```

### FormMessage

Displays validation errors.

```typescript
<FormMessage />
```

---

## Common Patterns

### Input Field

```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" placeholder="you@example.com" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

```typescript
<FormField
  control={form.control}
  name="bio"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Bio</FormLabel>
      <FormControl>
        <Textarea {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Select

```typescript
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox

```typescript
<FormField
  control={form.control}
  name="newsletter"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Subscribe to newsletter</FormLabel>
        <FormDescription>
          Receive email updates about new products.
        </FormDescription>
      </div>
    </FormItem>
  )}
/>
```

### Radio Group

```typescript
<FormField
  control={form.control}
  name="plan"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Select a plan</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
        >
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="free" />
            </FormControl>
            <FormLabel className="font-normal">Free</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="pro" />
            </FormControl>
            <FormLabel className="font-normal">Pro</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Switch

```typescript
<FormField
  control={form.control}
  name="notifications"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">
          Email Notifications
        </FormLabel>
        <FormDescription>
          Receive emails about your account activity.
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

---

## Nested Objects

```typescript
const schema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
})

<FormField
  control={form.control}
  name="user.name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Arrays

```typescript
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'items',
})

{fields.map((field, index) => (
  <FormField
    key={field.id}
    control={form.control}
    name={`items.${index}.name`}
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
))}
```

---

## Custom Validation

```typescript
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      {/* Custom error styling */}
      {errors.username && (
        <div className="text-sm font-medium text-destructive">
          {errors.username.message}
        </div>
      )}
    </FormItem>
  )}
/>
```

---

## Field Component (Future)

**Status**: Recommended for new implementations (in development)

Check official docs for latest: https://ui.shadcn.com/docs/components/form

---

## Tips

1. **Always spread {...field}** in FormControl
2. **Use Form component** for automatic ID generation
3. **FormMessage** automatically displays errors
4. **Combine with Zod** for type-safe validation
5. **Check documentation** - Form component is not actively developed

---

**Official Docs**:
- shadcn/ui Form: https://ui.shadcn.com/docs/components/form
- React Hook Form: https://react-hook-form.com/
