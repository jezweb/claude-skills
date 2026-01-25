---
name: jquery-4
description: |
  Migrate jQuery 3.x to 4.0.0 safely in WordPress and legacy web projects. Covers all breaking changes: removed APIs ($.isArray, $.trim, $.parseJSON, $.type), focus event order changes, slim build differences, ES modules migration, and Trusted Types support.

  Use when: upgrading jQuery to 4.0, fixing "$.isArray is not a function" errors, WordPress jQuery migration, updating legacy JavaScript, or troubleshooting focus/blur event order issues.
---

# jQuery 4.0 Migration

**Status**: Production Ready
**Last Updated**: 2026-01-25
**Dependencies**: None
**Latest Versions**: jquery@4.0.0, jquery-migrate@4.0.2

---

## Quick Start (5 Minutes)

### 1. Add jQuery Migrate Plugin for Safe Testing

Before upgrading, add the migrate plugin to identify compatibility issues:

```html
<!-- Development: Shows console warnings for deprecated features -->
<script src="https://code.jquery.com/jquery-4.0.0.js"></script>
<script src="https://code.jquery.com/jquery-migrate-4.0.2.js"></script>
```

**Why this matters:**
- Logs specific warnings when deprecated/removed features execute
- Identifies code that needs updating before it breaks
- Provides backward compatibility shims during transition

### 2. Install via npm (if using build tools)

```bash
npm install jquery@4.0.0
# Or with migrate plugin for testing
npm install jquery@4.0.0 jquery-migrate@4.0.2
```

### 3. Check for Breaking Changes

Run your application and check console for migrate plugin warnings. Each warning indicates code that needs updating.

---

## Breaking Changes Reference

### Removed jQuery Utility Functions

These functions were deprecated and are now removed. Use native JavaScript equivalents:

| Removed | Native Replacement |
|---------|-------------------|
| `$.isArray(arr)` | `Array.isArray(arr)` |
| `$.parseJSON(str)` | `JSON.parse(str)` |
| `$.trim(str)` | `str.trim()` or `String.prototype.trim.call(str)` |
| `$.now()` | `Date.now()` |
| `$.type(obj)` | `typeof obj` + `Array.isArray()` + `instanceof` |
| `$.isNumeric(val)` | `!isNaN(parseFloat(val)) && isFinite(val)` |
| `$.isFunction(fn)` | `typeof fn === 'function'` |
| `$.isWindow(obj)` | `obj != null && obj === obj.window` |
| `$.camelCase(str)` | Custom function (see below) |
| `$.nodeName(el, name)` | `el.nodeName.toLowerCase() === name.toLowerCase()` |

**camelCase replacement:**

```javascript
// Native replacement for $.camelCase
function camelCase(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}
```

### Removed Prototype Methods

Three internal array methods removed from jQuery objects:

```javascript
// OLD - No longer works in jQuery 4.0
$elems.push(elem);
$elems.sort(compareFn);
$elems.splice(index, count);

// NEW - Use array methods with call/apply
[].push.call($elems, elem);
[].sort.call($elems, compareFn);
[].splice.call($elems, index, count);

// Or convert to array first
const arr = $.makeArray($elems);
arr.push(elem);
```

### Focus/Blur Event Order Changed

jQuery 4.0 follows the W3C specification for focus event order:

```javascript
// jQuery 3.x order (non-standard):
// focusout → blur → focusin → focus

// jQuery 4.0 order (W3C standard):
// blur → focusout → focus → focusin
```

**Impact**: If your code depends on specific event ordering, test thoroughly.

```javascript
// Example: code that may need adjustment
$input.on('blur focusout focus focusin', function(e) {
  console.log(e.type); // Order changed in 4.0
});
```

### Removed from Slim Build

The slim build (`jquery-4.0.0.slim.min.js`) no longer includes:
- Deferreds and Callbacks (use native Promises instead)
- AJAX functionality
- Animation effects

```javascript
// If using slim build, replace Deferreds with Promises
// OLD - Deferred
const deferred = $.Deferred();
deferred.resolve(value);
deferred.promise();

// NEW - Native Promise
const promise = new Promise((resolve, reject) => {
  resolve(value);
});
```

### toggleClass Changes

The `toggleClass(boolean)` and `toggleClass(undefined)` signatures are removed:

```javascript
// OLD - No longer works
$elem.toggleClass(true);   // Added all classes
$elem.toggleClass(false);  // Removed all classes

// NEW - Be explicit
$elem.addClass('class1 class2');    // Add classes
$elem.removeClass('class1 class2'); // Remove classes

// Or use toggleClass with class names
$elem.toggleClass('active', true);  // Force add
$elem.toggleClass('active', false); // Force remove
```

### AJAX Script Execution

Scripts fetched via AJAX no longer auto-execute unless dataType is specified:

```javascript
// OLD - Scripts auto-executed
$.get('script.js');

// NEW - Must specify dataType for auto-execution
$.get({
  url: 'script.js',
  dataType: 'script'
});

// Or use $.getScript (still works)
$.getScript('script.js');
```

### Removed CSS Properties

| Removed | Notes |
|---------|-------|
| `$.cssNumber` | Removed - define locally if needed |
| `$.cssProps` | No longer needed - vendor prefixes obsolete |
| `$.fx.interval` | Removed - requestAnimationFrame handles this |

---

## WordPress-Specific Migration

### 1. Check WordPress jQuery Version

```bash
# Check current jQuery version in WordPress
wp eval "echo wp_scripts()->registered['jquery-core']->ver;"
```

### 2. WordPress jQuery Migration Path

WordPress themes/plugins should:

```php
// Dequeue old jQuery and enqueue 4.0 (testing only)
function upgrade_jquery_for_testing() {
  if (!is_admin()) {
    wp_deregister_script('jquery-core');
    wp_deregister_script('jquery');

    wp_register_script('jquery-core',
      'https://code.jquery.com/jquery-4.0.0.min.js',
      array(), '4.0.0', true);

    wp_register_script('jquery', false, array('jquery-core'), '4.0.0', true);

    // Add migrate plugin for debugging
    wp_enqueue_script('jquery-migrate',
      'https://code.jquery.com/jquery-migrate-4.0.2.min.js',
      array('jquery'), '4.0.2', true);
  }
}
add_action('wp_enqueue_scripts', 'upgrade_jquery_for_testing', 1);
```

### 3. Common WordPress Plugin Issues

Many WordPress plugins use removed jQuery methods:

```javascript
// Common pattern in older plugins - BROKEN in 4.0
if ($.isArray(data)) { ... }
var json = $.parseJSON(response);
var cleaned = $.trim(userInput);

// Fix: Update to native methods
if (Array.isArray(data)) { ... }
var json = JSON.parse(response);
var cleaned = userInput.trim();
```

---

## Migration Patterns

### Pattern 1: Type Checking Migration

```javascript
// OLD jQuery type checking
if ($.type(value) === 'array') { ... }
if ($.type(value) === 'function') { ... }
if ($.type(value) === 'object') { ... }
if ($.type(value) === 'string') { ... }
if ($.type(value) === 'number') { ... }

// NEW Native type checking
if (Array.isArray(value)) { ... }
if (typeof value === 'function') { ... }
if (value !== null && typeof value === 'object' && !Array.isArray(value)) { ... }
if (typeof value === 'string') { ... }
if (typeof value === 'number') { ... }
```

### Pattern 2: Utility Function Polyfills

If you need quick compatibility without changing all code:

```javascript
// Polyfill removed methods (temporary migration aid)
if (typeof $.isArray === 'undefined') {
  $.isArray = Array.isArray;
}
if (typeof $.parseJSON === 'undefined') {
  $.parseJSON = JSON.parse;
}
if (typeof $.trim === 'undefined') {
  $.trim = function(str) {
    return str == null ? '' : String.prototype.trim.call(str);
  };
}
if (typeof $.now === 'undefined') {
  $.now = Date.now;
}
if (typeof $.isFunction === 'undefined') {
  $.isFunction = function(fn) {
    return typeof fn === 'function';
  };
}
if (typeof $.isNumeric === 'undefined') {
  $.isNumeric = function(val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
  };
}
```

**CRITICAL**: This is a temporary measure. Update your code to use native methods.

### Pattern 3: ES Modules Import

jQuery 4.0 supports ES modules:

```javascript
// ES Module import (new in 4.0)
import $ from 'jquery';

// Or with named export
import { $ } from 'jquery';

// In package.json, ensure module resolution
{
  "type": "module"
}
```

### Pattern 4: Trusted Types Compliance

For CSP with Trusted Types:

```javascript
// jQuery 4.0 accepts TrustedHTML in DOM manipulation
import DOMPurify from 'dompurify';

// Create trusted HTML
const clean = DOMPurify.sanitize(untrustedHTML, {RETURN_TRUSTED_TYPE: true});

// Safe to use with jQuery 4.0
$('#container').html(clean);
```

---

## Critical Rules

### Always Do

- Add jquery-migrate plugin BEFORE upgrading production
- Test focus/blur event handlers thoroughly
- Replace removed utility functions with native equivalents
- Specify `dataType: 'script'` for AJAX script loading
- Use ES module imports when possible for modern projects

### Never Do

- Upgrade production without testing with migrate plugin first
- Assume WordPress plugins are jQuery 4.0 compatible
- Use slim build if you need AJAX or Deferreds
- Rely on `$.type()` - use native type checking
- Use `toggleClass(boolean)` signature

---

## Known Issues Prevention

This skill prevents **8** documented issues:

### Issue #1: $.isArray is not a function
**Error**: `TypeError: $.isArray is not a function`
**Source**: https://github.com/jquery/jquery/issues/5411
**Why It Happens**: Method removed in jQuery 4.0
**Prevention**: Use `Array.isArray()` instead

### Issue #2: $.parseJSON is not a function
**Error**: `TypeError: $.parseJSON is not a function`
**Source**: https://jquery.com/upgrade-guide/4.0/
**Why It Happens**: Deprecated since 3.0, removed in 4.0
**Prevention**: Use `JSON.parse()` instead

### Issue #3: $.trim is not a function
**Error**: `TypeError: $.trim is not a function`
**Source**: https://jquery.com/upgrade-guide/4.0/
**Why It Happens**: Native String.prototype.trim available everywhere
**Prevention**: Use `str.trim()` or `String.prototype.trim.call(str)`

### Issue #4: Focus events fire in wrong order
**Error**: Unexpected behavior in form validation
**Source**: https://blog.jquery.com/2026/01/17/jquery-4-0-0/
**Why It Happens**: jQuery 4.0 follows W3C spec, not legacy order
**Prevention**: Test and update event handlers that depend on order

### Issue #5: Deferreds undefined in slim build
**Error**: `TypeError: $.Deferred is not a function`
**Source**: https://blog.jquery.com/2026/01/17/jquery-4-0-0/
**Why It Happens**: Removed from slim build in 4.0
**Prevention**: Use full build or native Promises

### Issue #6: Scripts not executing from AJAX
**Error**: Script loaded but not executed
**Source**: https://jquery.com/upgrade-guide/4.0/
**Why It Happens**: Auto-execution disabled without explicit dataType
**Prevention**: Add `dataType: 'script'` to AJAX options

### Issue #7: toggleClass not working
**Error**: `toggleClass(true)` has no effect
**Source**: https://jquery.com/upgrade-guide/4.0/
**Why It Happens**: Boolean signature removed
**Prevention**: Use addClass/removeClass or toggleClass with class names

### Issue #8: WordPress plugin conflicts
**Error**: Various "is not a function" errors
**Source**: Common in WordPress ecosystem
**Why It Happens**: Plugins using removed jQuery methods
**Prevention**: Audit plugins with jquery-migrate before upgrading

---

## Browser Support

### Supported in jQuery 4.0

- Chrome (last 3 versions)
- Firefox (last 2 versions + ESR)
- Safari (last 3 versions)
- Edge (Chromium-based)
- iOS Safari (last 3 versions)
- Android Chrome (last 3 versions)

### Dropped Support

- IE 10 and older (IE 11 supported until jQuery 5.0)
- Edge Legacy (EdgeHTML)
- Very old mobile browsers

---

## Slim vs Full Build Comparison

| Feature | Full Build | Slim Build |
|---------|-----------|------------|
| Size (gzipped) | ~27.5k | ~19.5k |
| DOM Manipulation | Yes | Yes |
| Events | Yes | Yes |
| AJAX | Yes | No |
| Effects/Animation | Yes | No |
| Deferreds | Yes | No |
| Callbacks | Yes | No |

**Use slim build when**: Static sites, no AJAX needs, using native fetch/Promises

**Use full build when**: WordPress, AJAX-heavy apps, need $.animate or Deferreds

---

## Migration Checklist

- [ ] Add jquery-migrate@4.0.2 to development
- [ ] Run full site test, check console for warnings
- [ ] Replace $.isArray() with Array.isArray()
- [ ] Replace $.parseJSON() with JSON.parse()
- [ ] Replace $.trim() with str.trim()
- [ ] Replace $.now() with Date.now()
- [ ] Replace $.type() with native type checking
- [ ] Replace $.isFunction() with typeof check
- [ ] Replace $.isNumeric() with isNaN/isFinite check
- [ ] Update toggleClass(boolean) usage
- [ ] Add dataType to script AJAX calls
- [ ] Test focus/blur event order
- [ ] Audit WordPress plugins if applicable
- [ ] Remove jquery-migrate after fixing all issues
- [ ] Upgrade to jquery@4.0.0 in production

---

## Official Documentation

- **jQuery 4.0.0 Release**: https://blog.jquery.com/2026/01/17/jquery-4-0-0/
- **Upgrade Guide**: https://jquery.com/upgrade-guide/4.0/
- **jQuery Migrate Plugin**: https://github.com/jquery/jquery-migrate
- **API Documentation**: https://api.jquery.com/
- **npm Package**: https://www.npmjs.com/package/jquery

---

## Package Versions (Verified 2026-01-25)

```json
{
  "dependencies": {
    "jquery": "^4.0.0"
  },
  "devDependencies": {
    "jquery-migrate": "^4.0.2"
  }
}
```

---

## Troubleshooting

### Problem: WordPress admin breaks after jQuery upgrade
**Solution**: Only upgrade frontend jQuery. Admin uses its own version. Use conditional logic to avoid affecting wp-admin.

### Problem: Third-party plugins stop working
**Solution**: Keep jquery-migrate loaded until plugins are updated. Check plugin changelogs for jQuery 4.0 compatibility updates.

### Problem: AJAX requests work but scripts don't execute
**Solution**: Add `dataType: 'script'` to $.ajax options or use $.getScript() for script loading.

### Problem: Form validation fires at wrong times
**Solution**: Review focus/blur/focusin/focusout handlers. jQuery 4.0 fires: blur → focusout → focus → focusin (W3C order).

---

**Questions? Issues?**

1. Check console for jquery-migrate warnings
2. Review upgrade guide: https://jquery.com/upgrade-guide/4.0/
3. Check jQuery GitHub issues: https://github.com/jquery/jquery/issues
