# Structured Output Guide

**Last Updated**: 2025-10-25

Best practices for using JSON schemas with OpenAI's structured outputs feature.

---

## When to Use Structured Outputs

Use structured outputs when you need:
- ✅ **Guaranteed JSON format**: Response will always be valid JSON
- ✅ **Schema validation**: Enforce specific structure
- ✅ **Type safety**: Parse directly into TypeScript types
- ✅ **Data extraction**: Pull specific fields from text
- ✅ **Classification**: Map to predefined categories

---

## Schema Best Practices

### 1. Keep Schemas Simple

```typescript
// ✅ Good: Simple, focused schema
{
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name', 'age'],
  additionalProperties: false,
}

// ❌ Avoid: Overly complex nested structures
// (they work but are harder to debug)
```

### 2. Use Enums for Fixed Options

```typescript
{
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: ['bug', 'feature', 'question'],
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
    },
  },
  required: ['category', 'priority'],
}
```

### 3. Always Use `strict: true`

```typescript
response_format: {
  type: 'json_schema',
  json_schema: {
    name: 'response_schema',
    strict: true, // ✅ Enforces exact compliance
    schema: { /* ... */ },
  },
}
```

### 4. Set `additionalProperties: false`

```typescript
{
  type: 'object',
  properties: { /* ... */ },
  required: [ /* ... */ ],
  additionalProperties: false, // ✅ Prevents unexpected fields
}
```

---

## Common Use Cases

### Data Extraction

```typescript
const schema = {
  type: 'object',
  properties: {
    person: { type: 'string' },
    company: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
  },
  required: ['person'],
  additionalProperties: false,
};

// Extract from unstructured text
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'Extract contact information' },
    { role: 'user', content: 'John works at TechCorp, email: john@tech.com' },
  ],
  response_format: { type: 'json_schema', json_schema: { name: 'contact', strict: true, schema } },
});

const contact = JSON.parse(completion.choices[0].message.content);
// { person: "John", company: "TechCorp", email: "john@tech.com", phone: null }
```

### Classification

```typescript
const schema = {
  type: 'object',
  properties: {
    sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
    confidence: { type: 'number' },
    topics: { type: 'array', items: { type: 'string' } },
  },
  required: ['sentiment', 'confidence', 'topics'],
  additionalProperties: false,
};

// Classify text
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'Classify the text' },
    { role: 'user', content: 'This product is amazing!' },
  ],
  response_format: { type: 'json_schema', json_schema: { name: 'classification', strict: true, schema } },
});

const result = JSON.parse(completion.choices[0].message.content);
// { sentiment: "positive", confidence: 0.95, topics: ["product", "satisfaction"] }
```

---

## TypeScript Integration

### Type-Safe Parsing

```typescript
interface PersonProfile {
  name: string;
  age: number;
  skills: string[];
}

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    skills: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'age', 'skills'],
  additionalProperties: false,
};

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Generate a person profile' }],
  response_format: { type: 'json_schema', json_schema: { name: 'person', strict: true, schema } },
});

const person: PersonProfile = JSON.parse(completion.choices[0].message.content);
// TypeScript knows the shape!
```

---

## Error Handling

```typescript
try {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_schema', json_schema: { name: 'data', strict: true, schema } },
  });

  const data = JSON.parse(completion.choices[0].message.content);
  return data;
} catch (error) {
  if (error.message.includes('JSON')) {
    console.error('Failed to parse JSON (should not happen with strict mode)');
  }
  throw error;
}
```

---

## Validation

While `strict: true` ensures the response matches the schema, you may want additional validation:

```typescript
import { z } from 'zod';

const zodSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
});

const data = JSON.parse(completion.choices[0].message.content);
const validated = zodSchema.parse(data); // Throws if invalid
```

---

**See Also**: Official Structured Outputs Guide (https://platform.openai.com/docs/guides/structured-outputs)
