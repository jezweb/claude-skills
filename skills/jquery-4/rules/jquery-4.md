# jQuery 4.0 Correction Rules

These patterns correct jQuery 3.x code to jQuery 4.0.0 compatible code.

## Removed Utility Functions

### $.isArray() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
if ($.isArray(data)) { ... }

// CORRECT - Use native Array.isArray
if (Array.isArray(data)) { ... }
```

### $.parseJSON() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
var obj = $.parseJSON(jsonString);

// CORRECT - Use native JSON.parse
var obj = JSON.parse(jsonString);
```

### $.trim() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
var clean = $.trim(userInput);

// CORRECT - Use native trim
var clean = userInput.trim();
// Or for null-safe:
var clean = (userInput || '').trim();
```

### $.now() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
var timestamp = $.now();

// CORRECT - Use native Date.now
var timestamp = Date.now();
```

### $.type() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
if ($.type(val) === 'array') { ... }
if ($.type(val) === 'function') { ... }
if ($.type(val) === 'object') { ... }

// CORRECT - Use native type checking
if (Array.isArray(val)) { ... }
if (typeof val === 'function') { ... }
if (val !== null && typeof val === 'object' && !Array.isArray(val)) { ... }
```

### $.isFunction() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
if ($.isFunction(callback)) { ... }

// CORRECT - Use typeof
if (typeof callback === 'function') { ... }
```

### $.isNumeric() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
if ($.isNumeric(value)) { ... }

// CORRECT - Use native checks
if (!isNaN(parseFloat(value)) && isFinite(value)) { ... }
```

### $.isWindow() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
if ($.isWindow(obj)) { ... }

// CORRECT - Direct comparison
if (obj != null && obj === obj.window) { ... }
```

### $.nodeName() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
if ($.nodeName(elem, 'input')) { ... }

// CORRECT - Use nodeName property
if (elem.nodeName.toLowerCase() === 'input') { ... }
```

### $.camelCase() - REMOVED
```javascript
// WRONG - Removed in jQuery 4.0
var camelized = $.camelCase('border-width');

// CORRECT - Use replace with regex
var camelized = 'border-width'.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
```

## Removed Prototype Methods

### push/sort/splice on jQuery objects
```javascript
// WRONG - Removed in jQuery 4.0
$elems.push(newElem);
$elems.sort(compareFn);
$elems.splice(0, 1);

// CORRECT - Use Array methods with call
[].push.call($elems, newElem);
[].sort.call($elems, compareFn);
[].splice.call($elems, 0, 1);
```

## toggleClass Changes

### toggleClass(boolean) - REMOVED
```javascript
// WRONG - Signature removed in jQuery 4.0
$elem.toggleClass(true);   // Previously added all classes
$elem.toggleClass(false);  // Previously removed all classes

// CORRECT - Be explicit with class names
$elem.addClass('class1 class2');
$elem.removeClass('class1 class2');

// Or use second parameter with class name
$elem.toggleClass('active', true);   // Force add
$elem.toggleClass('active', false);  // Force remove
```

## AJAX Script Execution

### Auto-execution disabled
```javascript
// WRONG - Scripts won't auto-execute in jQuery 4.0
$.get('script.js');
$.ajax({ url: 'script.js' });

// CORRECT - Specify dataType for script execution
$.get({ url: 'script.js', dataType: 'script' });
$.ajax({ url: 'script.js', dataType: 'script' });

// Or use getScript
$.getScript('script.js');
```

## Slim Build Considerations

### Deferreds not available in slim build
```javascript
// WRONG - Not in slim build
var deferred = $.Deferred();

// CORRECT - Use native Promises with slim build
var promise = new Promise((resolve, reject) => {
  // async operation
  resolve(result);
});

// Or use full jQuery build if Deferreds needed
```

## Focus Event Order

jQuery 4.0 follows W3C order: blur → focusout → focus → focusin

```javascript
// If your code depends on specific event order, be aware:
// jQuery 3.x: focusout → blur → focusin → focus
// jQuery 4.0: blur → focusout → focus → focusin

// Test form validation and focus handlers after upgrade
```
