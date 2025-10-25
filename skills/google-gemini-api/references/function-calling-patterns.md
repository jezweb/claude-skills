# Function Calling Patterns

Complete guide to implementing function calling (tool use) with Gemini API.

---

## Basic Pattern

1. Define function declarations
2. Send request with tools
3. Check if model wants to call functions
4. Execute functions
5. Send results back to model
6. Get final response

---

## Function Declaration Schema

```typescript
{
  name: string,                    // Function name (no spaces)
  description: string,             // What the function does
  parametersJsonSchema: {          // Subset of OpenAPI schema
    type: 'object',
    properties: {
      [paramName]: {
        type: string,              // 'string' | 'number' | 'boolean' | 'array' | 'object'
        description: string,       // Parameter description
        enum?: string[]            // Optional: allowed values
      }
    },
    required: string[]            // Required parameter names
  }
}
```

---

## Calling Modes

- **AUTO** (default): Model decides when to call
- **ANY**: Force at least one function call
- **NONE**: Disable function calling

---

## Parallel vs Compositional

**Parallel**: Independent functions run simultaneously
**Compositional**: Sequential dependencies (A → B → C)

Gemini automatically detects which pattern to use.

---

## Official Docs

https://ai.google.dev/gemini-api/docs/function-calling
