# Turnstile Widget Configuration Reference

**Complete reference for all widget configuration options**

**Official Docs**: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations

---

## Widget Modes

### Managed (Recommended)
Functions like a Managed Challenge Page. Selects a challenge based on visitor signals.
- Shows interactive checkbox only if bot is suspected
- Best balance of security and UX
- Use for most production deployments

### Non-Interactive
Widget is displayed but visitor never needs to interact.
- No checkbox required
- Runs challenge in background
- Use for minimal user friction

### Invisible
Widget is completely hidden from visitor.
- No visual presence
- Challenge runs invisibly
- Use for seamless UX, API protection

---

## Configuration Parameters

### Core Parameters

#### `sitekey` (Required)
- **Type**: `string`
- **Description**: Your widget's public sitekey from Cloudflare Dashboard
- **Example**: `data-sitekey="YOUR_SITE_KEY"` or `{ sitekey: 'YOUR_SITE_KEY' }`

#### `action`
- **Type**: `string`
- **Max Length**: 32 characters
- **Valid Characters**: `a-z`, `A-Z`, `0-9`, `-`, `_`
- **Description**: Custom action name tracked in analytics
- **Example**: `action: 'login'`, `action: 'signup'`

#### `cdata`
- **Type**: `string`
- **Max Length**: 255 characters
- **Description**: Custom data passed through to server validation
- **Example**: `cdata: JSON.stringify({ userId: '123' })`

---

## Appearance

### `theme`
Controls widget color scheme.

- **`auto`** (default) - Matches system preference
- **`light`** - Light mode
- **`dark`** - Dark mode

**Example**:
```html
<div class="cf-turnstile" data-theme="dark"></div>
```
```typescript
{ theme: 'dark' }
```

### `appearance`
Controls when widget becomes visible.

- **`always`** (default) - Visible from page load
- **`execute`** - Visible only after challenge begins
- **`interaction-only`** - Visible only when user interaction required

**Note**: Only affects managed/non-interactive modes. Invisible widgets never show.

**Example**:
```html
<div class="cf-turnstile" data-appearance="interaction-only"></div>
```
```typescript
{ appearance: 'interaction-only' }
```

### `size`
Controls widget dimensions.

- **`normal`** (default) - 300px × 65px
- **`compact`** - 150px × 140px
- **`flexible`** - 100% width, adapts to container

**Example**:
```html
<div class="cf-turnstile" data-size="compact"></div>
```
```typescript
{ size: 'flexible' }
```

---

## Execution

### `execution`
Controls when challenge runs and token is generated.

- **`render`** (default) - Runs automatically after rendering
- **`execute`** - Runs only when `turnstile.execute()` is called

**Use Cases**:
- `render`: Standard forms, immediate protection
- `execute`: Multi-step forms, conditional verification, performance optimization

**Example**:
```typescript
const widgetId = turnstile.render('#container', {
  sitekey: SITE_KEY,
  execution: 'execute', // Manual trigger
})

// Later, when needed:
turnstile.execute(widgetId)
```

---

## Callbacks

### `callback`
Called when challenge succeeds.

**Signature**: `(token: string) => void`

**Example**:
```html
<div class="cf-turnstile" data-callback="onSuccess"></div>
<script>
function onSuccess(token) {
  console.log('Token:', token)
}
</script>
```

```typescript
{
  callback: (token) => {
    console.log('Success:', token)
    document.getElementById('submit-btn').disabled = false
  }
}
```

### `error-callback`
Called when challenge fails or errors occur.

**Signature**: `(errorCode: string) => void`

**Example**:
```typescript
{
  'error-callback': (error) => {
    console.error('Turnstile error:', error)
    showErrorMessage('Verification failed')
  }
}
```

### `expired-callback`
Called when token expires (after 5 minutes).

**Signature**: `() => void`

**Example**:
```typescript
{
  'expired-callback': () => {
    console.warn('Token expired')
    turnstile.reset(widgetId)
  }
}
```

### `timeout-callback`
Called when interactive challenge times out (user didn't interact).

**Signature**: `() => void`

**Example**:
```typescript
{
  'timeout-callback': () => {
    console.warn('Challenge timed out')
    turnstile.reset(widgetId)
  }
}
```

---

## Retry Behavior

### `retry`
Controls automatic retry on errors.

- **`auto`** (default) - Automatically retries on transient errors
- **`never`** - No automatic retry, manual control via `turnstile.reset()`

**Example**:
```typescript
{
  retry: 'never', // Manual control
  'error-callback': (error) => {
    if (shouldRetry(error)) {
      turnstile.reset(widgetId)
    }
  }
}
```

### `retry-interval`
Milliseconds between automatic retries.

- **Default**: 8000ms (8 seconds)
- **Min**: 0
- **Max**: No limit

**Example**:
```typescript
{
  retry: 'auto',
  'retry-interval': 5000, // 5 seconds
}
```

---

## Complete Configuration Example

### Implicit Rendering (HTML)

```html
<div class="cf-turnstile"
     data-sitekey="YOUR_SITE_KEY"
     data-callback="onSuccess"
     data-error-callback="onError"
     data-expired-callback="onExpired"
     data-timeout-callback="onTimeout"
     data-theme="auto"
     data-size="normal"
     data-appearance="always"
     data-retry="auto"
     data-retry-interval="8000"
     data-action="login"
     data-cdata='{"userId":"123"}'>
</div>
```

### Explicit Rendering (TypeScript)

```typescript
const widgetId = turnstile.render('#container', {
  sitekey: 'YOUR_SITE_KEY',
  callback: (token) => console.log('Success:', token),
  'error-callback': (error) => console.error('Error:', error),
  'expired-callback': () => turnstile.reset(widgetId),
  'timeout-callback': () => console.warn('Timeout'),
  theme: 'auto',
  size: 'normal',
  execution: 'render',
  appearance: 'always',
  retry: 'auto',
  'retry-interval': 8000,
  action: 'login',
  cdata: JSON.stringify({ userId: '123' }),
})
```

---

## API Methods

### `turnstile.render()`
Renders a widget programmatically.

**Signature**:
```typescript
render(
  container: string | HTMLElement,
  options: TurnstileOptions
): string // Returns widgetId
```

**Example**:
```typescript
const widgetId = turnstile.render('#my-container', {
  sitekey: SITE_KEY,
  callback: handleSuccess,
})
```

### `turnstile.reset()`
Resets widget to initial state, clears current token.

**Signature**: `reset(widgetId: string): void`

**Example**:
```typescript
turnstile.reset(widgetId)
```

### `turnstile.remove()`
Completely removes widget from DOM.

**Signature**: `remove(widgetId: string): void`

**Example**:
```typescript
turnstile.remove(widgetId)
```

### `turnstile.execute()`
Manually triggers challenge (execution: 'execute' mode only).

**Signature**: `execute(widgetId: string): void`

**Example**:
```typescript
document.querySelector('#submit').addEventListener('click', () => {
  turnstile.execute(widgetId)
})
```

### `turnstile.getResponse()`
Gets current token value.

**Signature**: `getResponse(widgetId: string): string | undefined`

**Example**:
```typescript
const token = turnstile.getResponse(widgetId)
if (token) {
  submitForm(token)
}
```

### `turnstile.isExpired()`
Checks if token has expired.

**Signature**: `isExpired(widgetId: string): boolean`

**Example**:
```typescript
if (turnstile.isExpired(widgetId)) {
  turnstile.reset(widgetId)
}
```

---

## Migration from reCAPTCHA

Turnstile can be a drop-in replacement for reCAPTCHA v2.

### Compatibility Mode

Add `?compat=recaptcha` to script URL:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha"></script>
```

**Features**:
- Implicit rendering for reCAPTCHA
- `g-recaptcha-response` input name
- Registers API as `grecaptcha`

**Example**:
```html
<!-- Old reCAPTCHA code -->
<div class="g-recaptcha" data-sitekey="OLD_RECAPTCHA_KEY"></div>

<!-- New Turnstile code (compatibility mode) -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha"></script>
<div class="g-recaptcha" data-sitekey="NEW_TURNSTILE_KEY"></div>
```

**Note**: Change script URL and sitekey, everything else stays the same.

---

## Best Practices

✅ **Always validate server-side** - Client widget is not sufficient
✅ **Handle expiration** - Implement `expired-callback` to reset widget
✅ **Handle errors** - Use `error-callback` for user-friendly messages
✅ **Use actions** - Track different form types in analytics
✅ **Test with dummy keys** - Use `1x00000000000000000000AA` for development
✅ **Separate environments** - Different widgets for dev/staging/production

❌ **Never proxy api.js** - Must load from Cloudflare CDN
❌ **Never reuse tokens** - Each token is single-use
❌ **Never expose secret key** - Keep in backend only
❌ **Never skip expiration handling** - Tokens expire after 5 minutes

---

**Last Updated**: 2025-10-22
**API Version**: v0 (stable)
