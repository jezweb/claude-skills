# Firecrawl Common Patterns & Best Practices

**Last Updated**: 2025-10-20

---

## Table of Contents

1. [Error Handling](#error-handling)
2. [Retry Strategies](#retry-strategies)
3. [Rate Limit Management](#rate-limit-management)
4. [Batch Processing](#batch-processing)
5. [Caching Strategies](#caching-strategies)
6. [Progress Tracking](#progress-tracking)
7. [Data Storage Patterns](#data-storage-patterns)
8. [Cloudflare Workers Integration](#cloudflare-workers-integration)

---

## Error Handling

### Python: Comprehensive Error Handling

```python
from firecrawl import FirecrawlApp
from firecrawl.exceptions import FirecrawlException
import time

def scrape_with_error_handling(url: str, retries: int = 3) -> dict:
    """
    Scrape a URL with comprehensive error handling and retries.
    """
    app = FirecrawlApp(api_key=os.environ.get("FIRECRAWL_API_KEY"))

    for attempt in range(retries):
        try:
            result = app.scrape_url(url, params={
                "formats": ["markdown"],
                "onlyMainContent": True
            })
            return result

        except FirecrawlException as e:
            # Firecrawl-specific errors
            if "Rate limit" in str(e):
                print(f"Rate limited. Waiting before retry {attempt + 1}/{retries}")
                time.sleep(60)  # Wait 1 minute
                continue
            elif "Invalid API key" in str(e):
                print("Invalid API key. Check your environment variables.")
                raise
            else:
                print(f"Firecrawl error: {e}")
                if attempt < retries - 1:
                    time.sleep(5 * (attempt + 1))  # Exponential backoff
                    continue
                raise

        except ConnectionError as e:
            print(f"Connection error: {e}")
            if attempt < retries - 1:
                time.sleep(10)
                continue
            raise

        except Exception as e:
            print(f"Unexpected error: {e}")
            raise

    raise Exception(f"Failed to scrape {url} after {retries} attempts")
```

### TypeScript: Comprehensive Error Handling

```typescript
import FirecrawlApp from 'firecrawl-js';

async function scrapeWithErrorHandling(
  url: string,
  retries: number = 3
): Promise<any> {
  const app = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await app.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true
      });
      return result;

    } catch (error: any) {
      // API errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || error.message;

        if (status === 429) {
          // Rate limited
          console.log(`Rate limited. Waiting before retry ${attempt + 1}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;
        } else if (status === 401) {
          // Invalid API key
          console.error('Invalid API key. Check your environment variables.');
          throw error;
        } else if (status >= 500) {
          // Server error
          console.log(`Server error (${status}). Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * (attempt + 1)));
          continue;
        } else {
          console.error(`API error (${status}): ${message}`);
          throw error;
        }
      }

      // Network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.log(`Network error: ${error.message}`);
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
      }

      // Unexpected errors
      throw error;
    }
  }

  throw new Error(`Failed to scrape ${url} after ${retries} attempts`);
}
```

---

## Retry Strategies

### Exponential Backoff

```python
import time
from typing import Callable, Any

def exponential_backoff(
    func: Callable,
    max_retries: int = 5,
    base_delay: int = 1
) -> Any:
    """
    Retry a function with exponential backoff.
    """
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise

            delay = base_delay * (2 ** attempt)
            print(f"Attempt {attempt + 1} failed. Retrying in {delay}s...")
            time.sleep(delay)

# Usage
result = exponential_backoff(
    lambda: app.scrape_url("https://example.com"),
    max_retries=5,
    base_delay=2
)
```

### Circuit Breaker Pattern

```python
from datetime import datetime, timedelta

class CircuitBreaker:
    """
    Circuit breaker to prevent cascading failures.
    """
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    def call(self, func: Callable, *args, **kwargs) -> Any:
        if self.state == "open":
            if datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout):
                self.state = "half-open"
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = func(*args, **kwargs)
            if self.state == "half-open":
                self.state = "closed"
                self.failures = 0
            return result

        except Exception as e:
            self.failures += 1
            self.last_failure_time = datetime.now()

            if self.failures >= self.failure_threshold:
                self.state = "open"
                print(f"Circuit breaker OPEN after {self.failures} failures")

            raise

# Usage
breaker = CircuitBreaker(failure_threshold=5, timeout=60)

for url in urls:
    try:
        result = breaker.call(app.scrape_url, url)
    except Exception as e:
        print(f"Failed: {e}")
```

---

## Rate Limit Management

### Credit Tracking

```python
class CreditTracker:
    """
    Track credit usage and prevent exceeding limits.
    """
    def __init__(self, daily_limit: int = 500):
        self.daily_limit = daily_limit
        self.credits_used = 0

    def estimate_credits(self, operation: str, **kwargs) -> int:
        """Estimate credits for an operation."""
        if operation == "scrape":
            credits = 1
            if kwargs.get("screenshot"):
                credits += 1
            if kwargs.get("actions"):
                credits += 1
            return credits
        elif operation == "crawl":
            pages = kwargs.get("limit", 100)
            return pages * self.estimate_credits("scrape", **kwargs.get("scrapeOptions", {}))
        elif operation == "extract":
            return len(kwargs.get("urls", [])) * 5
        return 1

    def check_and_use(self, credits: int) -> bool:
        """Check if enough credits and mark as used."""
        if self.credits_used + credits > self.daily_limit:
            print(f"⚠️ Would exceed daily limit ({self.credits_used + credits}/{self.daily_limit})")
            return False

        self.credits_used += credits
        print(f"Credits used: {self.credits_used}/{self.daily_limit}")
        return True

# Usage
tracker = CreditTracker(daily_limit=500)

for url in urls:
    credits_needed = tracker.estimate_credits("scrape", screenshot=False)
    if tracker.check_and_use(credits_needed):
        result = app.scrape_url(url)
    else:
        print("Daily limit reached. Stopping.")
        break
```

---

## Batch Processing

### Process URLs in Batches

```python
from typing import List
import time

def batch_scrape(
    urls: List[str],
    batch_size: int = 10,
    delay_between_batches: int = 5
) -> List[dict]:
    """
    Scrape URLs in batches with delays.
    """
    app = FirecrawlApp(api_key=os.environ.get("FIRECRAWL_API_KEY"))
    results = []

    for i in range(0, len(urls), batch_size):
        batch = urls[i:i + batch_size]
        print(f"Processing batch {i // batch_size + 1} ({len(batch)} URLs)")

        for url in batch:
            try:
                result = app.scrape_url(url, params={
                    "formats": ["markdown"],
                    "onlyMainContent": True
                })
                results.append(result)
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")
                results.append({"url": url, "error": str(e)})

        # Delay between batches
        if i + batch_size < len(urls):
            print(f"Waiting {delay_between_batches}s before next batch...")
            time.sleep(delay_between_batches)

    return results

# Usage
urls = ["https://example.com/page1", "https://example.com/page2", ...]
results = batch_scrape(urls, batch_size=10, delay_between_batches=5)
```

---

## Caching Strategies

### Simple File-Based Cache

```python
import os
import json
import hashlib
from pathlib import Path

class ScrapeCache:
    """
    Cache scraped content to avoid re-scraping.
    """
    def __init__(self, cache_dir: str = ".cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def _get_cache_key(self, url: str) -> str:
        """Generate cache key from URL."""
        return hashlib.md5(url.encode()).hexdigest()

    def get(self, url: str) -> dict | None:
        """Get cached result."""
        cache_key = self._get_cache_key(url)
        cache_file = self.cache_dir / f"{cache_key}.json"

        if cache_file.exists():
            with open(cache_file, "r") as f:
                return json.load(f)
        return None

    def set(self, url: str, data: dict):
        """Cache result."""
        cache_key = self._get_cache_key(url)
        cache_file = self.cache_dir / f"{cache_key}.json"

        with open(cache_file, "w") as f:
            json.dump(data, f)

# Usage
cache = ScrapeCache()

def cached_scrape(url: str) -> dict:
    # Check cache first
    cached = cache.get(url)
    if cached:
        print(f"Using cached result for {url}")
        return cached

    # Scrape and cache
    result = app.scrape_url(url)
    cache.set(url, result)
    return result
```

---

## Progress Tracking

### Progress Bar for Crawling

```python
from tqdm import tqdm

def crawl_with_progress(url: str, limit: int = 100) -> list:
    """
    Crawl with progress bar.
    """
    app = FirecrawlApp(api_key=os.environ.get("FIRECRAWL_API_KEY"))

    # Start crawl
    crawl_id = app.crawl_url(
        url=url,
        params={"limit": limit},
        wait_until_done=False  # Don't wait
    )

    # Poll with progress bar
    with tqdm(total=limit, desc="Crawling") as pbar:
        while True:
            status = app.check_crawl_status(crawl_id)

            if status["status"] == "completed":
                pbar.n = status["total"]
                pbar.refresh()
                break

            pbar.n = status["completed"]
            pbar.refresh()
            time.sleep(5)

    return status["data"]
```

---

## Data Storage Patterns

### Save to Cloudflare D1

```python
# Assuming D1 binding available in Cloudflare Worker context

async def save_to_d1(pages: list, db):
    """
    Save scraped pages to D1 database.
    """
    for page in pages:
        await db.prepare(
            """
            INSERT INTO scraped_pages (url, title, content, scraped_at)
            VALUES (?, ?, ?, ?)
            """
        ).bind(
            page["url"],
            page["metadata"].get("title"),
            page["markdown"],
            datetime.now().isoformat()
        ).run()
```

### Save to Cloudflare R2

```python
# Assuming R2 binding available

async def save_to_r2(pages: list, bucket):
    """
    Save scraped pages to R2 storage.
    """
    for page in pages:
        key = f"scraped/{page['url'].replace('https://', '')}.md"

        await bucket.put(
            key,
            page["markdown"],
            {
                "httpMetadata": {
                    "contentType": "text/markdown"
                },
                "customMetadata": {
                    "url": page["url"],
                    "title": page["metadata"].get("title", ""),
                    "scraped_at": datetime.now().isoformat()
                }
            }
        )
```

---

## Cloudflare Workers Integration

### Complete Worker Example

```typescript
import FirecrawlApp from 'firecrawl-js';

interface Env {
  FIRECRAWL_API_KEY: string;
  SCRAPED_CONTENT: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const app = new FirecrawlApp({
      apiKey: env.FIRECRAWL_API_KEY
    });

    const { url } = await request.json();

    // Check cache (KV)
    const cached = await env.SCRAPED_CONTENT.get(url);
    if (cached) {
      return Response.json({
        cached: true,
        data: JSON.parse(cached)
      });
    }

    // Scrape
    try {
      const result = await app.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true
      });

      // Cache for 1 hour
      await env.SCRAPED_CONTENT.put(
        url,
        JSON.stringify(result),
        { expirationTtl: 3600 }
      );

      return Response.json({
        cached: false,
        data: result
      });

    } catch (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }
};
```

### Scheduled Worker (Cron Job)

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const app = new FirecrawlApp({
      apiKey: env.FIRECRAWL_API_KEY
    });

    // Scrape daily
    const result = await app.scrapeUrl('https://news.example.com', {
      formats: ['markdown'],
      onlyMainContent: true
    });

    // Store in D1
    await env.DB.prepare(
      `INSERT INTO daily_scrapes (url, content, scraped_at)
       VALUES (?, ?, ?)`
    ).bind(
      'https://news.example.com',
      result.markdown,
      new Date().toISOString()
    ).run();
  }
};
```

---

## Best Practices Summary

### Do's ✅

1. **Always use environment variables** for API keys
2. **Implement retry logic** with exponential backoff
3. **Cache results** to avoid re-scraping
4. **Use `onlyMainContent: true`** to save credits
5. **Track credit usage** to avoid unexpected costs
6. **Handle errors gracefully** with specific error types
7. **Use batch processing** for large numbers of URLs
8. **Set reasonable `waitFor` times** for dynamic content
9. **Use `/v2/map` first** to plan efficient crawls
10. **Monitor rate limits** and implement backoff

### Don'ts ❌

1. **Don't hardcode API keys** in source code
2. **Don't scrape without error handling**
3. **Don't ignore rate limits**
4. **Don't scrape the same content repeatedly** without caching
5. **Don't set excessively high `limit` values** on crawls
6. **Don't assume all scrapes succeed** - always check for errors
7. **Don't use synchronous code** in production (use async)
8. **Don't forget to set `removeBase64Images: true`** for large pages
9. **Don't skip `onlyMainContent`** if you want clean data
10. **Don't crawl without setting `excludePaths`** for known problematic routes

---

## Official Documentation

- **API Reference**: https://docs.firecrawl.dev/api-reference
- **Best Practices**: https://docs.firecrawl.dev/best-practices
- **Rate Limits**: https://docs.firecrawl.dev/rate-limits
