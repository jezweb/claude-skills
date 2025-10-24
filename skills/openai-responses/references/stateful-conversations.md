# Stateful Conversations Guide

**Last Updated**: 2025-10-25

Guide to managing conversation state with the Responses API.

---

## Automatic State Management

```typescript
// Create conversation
const conv = await openai.conversations.create({
  metadata: { user_id: 'user_123' },
});

// Turn 1
const response1 = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id,
  input: 'What are the 5 Ds of dodgeball?',
});

// Turn 2 - automatically remembers turn 1
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation: conv.id,
  input: 'Tell me more about the first one',
});
```

---

## Conversation Management

**Create:**
```typescript
const conv = await openai.conversations.create({
  metadata: { topic: 'support' },
  items: [
    { type: 'message', role: 'developer', content: 'You are helpful.' }
  ],
});
```

**List:**
```typescript
const convs = await openai.conversations.list({ limit: 10 });
```

**Delete:**
```typescript
await openai.conversations.delete(conv.id);
```

---

## Benefits vs Manual History

| Feature | Manual History | Conversation IDs |
|---------|---------------|------------------|
| **Complexity** | High (you track) | Low (automatic) |
| **Cache** | Baseline | 40-80% better |
| **Reasoning** | Discarded | Preserved |
| **Errors** | Common | Rare |

---

## Best Practices

1. **Store conversation IDs**: Database, session storage, cookies
2. **Add metadata**: Track user, topic, session type
3. **Expire old conversations**: Delete after 90 days or when done
4. **One conversation per topic**: Don't mix unrelated topics

---

**Official Docs**: https://platform.openai.com/docs/api-reference/conversations
