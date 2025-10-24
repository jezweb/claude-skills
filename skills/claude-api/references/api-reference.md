# Claude API Reference

Quick reference for the Anthropic Messages API endpoints and parameters.

## Base URL

```
https://api.anthropic.com/v1
```

## Authentication

All requests require:
```http
x-api-key: YOUR_API_KEY
anthropic-version: 2023-06-01
content-type: application/json
```

## Endpoints

### POST /messages

Create a message with Claude.

**Request Body:**

```typescript
{
  model: string,              // Required: "claude-sonnet-4-5-20250929", etc.
  max_tokens: number,         // Required: Maximum tokens to generate (1-8192)
  messages: Message[],        // Required: Conversation history
  system?: string | SystemBlock[],  // Optional: System prompt
  temperature?: number,       // Optional: 0-1 (default: 1)
  top_p?: number,             // Optional: 0-1 (default: 1)
  top_k?: number,             // Optional: Sampling parameter
  stop_sequences?: string[],  // Optional: Stop generation at these sequences
  stream?: boolean,           // Optional: Enable streaming (default: false)
  tools?: Tool[],             // Optional: Available tools
  tool_choice?: ToolChoice,   // Optional: Tool selection strategy
  metadata?: Metadata         // Optional: Request metadata
}
```

**Message Format:**

```typescript
{
  role: "user" | "assistant",
  content: string | ContentBlock[]
}
```

**Content Block Types:**

```typescript
// Text
{
  type: "text",
  text: string,
  cache_control?: { type: "ephemeral" }  // For prompt caching
}

// Image
{
  type: "image",
  source: {
    type: "base64" | "url",
    media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
    data?: string,  // base64 encoded
    url?: string    // publicly accessible URL
  },
  cache_control?: { type: "ephemeral" }
}

// Tool use (assistant messages only)
{
  type: "tool_use",
  id: string,
  name: string,
  input: object
}

// Tool result (user messages only)
{
  type: "tool_result",
  tool_use_id: string,
  content: string | ContentBlock[],
  is_error?: boolean
}
```

**Response:**

```typescript
{
  id: string,
  type: "message",
  role: "assistant",
  content: ContentBlock[],
  model: string,
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use",
  stop_sequence?: string,
  usage: {
    input_tokens: number,
    output_tokens: number,
    cache_creation_input_tokens?: number,
    cache_read_input_tokens?: number
  }
}
```

## Model IDs

| Model | ID | Context Window |
|-------|-----|----------------|
| Claude Sonnet 4.5 | claude-sonnet-4-5-20250929 | 200k tokens |
| Claude 3.7 Sonnet | claude-3-7-sonnet-20250228 | 2M tokens |
| Claude Opus 4 | claude-opus-4-20250514 | 200k tokens |
| Claude 3.5 Haiku | claude-3-5-haiku-20241022 | 200k tokens |

## Tool Definition

```typescript
{
  name: string,           // Tool identifier
  description: string,    // What the tool does
  input_schema: {         // JSON Schema
    type: "object",
    properties: {
      [key: string]: {
        type: "string" | "number" | "boolean" | "array" | "object",
        description?: string,
        enum?: any[]
      }
    },
    required?: string[]
  }
}
```

## Streaming

Set `stream: true` in request. Returns Server-Sent Events (SSE):

**Event Types:**
- `message_start`: Message begins
- `content_block_start`: Content block begins
- `content_block_delta`: Text or JSON delta
- `content_block_stop`: Content block complete
- `message_delta`: Metadata update
- `message_stop`: Message complete
- `ping`: Keep-alive

**Event Format:**

```
event: message_start
data: {"type":"message_start","message":{...}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}

event: message_stop
data: {"type":"message_stop"}
```

## Error Responses

```typescript
{
  type: "error",
  error: {
    type: string,  // Error type identifier
    message: string  // Human-readable description
  }
}
```

**Common Error Types:**
- `invalid_request_error` (400)
- `authentication_error` (401)
- `permission_error` (403)
- `not_found_error` (404)
- `rate_limit_error` (429)
- `api_error` (500)
- `overloaded_error` (529)

## Rate Limit Headers

Response includes:

```
anthropic-ratelimit-requests-limit: 50
anthropic-ratelimit-requests-remaining: 49
anthropic-ratelimit-requests-reset: 2025-10-25T12:00:00Z
anthropic-ratelimit-tokens-limit: 50000
anthropic-ratelimit-tokens-remaining: 49500
anthropic-ratelimit-tokens-reset: 2025-10-25T12:01:00Z
retry-after: 60  // Only on 429 errors
```

## SDK Installation

```bash
# TypeScript/JavaScript
npm install @anthropic-ai/sdk

# Python
pip install anthropic

# Java
# See https://github.com/anthropics/anthropic-sdk-java

# Go
go get github.com/anthropics/anthropic-sdk-go
```

## Official Documentation

- **API Reference**: https://docs.claude.com/en/api/messages
- **SDK Documentation**: https://github.com/anthropics/anthropic-sdk-typescript
- **Rate Limits**: https://docs.claude.com/en/api/rate-limits
- **Errors**: https://docs.claude.com/en/api/errors
