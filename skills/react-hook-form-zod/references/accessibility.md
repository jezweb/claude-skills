# Accessibility (a11y) Best Practices

Complete guide for building accessible forms.

---

## WCAG Compliance

### Required Elements

1. **Labels** - Every input must have a label
2. **Error Messages** - Must be accessible to screen readers
3. **Focus Management** - Errors should be announced
4. **Keyboard Navigation** - Full keyboard support

---

## ARIA Attributes

### Essential ARIA

```typescript
<input
  id="email"
  type="email"
  {...register('email')}
  aria-invalid={errors.email ? 'true' : 'false'}
  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
  aria-required="true"
/>

<span id="email-hint">We'll never share your email</span>

{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
```

### Live Regions for Error Announcements

```typescript
{Object.keys(errors).length > 0 && (
  <div role="alert" aria-live="assertive" aria-atomic="true">
    Form has {Object.keys(errors).length} errors. Please review.
  </div>
)}
```

---

## Focus Management

### Focus First Error

```typescript
import { useEffect, useRef } from 'react'

const firstErrorRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  if (Object.keys(errors).length > 0) {
    firstErrorRef.current?.focus()
  }
}, [errors])

// In JSX
<input
  ref={Object.keys(errors)[0] === 'email' ? firstErrorRef : undefined}
  {...register('email')}
/>
```

### Using setFocus

```typescript
const onSubmit = async (data) => {
  try {
    await submitData(data)
  } catch (error) {
    setFocus('email') // Focus field programmatically
  }
}
```

---

## Label Association

### Explicit Labels

```typescript
<label htmlFor="email">Email Address</label>
<input id="email" {...register('email')} />
```

### aria-label (When Visual Label Not Possible)

```typescript
<input
  {...register('search')}
  aria-label="Search products"
  placeholder="Search..."
/>
```

### aria-labelledby (Multiple Labels)

```typescript
<h3 id="billing-heading">Billing Address</h3>
<input
  {...register('billingStreet')}
  aria-labelledby="billing-heading billing-street-label"
/>
<span id="billing-street-label">Street</span>
```

---

## Required Fields

### Visual Indicator

```typescript
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input
  id="email"
  {...register('email')}
  aria-required="true"
  required
/>
```

### Legend for Required Fields

```typescript
<p className="required-legend">
  <span aria-label="required">*</span> Required field
</p>
```

---

## Error Messaging

### Accessible Error Pattern

```typescript
<div>
  <label htmlFor="password">Password</label>
  <input
    id="password"
    type="password"
    {...register('password')}
    aria-invalid={errors.password ? 'true' : 'false'}
    aria-describedby={errors.password ? 'password-error' : 'password-hint'}
  />

  <span id="password-hint" className="hint">
    Must be at least 8 characters
  </span>

  {errors.password && (
    <span id="password-error" role="alert" className="error">
      {errors.password.message}
    </span>
  )}
</div>
```

---

## Fieldsets and Legends

### Grouping Related Fields

```typescript
<fieldset>
  <legend>Contact Information</legend>

  <div>
    <label htmlFor="firstName">First Name</label>
    <input id="firstName" {...register('firstName')} />
  </div>

  <div>
    <label htmlFor="lastName">Last Name</label>
    <input id="lastName" {...register('lastName')} />
  </div>
</fieldset>
```

### Radio Groups

```typescript
<fieldset>
  <legend>Choose your plan</legend>

  <div>
    <input
      id="plan-basic"
      type="radio"
      value="basic"
      {...register('plan')}
    />
    <label htmlFor="plan-basic">Basic</label>
  </div>

  <div>
    <input
      id="plan-pro"
      type="radio"
      value="pro"
      {...register('plan')}
    />
    <label htmlFor="plan-pro">Pro</label>
  </div>
</fieldset>
```

---

## Keyboard Navigation

### Tab Order

```typescript
// Ensure logical tab order with tabindex (use sparingly)
<input {...register('email')} tabIndex={1} />
<input {...register('password')} tabIndex={2} />
<button type="submit" tabIndex={3}>Submit</button>
```

### Skip Links

```typescript
<a href="#main-form" className="skip-link">
  Skip to form
</a>

<form id="main-form">
  {/* ... */}
</form>
```

---

## Button Accessibility

### Submit Button States

```typescript
<button
  type="submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting ? 'true' : 'false'}
  aria-live="polite"
>
  {isSubmitting ? 'Submitting...' : 'Submit Form'}
</button>
```

### Icon Buttons

```typescript
<button type="button" aria-label="Remove item" onClick={remove}>
  <TrashIcon aria-hidden="true" />
</button>
```

---

## Screen Reader Announcements

### Status Messages

```typescript
{isSubmitSuccessful && (
  <div role="status" aria-live="polite">
    Form submitted successfully!
  </div>
)}
```

### Loading States

```typescript
{isSubmitting && (
  <div role="status" aria-live="polite">
    Submitting form, please wait...
  </div>
)}
```

---

## Color Contrast

### WCAG AA Standards

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

```css
/* Good contrast examples */
.error {
  color: #c41e3a; /* Red */
  background: #ffffff; /* White */
  /* Contrast ratio: 5.77:1 ✓ */
}

.button {
  color: #ffffff;
  background: #0066cc;
  /* Contrast ratio: 7.33:1 ✓ */
}
```

---

## Testing

### Automated Testing Tools

- **axe DevTools** - Browser extension
- **Lighthouse** - Chrome DevTools
- **WAVE** - Web accessibility evaluation tool

### Manual Testing

1. **Keyboard Navigation** - Tab through entire form
2. **Screen Reader** - Test with NVDA (Windows) or VoiceOver (Mac)
3. **Zoom** - Test at 200% zoom
4. **High Contrast** - Test in high contrast mode

---

## Accessibility Checklist

- [ ] All inputs have associated labels
- [ ] Required fields are marked with aria-required
- [ ] Error messages use role="alert"
- [ ] Errors have aria-describedby linking to error text
- [ ] Form has clear heading structure
- [ ] Keyboard navigation works completely
- [ ] Focus is managed appropriately
- [ ] Color is not the only indicator of errors
- [ ] Contrast ratios meet WCAG AA standards
- [ ] Screen reader testing completed

---

**Resources**:
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- React Hook Form a11y: https://react-hook-form.com/advanced-usage#AccessibilityA11y
