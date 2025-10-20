# Firecrawl API Endpoints Reference

**API Version**: v2
**Base URL**: `https://api.firecrawl.dev`
**Last Updated**: 2025-10-20

---

## Overview

Firecrawl v2 provides four main endpoints for different web scraping needs:

1. **`/v2/scrape`** - Scrape a single page
2. **`/v2/crawl`** - Crawl multiple pages from a starting URL
3. **`/v2/map`** - Discover all URLs on a site
4. **`/v2/extract`** - Extract structured data with AI

---

## 1. `/v2/scrape` - Single Page Scraping

### Purpose
Scrape a single webpage and return its content in various formats.

### Use Cases
- Extract article content
- Get product details from a page
- Convert specific pages to markdown
- Capture screenshots
- Scrape pages with dynamic JavaScript content

### Request

**Endpoint**: `POST https://api.firecrawl.dev/v2/scrape`

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body**:
```json
{
  "url": "https://example.com/page",
  "formats": ["markdown", "html", "screenshot"],
  "onlyMainContent": true,
  "waitFor": 3000,
  "removeBase64Images": true,
  "actions": [
    {"type": "click", "selector": "button.load-more"},
    {"type": "wait", "milliseconds": 2000}
  ]
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | **required** | URL to scrape |
| `formats` | array | `["markdown"]` | Output formats: `"markdown"`, `"html"`, `"screenshot"` |
| `onlyMainContent` | boolean | `false` | Remove headers, footers, nav, ads |
| `waitFor` | number | `0` | Milliseconds to wait before scraping |
| `removeBase64Images` | boolean | `false` | Remove base64-encoded images |
| `actions` | array | `[]` | Browser actions to perform before scraping |
| `headers` | object | `{}` | Custom HTTP headers |

### Response

```json
{
  "success": true,
  "data": {
    "markdown": "# Page Title\n\nContent...",
    "html": "<html>...</html>",
    "screenshot": "data:image/png;base64,...",
    "metadata": {
      "title": "Page Title",
      "description": "Page description",
      "language": "en",
      "sourceURL": "https://example.com/page"
    }
  }
}
```

### Python Example

```python
result = app.scrape_url(
    url="https://example.com",
    params={
        "formats": ["markdown", "html"],
        "onlyMainContent": True,
        "waitFor": 3000
    }
)

markdown = result.get("markdown")
```

### TypeScript Example

```typescript
const result = await app.scrapeUrl('https://example.com', {
  formats: ['markdown', 'html'],
  onlyMainContent: true,
  waitFor: 3000
});

const markdown = result.markdown;
```

---

## 2. `/v2/crawl` - Multi-Page Crawling

### Purpose
Crawl multiple pages starting from a URL, following links automatically.

### Use Cases
- Index entire documentation sites
- Archive website content
- Build knowledge bases from multiple pages
- Scrape blog archives
- Collect all product pages

### Request

**Endpoint**: `POST https://api.firecrawl.dev/v2/crawl`

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body**:
```json
{
  "url": "https://docs.example.com",
  "limit": 100,
  "maxDepth": 3,
  "scrapeOptions": {
    "formats": ["markdown"],
    "onlyMainContent": true
  },
  "allowedDomains": ["docs.example.com"],
  "excludePaths": ["/admin/*", "/login"],
  "includePaths": ["/docs/*"],
  "webhook": "https://your-domain.com/webhook"
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | **required** | Starting URL to crawl |
| `limit` | number | `100` | Maximum pages to crawl |
| `maxDepth` | number | `2` | How many links deep to follow |
| `scrapeOptions` | object | `{}` | Options to pass to scrape endpoint |
| `allowedDomains` | array | `[]` | Only crawl these domains |
| `excludePaths` | array | `[]` | Skip URLs matching these patterns |
| `includePaths` | array | `[]` | Only crawl URLs matching these patterns |
| `webhook` | string | `null` | Webhook URL to receive results |

### Response

```json
{
  "success": true,
  "id": "crawl_abc123",
  "url": "https://api.firecrawl.dev/v2/crawl/abc123"
}
```

**Status Check**: `GET https://api.firecrawl.dev/v2/crawl/abc123`

**Status Response**:
```json
{
  "status": "completed",
  "total": 47,
  "completed": 47,
  "creditsUsed": 94,
  "data": [
    {
      "url": "https://docs.example.com/page1",
      "markdown": "# Content...",
      "metadata": {...}
    },
    ...
  ]
}
```

### Python Example

```python
crawl_result = app.crawl_url(
    url="https://docs.example.com",
    params={
        "limit": 100,
        "maxDepth": 3,
        "scrapeOptions": {
            "formats": ["markdown"],
            "onlyMainContent": True
        }
    },
    poll_interval=5  # Check status every 5 seconds
)

pages = crawl_result.get("data", [])
for page in pages:
    print(page["url"])
```

### TypeScript Example

```typescript
const crawlResult = await app.crawlUrl('https://docs.example.com', {
  limit: 100,
  maxDepth: 3,
  scrapeOptions: {
    formats: ['markdown'],
    onlyMainContent: true
  }
});

for (const page of crawlResult.data) {
  console.log(page.url);
}
```

---

## 3. `/v2/map` - URL Discovery

### Purpose
Map all URLs on a website without scraping their content.

### Use Cases
- Generate sitemap
- Discover all pages before crawling
- Audit website structure
- Plan crawling strategy
- Find broken links

### Request

**Endpoint**: `POST https://api.firecrawl.dev/v2/map`

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body**:
```json
{
  "url": "https://example.com",
  "search": "documentation",
  "limit": 5000
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | **required** | Starting URL to map |
| `search` | string | `null` | Filter URLs containing this text |
| `limit` | number | `5000` | Maximum URLs to discover |

### Response

```json
{
  "success": true,
  "links": [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/docs/intro",
    ...
  ]
}
```

### Python Example

```python
map_result = app.map_url("https://example.com")
urls = map_result.get("links", [])

print(f"Found {len(urls)} URLs")
for url in urls:
    print(url)
```

### TypeScript Example

```typescript
const mapResult = await app.mapUrl('https://example.com');
const urls = mapResult.links;

console.log(`Found ${urls.length} URLs`);
urls.forEach(url => console.log(url));
```

---

## 4. `/v2/extract` - Structured Data Extraction

### Purpose
Extract structured data from web pages using AI and schemas.

### Use Cases
- Extract product information (price, title, availability)
- Parse contact details from pages
- Build structured datasets from unstructured HTML
- Custom data extraction with schemas
- Scrape directory listings

### Request

**Endpoint**: `POST https://api.firecrawl.dev/v2/extract`

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body**:
```json
{
  "urls": [
    "https://example.com/product1",
    "https://example.com/product2"
  ],
  "schema": {
    "type": "object",
    "properties": {
      "product_name": {"type": "string"},
      "price": {"type": "number"},
      "in_stock": {"type": "boolean"}
    },
    "required": ["product_name", "price"]
  },
  "systemPrompt": "Extract product details including name, price, and availability"
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `urls` | array | **required** | URLs to extract from |
| `schema` | object | **required** | JSON schema or Zod schema |
| `systemPrompt` | string | `null` | Guide AI extraction behavior |

### Response

```json
{
  "success": true,
  "data": [
    {
      "product_name": "Widget Pro",
      "price": 29.99,
      "in_stock": true
    },
    {
      "product_name": "Gadget Max",
      "price": 49.99,
      "in_stock": false
    }
  ]
}
```

### Python Example

```python
schema = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "price": {"type": "number"},
        "availability": {"type": "string"}
    },
    "required": ["title", "price"]
}

result = app.extract(
    urls=["https://example.com/product"],
    params={
        "schema": schema,
        "systemPrompt": "Extract product information"
    }
)

print(result)
```

### TypeScript Example (with Zod)

```typescript
import { z } from 'zod';

const schema = z.object({
  title: z.string(),
  price: z.number(),
  availability: z.string()
});

const result = await app.extract({
  urls: ['https://example.com/product'],
  schema: schema,
  systemPrompt: 'Extract product information'
});

console.log(result);
```

---

## Credit Usage

Different endpoints consume different amounts of credits:

| Endpoint | Base Credits | Notes |
|----------|--------------|-------|
| `/v2/scrape` | 1-3 | +1 for screenshot, +1 for actions |
| `/v2/crawl` | 1-3 per page | Same as scrape, multiplied by pages |
| `/v2/map` | 1 | Flat rate |
| `/v2/extract` | 5 per page | Uses AI for extraction |

**Credit Optimization**:
- Use `onlyMainContent: true` to reduce credits
- Use `removeBase64Images: true` to reduce response size
- Use `/v2/map` first to plan crawls efficiently
- Batch extract calls when possible

---

## Rate Limits

- **Free tier**: 500 credits/month
- **Paid tiers**: Varies by plan
- **Rate limiting**: Handled automatically by SDK with retries

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

### 429 Rate Limited
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please upgrade your plan."
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error. Please try again."
}
```

---

## Official Documentation

- **API Reference**: https://docs.firecrawl.dev/api-reference
- **SDKs**: https://docs.firecrawl.dev/sdks
- **Dashboard**: https://www.firecrawl.dev/app
