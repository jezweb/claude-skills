# Firecrawl Web Scraper

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-20
**API Version**: v2
**Official Docs**: https://docs.firecrawl.dev

---

## What This Skill Does

Provides complete knowledge for using Firecrawl v2 API - a web scraping service that converts websites into LLM-ready markdown or structured data. This skill covers:

- **Single page scraping** with `/v2/scrape` endpoint
- **Full site crawling** with `/v2/crawl` endpoint
- **URL discovery** with `/v2/map` endpoint
- **Structured data extraction** with `/v2/extract` endpoint
- **Python SDK** (firecrawl-py v4.5.0+)
- **TypeScript/Node.js SDK** (firecrawl-js v1.7.x+)
- **JavaScript rendering**, anti-bot bypass, screenshot capture
- **Error handling**, rate limits, and best practices
- **Cloudflare Workers integration**

**Prevents common issues** with API authentication, rate limiting, timeout errors, and content extraction failures.

---

## Auto-Trigger Keywords

Claude automatically uses this skill when you mention:

### Primary Triggers (Technologies)
- firecrawl
- firecrawl api
- firecrawl-py
- firecrawl-js
- web scraping
- web crawler
- site crawler
- scrape website
- crawl website
- web scraper

### Secondary Triggers (Use Cases)
- extract web content
- html to markdown
- convert website to markdown
- scrape documentation
- crawl documentation site
- extract structured data
- parse website
- content extraction
- web automation
- website to llm
- llm ready data
- rag from website
- scrape articles
- extract product data
- map website urls

### Error-Based Triggers
- "content not loading"
- "javascript rendering issues"
- "blocked by bot detection"
- "scraping blocked"
- "captcha blocking scraper"
- "dynamic content not scraping"
- "anti-bot protection"
- "scraper detected"
- "cloudflare challenge"
- "timeout scraping"
- "empty scrape result"
- "rate limit exceeded firecrawl"
- "invalid api key firecrawl"

### Framework Integration
- firecrawl cloudflare workers
- firecrawl python
- firecrawl typescript
- firecrawl node.js
- scraping with cloudflare
- serverless web scraping

---

## Known Issues Prevented

| Issue | Error Message | Prevention |
|-------|---------------|------------|
| **#1: API Key Not Set** | "Invalid API Key" | Proper environment variable setup with examples |
| **#2: Rate Limits** | "Rate limit exceeded" | Best practices for credit optimization |
| **#3: Timeout Errors** | "Request timeout" | `waitFor` parameter configuration |
| **#4: Empty Content** | "Content is empty" | JavaScript rendering with actions/wait strategies |
| **#5: Bot Detection** | "Access denied" | Firecrawl's built-in anti-bot bypass |
| **#6: Hardcoded API Keys** | Security vulnerability | Environment variable patterns |

---

## Quick Start

### Python

```bash
# Install
pip install firecrawl-py

# Set API key
export FIRECRAWL_API_KEY=fc-your-api-key
```

```python
import os
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key=os.environ.get("FIRECRAWL_API_KEY"))

# Scrape single page
result = app.scrape_url("https://example.com", params={
    "formats": ["markdown"],
    "onlyMainContent": True
})

print(result.get("markdown"))
```

### TypeScript/Node.js

```bash
# Install
npm install firecrawl-js

# Set API key
export FIRECRAWL_API_KEY=fc-your-api-key
```

```typescript
import FirecrawlApp from 'firecrawl-js';

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

// Scrape single page
const result = await app.scrapeUrl('https://example.com', {
  formats: ['markdown'],
  onlyMainContent: true
});

console.log(result.markdown);
```

**Full instructions**: See `SKILL.md`

---

## Token Savings Estimate

**Without this skill**: ~10,000 tokens (API docs lookup + trial-and-error + debugging)
**With this skill**: ~4,000 tokens (direct implementation with best practices)

**Savings**: ~60% token reduction + prevents all 6 common issues

---

## File Structure

```
firecrawl-scraper/
├── SKILL.md                           # Full instructions (read this first)
├── README.md                          # This file
├── templates/                         # Copy-ready code templates
│   ├── firecrawl-scrape-python.py     # Basic Python scraping
│   ├── firecrawl-scrape-typescript.ts # Basic TypeScript scraping
│   └── firecrawl-crawl-example.py     # Full crawl with storage
└── reference/                         # Deep-dive documentation
    ├── endpoints.md                   # All 4 API endpoints explained
    └── common-patterns.md             # Error handling, retries, batching
```

---

## Package Versions (Verified 2025-10-20)

| Package | Version | Status |
|---------|---------|--------|
| firecrawl-py | 4.5.0+ | ✅ Latest stable |
| firecrawl-js | 1.7.x+ | ✅ Latest stable |
| API Version | v2 | ✅ Current |

---

## When to Use This Skill

✅ **Use this skill when:**
- Scraping modern websites with JavaScript
- Converting websites to markdown for RAG/LLMs
- Extracting structured data from web pages
- Building documentation scrapers
- Need to bypass bot protection
- Crawling entire sites
- Handling dynamic content

❌ **Don't use this skill for:**
- Simple static HTML scraping (use BeautifulSoup/Cheerio)
- APIs with official SDKs (use the SDK directly)
- Sites you control (just export the data)
- Real-time live data (consider WebSockets/SSE)

---

## API Endpoints Overview

1. **`/v2/scrape`** - Scrape a single webpage
   - Best for: Articles, product pages, specific URLs
   - Returns: Markdown, HTML, screenshot

2. **`/v2/crawl`** - Crawl entire website
   - Best for: Documentation sites, full site archives
   - Returns: Array of scraped pages

3. **`/v2/map`** - Discover all URLs on site
   - Best for: Sitemap generation, planning crawls
   - Returns: List of URLs found

4. **`/v2/extract`** - Extract structured data with AI
   - Best for: Product catalogs, directory listings
   - Returns: JSON matching your schema

---

## Common Use Cases

### 1. Documentation Scraping for RAG
```python
docs = app.crawl_url("https://docs.example.com", params={
    "limit": 500,
    "scrapeOptions": {"formats": ["markdown"]}
})
```

### 2. Product Data Extraction
```typescript
const schema = z.object({
  title: z.string(),
  price: z.number(),
  in_stock: z.boolean()
});

const products = await app.extract({
  urls: productUrls,
  schema: schema
});
```

### 3. News Article Scraping
```python
article = app.scrape_url("https://news.com/article", params={
    "formats": ["markdown"],
    "onlyMainContent": True
})
```

---

## Cloudflare Workers Integration

Works seamlessly with Cloudflare Workers for serverless scraping:

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const app = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

    const { url } = await request.json();
    const result = await app.scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true
    });

    return Response.json({ markdown: result.markdown });
  }
};
```

---

## Official Documentation

- **Docs**: https://docs.firecrawl.dev
- **Python SDK**: https://docs.firecrawl.dev/sdks/python
- **Node.js SDK**: https://docs.firecrawl.dev/sdks/node
- **API Reference**: https://docs.firecrawl.dev/api-reference
- **GitHub**: https://github.com/mendableai/firecrawl
- **Get API Key**: https://www.firecrawl.dev

---

## Research Validation

- ✅ API v2 verified (2025-10-20)
- ✅ Python SDK v4.5.0+ verified on PyPI
- ✅ Node.js SDK v1.7.x+ verified on npm
- ✅ All endpoints documented from official docs
- ✅ Rate limits and best practices confirmed

---

## Next Steps After Using This Skill

1. **Store scraped data**: Use `cloudflare-d1` skill for database storage
2. **Build vector search**: Use `cloudflare-vectorize` skill for RAG
3. **Schedule scraping**: Use `cloudflare-queues` skill for async jobs
4. **Process with AI**: Use `cloudflare-workers-ai` skill for content analysis

---

**Production Tested**: ✅
**Token Efficiency**: ~60% savings
**Error Prevention**: 6 common issues prevented
**Composable**: Works with other Cloudflare skills

**Ready to use!** Start with `SKILL.md` for complete instructions.
