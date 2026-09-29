# API Endpoints Documentation Template

Use this format when generating API_ENDPOINTS.md for a project.

## Template

```markdown
# API Endpoints

Base URL: `https://[project].workers.dev` (production) | `http://localhost:5173` (dev)

## Authentication

[Describe auth method: Bearer token, session cookie, API key, none]

## Endpoints

### [Resource Name]

#### GET /api/[resource]

List all [resources].

- **Auth**: [Required/None]
- **Query params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `search` (string, optional)
- **Response 200**:
  ```json
  {
    "[resources]": [...],
    "total": 42,
    "page": 1,
    "limit": 20
  }
  ```

#### GET /api/[resource]/:id

Get a single [resource] by ID.

- **Auth**: [Required/None]
- **Response 200**: `{ "[resource]": { ... } }`
- **Response 404**: `{ "error": "Not found" }`

#### POST /api/[resource]

Create a new [resource].

- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "string (required)",
    "email": "string (required, email format)"
  }
  ```
- **Response 201**: `{ "[resource]": { ... } }`
- **Response 400**: `{ "error": "Validation failed", "details": { ... } }`

#### PUT /api/[resource]/:id

Update an existing [resource].

- **Auth**: Required
- **Body**: Same as POST (all fields optional)
- **Response 200**: `{ "[resource]": { ... } }`
- **Response 404**: `{ "error": "Not found" }`

#### DELETE /api/[resource]/:id

Delete a [resource].

- **Auth**: Required
- **Response 204**: (no body)
- **Response 404**: `{ "error": "Not found" }`

## Error Format

All errors return JSON:

```json
{
  "error": "Human-readable error message",
  "details": {}  // optional, present for validation errors
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Not authorised |
| 404 | Resource not found |
| 500 | Internal server error |
```

## Guidelines

- Document every endpoint, including auth requirements
- Show example request bodies with field types and constraints
- Show example response shapes (JSON)
- Include all possible error responses
- List query parameters with defaults and limits
- Keep descriptions to one line per endpoint
