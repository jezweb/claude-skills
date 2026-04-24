---
name: mcp-builder
description: >
  Build MCP servers in Python with FastMCP. Workflow: define tools and resources,
  build server, test locally, deploy to FastMCP Cloud or Docker.
  Use when creating MCP servers, exposing tools/resources/prompts to LLMs,
  building Claude integrations, or troubleshooting FastMCP module-level server,
  storage, lifespan, middleware, OAuth, or deployment errors.
compatibility: Designed for Claude Code (or similar products)
---

# MCP Builder

Build a working MCP server from a description of the tools you need. Produces a deployable Python server using FastMCP.

## Workflow

### Step 1: Define What to Expose

Ask what the server needs to provide:

- **Tools** -- Functions Claude can call (API wrappers, calculations, file operations)
- **Resources** -- Data Claude can read (database records, config, documents)
- **Prompts** -- Reusable prompt templates with parameters

A brief like "MCP server for querying our customer database" is enough.

### Step 2: Scaffold the Server

```bash
pip install fastmcp
```

Create the server file. The server instance MUST be at module level:

```python
from fastmcp import FastMCP

# MUST be at module level for FastMCP Cloud
mcp = FastMCP("My Server")

@mcp.tool()
async def search_customers(query: str) -> str:
    """Search customers by name or email."""
    # Implementation here
    return f"Found customers matching: {query}"

@mcp.resource("customers://{customer_id}")
async def get_customer(customer_id: str) -> str:
    """Get customer details by ID."""
    return f"Customer {customer_id} details"

if __name__ == "__main__":
    mcp.run()
```

### Step 3: Add Companion CLI Scripts (Optional)

For Claude Code terminal use, add scripts alongside the MCP server:

```
my-mcp-server/
├── src/index.ts          # MCP server (for Claude.ai)
├── scripts/
│   ├── search.ts         # CLI version of search tool
│   └── _shared.ts        # Shared auth/config
├── SCRIPTS.md            # Documents available scripts
└── package.json
```

CLI scripts provide file I/O, batch processing, and richer output that MCP can't.
See `assets/SCRIPTS-TEMPLATE.md` and `assets/script-template.ts` for TypeScript templates.

### Step 4: Test Locally

**Quick test -- run directly:**

```bash
python server.py
```

**Dev mode with inspector UI (recommended):**

```bash
fastmcp dev server.py
# Opens inspector at http://localhost:5173
# Hot reload, detailed logging, tool/resource inspection
```

**HTTP mode for remote clients:**

```bash
python server.py --transport http --port 8000
```

**Automated test script using FastMCP Client:**

```python
import asyncio
from fastmcp import Client

async def test_server(server_path):
    async with Client(server_path) as client:
        # List everything
        tools = await client.list_tools()
        resources = await client.list_resources()
        prompts = await client.list_prompts()

        print(f"Tools: {[t.name for t in tools]}")
        print(f"Resources: {[r.uri for r in resources]}")
        print(f"Prompts: {[p.name for p in prompts]}")

        # Call first tool
        if tools:
            result = await client.call_tool(tools[0].name, {})
            print(f"Tool result: {result}")

        # Read first resource
        if resources:
            data = await client.read_resource(resources[0].uri)
            print(f"Resource data: {data}")

asyncio.run(test_server("server.py"))
```

### Step 5: Pre-Deploy Checklist

Run these checks before deploying. All required checks must pass.

**Required (will cause deploy failure):**

1. Server file exists
2. Python syntax valid: `python3 -m py_compile server.py`
3. Module-level server object (not inside a function):
   ```bash
   grep -q "^mcp = FastMCP\|^server = FastMCP\|^app = FastMCP" server.py
   ```
4. `requirements.txt` exists with PyPI packages only (no `git+`, `-e`, `.whl`, `.tar.gz`)
5. No hardcoded secrets (check for `api_key = "..."` patterns excluding `os.getenv`/`os.environ`)

**Advisory (warnings):**

6. `fastmcp` listed in requirements.txt
7. `.gitignore` includes `.env`
8. No circular imports
9. Git repository initialised with remote
10. Server can load: `timeout 5 fastmcp inspect server.py`

### Step 6: Deploy

**FastMCP Cloud (simplest):**

```bash
git add . && git commit -m "Ready for deployment"
git push -u origin main
# Visit https://fastmcp.cloud, connect repo, add env vars, deploy
# URL: https://your-project.fastmcp.app/mcp
```

Cloud requirements:
- Module-level server object named `mcp`, `server`, or `app`
- PyPI dependencies only in `requirements.txt`
- Public GitHub repository
- Environment variables for secrets (no hardcoded values)
- Auto-deploys on push to main, PR preview deployments

**Docker (self-hosted):**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "server.py", "--transport", "http", "--port", "8000"]
```

**Cloudflare Workers (edge):**
See the cloudflare-worker-builder skill for Workers-based MCP servers.

---

## Critical Patterns

### Module-Level Server Instance

FastMCP Cloud requires the server instance at module level:

```python
# CORRECT
mcp = FastMCP("My Server")

@mcp.tool()
def my_tool(): ...

# WRONG -- Cloud can't find the server
def create_server():
    mcp = FastMCP("My Server")
    return mcp

# FIX for factory pattern -- export at module level
def create_server() -> FastMCP:
    mcp = FastMCP("server")
    return mcp
mcp = create_server()
```

### Type Annotations Required

FastMCP uses type annotations to generate tool schemas:

```python
@mcp.tool()
async def search(
    query: str,           # Required parameter
    limit: int = 10,      # Optional with default
    tags: list[str] = []  # Complex types supported
) -> str:
    """Docstring becomes the tool description."""
    ...
```

### Error Handling

Return errors as strings, don't raise exceptions:

```python
@mcp.tool()
async def get_data(id: str) -> str:
    try:
        result = await fetch_data(id)
        return json.dumps(result)
    except NotFoundError:
        return f"Error: No data found for ID {id}"
```

### Cloud-Ready Server Pattern

```python
import os
from fastmcp import FastMCP

mcp = FastMCP("production-server")
API_KEY = os.getenv("API_KEY")

@mcp.tool()
async def production_tool(data: str) -> dict:
    if not API_KEY:
        return {"error": "API_KEY not configured"}
    return {"status": "success", "data": data}

if __name__ == "__main__":
    mcp.run()
```

---

## Common Errors and Fixes

These are the errors you will hit. Fix them before deploying.

| Error | Cause | Fix |
|-------|-------|-----|
| `RuntimeError: No server object found at module level` | Server inside a function | Export `mcp = FastMCP(...)` at module level |
| `RuntimeError: no running event loop` | Missing async/await | Use `async def` for async operations |
| `TypeError: missing required argument 'context'` | Context not type-hinted | Add `context: Context` with type hint |
| `ValueError: Invalid resource URI` | Missing URI scheme | Use `data://`, `file://`, `info://`, `api://` |
| Resource template parameter mismatch | Name mismatch | `user://{user_id}` needs `def get_user(user_id: str)` |
| Pydantic validation error | Wrong type hints | Ensure hints match actual data types |
| Transport mismatch | Client/server protocol differ | Match both to stdio or both to http |
| Import errors with editable package | Package not installed | `pip install -e .` or add to PYTHONPATH |
| `DeprecationWarning: mcp.settings` | Old API | Use `os.getenv()` instead |
| Port already in use | Stale process | `lsof -ti:8000 \| xargs kill -9` |
| Schema generation failure | Non-JSON types | Use JSON-compatible types (no NumPy arrays) |
| JSON serialization error | datetime/bytes in response | Convert to `.isoformat()` or string |
| Circular import | Factory in `__init__.py` | Use direct imports, avoid factory pattern |
| Python 3.12+ datetime warning | `datetime.utcnow()` deprecated | Use `datetime.now(timezone.utc)` |
| Import-time execution | Async resource at module level | Use lazy init pattern |

---

## Production Patterns

### Self-Contained Server

Keep all utilities in one file to avoid circular imports:

```python
from fastmcp import FastMCP
import os

mcp = FastMCP("my-server")

# Config
class Config:
    API_KEY = os.getenv("API_KEY", "")
    BASE_URL = os.getenv("BASE_URL", "https://api.example.com")

# Helpers
def format_success(data): return {"status": "success", "data": data}
def format_error(msg): return {"status": "error", "message": msg}

@mcp.tool()
async def my_tool(query: str) -> dict:
    if not Config.API_KEY:
        return format_error("API_KEY not configured")
    return format_success({"query": query})
```

### Lazy Initialisation

Don't create async resources at module level. Initialise on first use:

```python
_db = None

async def get_db():
    global _db
    if _db is None:
        _db = await create_connection(Config.DB_URL)
    return _db
```

### Health Check Resource

```python
@mcp.resource("health://status")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "version": "1.0.0",
        "checks": {
            "api": "connected",
            "database": "connected"
        }
    }
```

### Connection Pooling

```python
import httpx

_client = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=Config.BASE_URL,
            headers={"Authorization": f"Bearer {Config.API_KEY}"},
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=5),
            timeout=30.0
        )
    return _client
```

### Retry with Backoff

```python
async def retry_with_backoff(func, max_retries=3, initial_delay=1.0):
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = initial_delay * (2 ** attempt)
            await asyncio.sleep(delay)
```

---

## Context Features (Advanced)

### Context Injection

```python
from fastmcp import Context

@mcp.tool()
async def tool_with_context(param: str, context: Context) -> dict:
    # Context parameter MUST have type hint
    pass
```

### Progress Tracking

```python
@mcp.tool()
async def long_task(items: list[str], context: Context) -> str:
    for i, item in enumerate(items):
        await context.report_progress(i + 1, len(items), f"Processing {item}")
        await process(item)
    return "Done"
```

### Sampling (LLM from within tools)

```python
@mcp.tool()
async def summarise(text: str, context: Context) -> str:
    result = await context.request_sampling(
        messages=[{"role": "user", "content": f"Summarise: {text}"}],
        max_tokens=200
    )
    return result
```

---

## CLI Quick Reference

```bash
fastmcp dev server.py              # Dev mode with inspector UI
fastmcp run server.py              # Run (stdio)
fastmcp run server.py --transport http --port 8000  # Run (HTTP)
fastmcp inspect server.py          # Inspect without running
fastmcp install server.py          # Install to Claude Desktop
fastmcp deploy server.py --name my-server  # Deploy to Cloud
```

Environment variables: `FASTMCP_LOG_LEVEL` (DEBUG/INFO/WARNING/ERROR), `FASTMCP_ENV` (development/staging/production).

---

## Integration Patterns (Optional)

For specific integration approaches, see `references/integration-patterns.md`:
- **Manual API** -- `httpx.AsyncClient` with reusable client
- **OpenAPI auto-generation** -- `FastMCP.from_openapi(spec, client, route_maps=[...])`
- **FastAPI conversion** -- `FastMCP.from_fastapi(app)`

---

## Asset Files

- `assets/basic-server.py` -- Minimal FastMCP server template
- `assets/self-contained-server.py` -- Server with storage and middleware
- `assets/tools-examples.py` -- Tool patterns and type annotations
- `assets/resources-examples.py` -- Resource URI patterns
- `assets/prompts-examples.py` -- Prompt template patterns
- `assets/client-example.py` -- MCP client usage
- `assets/SCRIPTS-TEMPLATE.md` -- CLI companion docs template
- `assets/script-template.ts` -- TypeScript CLI script template
