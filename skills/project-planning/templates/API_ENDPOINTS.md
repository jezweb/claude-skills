# API Endpoints: [Project Name]

**Base URL**: `/api`
**Framework**: Hono (Cloudflare Workers)
**Auth**: Clerk JWT with custom template
**Validation**: Zod schemas
**Last Updated**: [Date]

---

## Overview

All API endpoints follow RESTful conventions and return JSON responses.

**Base URL**:
- Local dev: `http://localhost:5173/api`
- Production: `https://[your-domain].workers.dev/api`

**Authentication**: Most endpoints require a valid Clerk JWT in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

**Content Type**: All requests and responses use `application/json`

---

## Response Format

### Success Response
```json
{
  "data": { /* response data */ },
  "meta": { /* optional metadata like pagination */ }
}
```

### Error Response
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* optional additional context */ }
}
```

**Standard Error Codes**:
- `VALIDATION_ERROR` (400): Request body failed validation
- `UNAUTHORIZED` (401): Missing or invalid JWT
- `FORBIDDEN` (403): Valid JWT but insufficient permissions
- `NOT_FOUND` (404): Resource doesn't exist
- `INTERNAL_ERROR` (500): Server error

---

## Authentication Endpoints

### POST `/api/auth/verify`
**Purpose**: Verify JWT token validity
**Auth**: None (public endpoint)

**Request Body**:
```json
{
  "token": "string"
}
```

**Response 200**:
```json
{
  "data": {
    "valid": true,
    "email": "user@example.com",
    "userId": "clerk_user_123"
  }
}
```

**Response 401**:
```json
{
  "error": "Invalid or expired token",
  "code": "UNAUTHORIZED"
}
```

**Validation**:
```typescript
const schema = z.object({
  token: z.string().min(1)
})
```

---

### GET `/api/auth/me`
**Purpose**: Get current authenticated user's profile
**Auth**: Required

**Response 200**:
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "John Doe",
    "avatarUrl": "https://r2.../avatar.jpg",
    "createdAt": 1234567890
  }
}
```

**Response 401**:
```json
{
  "error": "Not authenticated",
  "code": "UNAUTHORIZED"
}
```

---

## [Resource] Endpoints

### GET `/api/[resource]`
**Purpose**: List all [resources] for authenticated user
**Auth**: Required

**Query Parameters**:
- `limit` (optional): Number of items to return (default: 50, max: 100)
- `offset` (optional): Number of items to skip (default: 0)
- `sort` (optional): Sort field (default: `created_at`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

**Example**: `/api/[resource]?limit=20&offset=0&sort=created_at&order=desc`

**Response 200**:
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "[field]": "value",
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ],
  "meta": {
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

**Response 401**: Not authenticated

---

### GET `/api/[resource]/:id`
**Purpose**: Get a specific [resource] by ID
**Auth**: Required

**Response 200**:
```json
{
  "data": {
    "id": 1,
    "userId": 1,
    "[field]": "value",
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

**Response 404**:
```json
{
  "error": "[Resource] not found",
  "code": "NOT_FOUND"
}
```

**Response 403**: User doesn't own this resource

---

### POST `/api/[resource]`
**Purpose**: Create a new [resource]
**Auth**: Required

**Request Body**:
```json
{
  "[field1]": "value",
  "[field2]": "value"
}
```

**Validation**:
```typescript
const schema = z.object({
  [field1]: z.string().min(1).max(100),
  [field2]: z.string().optional(),
  // ... other fields
})
```

**Response 201**:
```json
{
  "data": {
    "id": 42,
    "userId": 1,
    "[field1]": "value",
    "[field2]": "value",
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

**Response 400** (validation error):
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field1": "Must be at least 1 character"
  }
}
```

---

### PATCH `/api/[resource]/:id`
**Purpose**: Update an existing [resource]
**Auth**: Required

**Request Body** (all fields optional):
```json
{
  "[field1]": "new value",
  "[field2]": "new value"
}
```

**Validation**:
```typescript
const schema = z.object({
  [field1]: z.string().min(1).max(100).optional(),
  [field2]: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
})
```

**Response 200**:
```json
{
  "data": {
    "id": 42,
    "userId": 1,
    "[field1]": "new value",
    "[field2]": "new value",
    "createdAt": 1234567890,
    "updatedAt": 1234567999
  }
}
```

**Response 404**: Resource not found
**Response 403**: User doesn't own this resource

---

### DELETE `/api/[resource]/:id`
**Purpose**: Delete a [resource]
**Auth**: Required

**Response 204**: No content (success)

**Response 404**: Resource not found
**Response 403**: User doesn't own this resource

---

## Middleware

### CORS Middleware
**Applies to**: All routes
**Headers**:
```
Access-Control-Allow-Origin: https://[your-domain].com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### Auth Middleware
**Applies to**: All routes except public endpoints
**Validates**: Clerk JWT in Authorization header
**Adds to context**: `c.get('userId')`, `c.get('email')`
**Rejects**: Missing, invalid, or expired tokens (401)

### Error Handler Middleware
**Applies to**: All routes
**Catches**: Unhandled errors
**Returns**: 500 with sanitized error message
**Logs**: Full error details for debugging

### Validation Middleware
**Applies to**: POST and PATCH routes
**Validates**: Request body against Zod schema
**Returns**: 400 with field-specific errors if validation fails

---

## Rate Limiting

[Optional: Define rate limits if applicable]

**Default Limits**:
- Anonymous requests: 10 requests per minute
- Authenticated requests: 100 requests per minute

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Webhook Endpoints

[Optional: Document webhooks if applicable]

### POST `/api/webhooks/[service]`
**Purpose**: Handle webhook from [third-party service]
**Auth**: Webhook signature verification
**Source**: [Service name]

**Expected Payload**:
```json
{
  "event": "event_type",
  "data": { /* event data */ }
}
```

**Response 200**: Webhook processed successfully
**Response 400**: Invalid signature or payload

---

## Testing

### Manual Testing with curl

**Create resource**:
```bash
curl -X POST http://localhost:5173/api/[resource] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"field1": "value"}'
```

**Get resource**:
```bash
curl http://localhost:5173/api/[resource]/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update resource**:
```bash
curl -X PATCH http://localhost:5173/api/[resource]/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"field1": "new value"}'
```

**Delete resource**:
```bash
curl -X DELETE http://localhost:5173/api/[resource]/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Getting a Test JWT

Use Clerk's development mode or sign in to get a token:
```javascript
// In browser console after logging in
const token = await window.Clerk.session.getToken();
console.log(token);
```

---

## Deployment

**Wrangler Configuration**: Ensure `wrangler.jsonc` includes necessary bindings:
```jsonc
{
  "vars": {
    "CLERK_PUBLISHABLE_KEY": "pk_test_..."
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "[your-database]",
      "database_id": "[database-id]"
    }
  ]
}
```

**Environment Variables** (set via dashboard or CLI):
- `CLERK_SECRET_KEY`: Secret key for JWT verification

---

## Future Endpoints

Planned endpoints to implement:
- [ ] `/api/[feature]` - [Description]
- [ ] `/api/[other-feature]` - [Description]

---

## Revision History

**v1.0** ([Date]): Initial API design
**v1.1** ([Date]): [Changes made]
