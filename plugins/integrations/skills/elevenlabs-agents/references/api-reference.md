# ElevenLabs Agents API Reference

## Base URL

```
https://api.elevenlabs.io/v1/convai
```

## Authentication

All requests require an API key in the header:

```bash
curl -H "xi-api-key: YOUR_API_KEY" https://api.elevenlabs.io/v1/convai/agents
```

---

## Agents

### Create Agent

**Endpoint**: `POST /agents/create`

**Request Body**:
```json
{
  "name": "Support Agent",
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "You are a helpful support agent.",
        "llm": "<verify current model id in dashboard>",
        "temperature": 0.7,
        "max_tokens": 500,
        "tool_ids": ["tool_123"],
        "knowledge_base": ["doc_456"]
      },
      "first_message": "Hello! How can I help?",
      "language": "en"
    },
    "tts": {
      "model_id": "eleven_turbo_v2_5",
      "voice_id": "voice_abc123",
      "stability": 0.5,
      "similarity_boost": 0.75,
      "speed": 1.0
    },
    "asr": {
      "quality": "high",
      "provider": "deepgram"
    },
    "turn": {
      "mode": "normal"
    }
  }
}
```

**Response**:
```json
{
  "agent_id": "agent_abc123",
  "name": "Support Agent",
  "created_at": "2025-11-03T12:00:00Z"
}
```

### Update Agent

**Endpoint**: `PATCH /agents/:agent_id`

**Request Body**: Same as Create Agent

### Get Agent

**Endpoint**: `GET /agents/:agent_id`

**Response**:
```json
{
  "agent_id": "agent_abc123",
  "name": "Support Agent",
  "conversation_config": { ... },
  "created_at": "2025-11-03T12:00:00Z",
  "updated_at": "2025-11-03T14:00:00Z"
}
```

### List Agents

**Endpoint**: `GET /agents`

**Response**:
```json
{
  "agents": [
    {
      "agent_id": "agent_abc123",
      "name": "Support Agent",
      "created_at": "2025-11-03T12:00:00Z"
    }
  ]
}
```

### Delete Agent

**Endpoint**: `DELETE /agents/:agent_id`

**Response**:
```json
{
  "success": true
}
```

---

## Conversations

### Create Conversation

**Endpoint**: `POST /conversations/create`

**Request Body**:
```json
{
  "agent_id": "agent_abc123",
  "dynamic_variables": {
    "user_name": "John",
    "account_tier": "premium"
  },
  "overrides": {
    "agent": {
      "prompt": {
        "prompt": "Custom prompt override"
      }
    }
  }
}
```

**Response**:
```json
{
  "conversation_id": "conv_xyz789",
  "signed_url": "wss://api.elevenlabs.io/v1/convai/...",
  "created_at": "2025-11-03T12:00:00Z"
}
```

### Get Conversation

**Endpoint**: `GET /conversations/:conversation_id`

**Response**:
```json
{
  "conversation_id": "conv_xyz789",
  "agent_id": "agent_abc123",
  "transcript": "...",
  "duration_seconds": 120,
  "status": "completed",
  "created_at": "2025-11-03T12:00:00Z",
  "ended_at": "2025-11-03T12:02:00Z"
}
```

---

## Knowledge Base

### Upload Document

**Endpoint**: `POST /knowledge-base/upload`

**Request Body** (multipart/form-data):
```
file: <binary>
name: "Support Documentation"
```

**Response**:
```json
{
  "document_id": "doc_456",
  "name": "Support Documentation",
  "status": "processing"
}
```

### Compute RAG Index

**Endpoint**: `POST /knowledge-base/:document_id/rag-index`

**Request Body**:
```json
{
  "embedding_model": "e5_mistral_7b"
}
```

**Response**:
```json
{
  "document_id": "doc_456",
  "status": "computing"
}
```

### Get RAG Index Status

**Endpoint**: `GET /knowledge-base/:document_id/rag-index`

**Response**:
```json
{
  "document_id": "doc_456",
  "status": "ready",
  "embedding_model": "e5_mistral_7b",
  "created_at": "2025-11-03T12:00:00Z"
}
```

---

## Tools

### Create Webhook Tool

**Endpoint**: `POST /tools/webhook`

**Request Body**:
```json
{
  "name": "get_weather",
  "description": "Fetch current weather for a city",
  "url": "https://api.weather.com/v1/current",
  "method": "GET",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "City name"
      }
    },
    "required": ["city"]
  },
  "headers": {
    "Authorization": "Bearer {{secret__weather_api_key}}"
  }
}
```

**Response**:
```json
{
  "tool_id": "tool_123",
  "name": "get_weather",
  "created_at": "2025-11-03T12:00:00Z"
}
```

---

## Testing

### Simulate Conversation

**Endpoint**: `POST /agents/:agent_id/simulate`

**Request Body**:
```json
{
  "scenario": "Customer requests refund",
  "user_messages": [
    "I want a refund for order #12345",
    "I ordered it last week"
  ],
  "success_criteria": [
    "Agent acknowledges request",
    "Agent provides timeline"
  ]
}
```

**Response**:
```json
{
  "simulation_id": "sim_123",
  "passed": true,
  "transcript": "...",
  "evaluation": {
    "criteria_met": 2,
    "criteria_total": 2,
    "details": [
      {
        "criterion": "Agent acknowledges request",
        "passed": true
      },
      {
        "criterion": "Agent provides timeline",
        "passed": true
      }
    ]
  }
}
```

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body format |
| 401 | Unauthorized | Verify API key is correct |
| 403 | Forbidden | Check agent visibility settings |
| 404 | Not Found | Verify resource ID exists |
| 429 | Rate Limited | Implement backoff strategy |
| 500 | Server Error | Retry with exponential backoff |

---

## Rate Limits

- **Standard Tier**: 100 requests/minute
- **Pro Tier**: 500 requests/minute
- **Enterprise Tier**: Custom limits

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730640000
```

---

## Pagination

**Query Parameters**:
```
?page=1&per_page=50
```

**Response Headers**:
```
X-Total-Count: 250
X-Page: 1
X-Per-Page: 50
```

---

## Webhook Events

### Post-Call Webhook

**Event Type**: `post_call_transcription`

**Payload**:
```json
{
  "type": "post_call_transcription",
  "data": {
    "conversation_id": "conv_xyz789",
    "agent_id": "agent_abc123",
    "transcript": "...",
    "duration_seconds": 120,
    "analysis": {
      "sentiment": "positive",
      "resolution": true,
      "extracted_data": {}
    }
  },
  "event_timestamp": "2025-11-03T12:02:00Z"
}
```

**Verification** (HMAC SHA-256):
```typescript
import crypto from 'crypto';

const signature = request.headers['elevenlabs-signature'];
const payload = JSON.stringify(request.body);

const hmac = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== hmac) {
  // Invalid signature
}
```

---

## SDK vs API

| Feature | SDK | API |
|---------|-----|-----|
| WebSocket Connection | ✅ | ❌ |
| Client Tools | ✅ | ❌ |
| Real-time Events | ✅ | ❌ |
| Agent Management | ❌ | ✅ |
| Tool Management | ❌ | ✅ |
| Knowledge Base | ❌ | ✅ |

**Recommendation**: Use SDK for conversations, API for agent management.
