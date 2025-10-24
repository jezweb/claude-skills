# Rate Limits Guide

Complete guide to Claude API rate limits and how to handle them.

## Overview

Claude API uses **token bucket algorithm** for rate limiting:
- Capacity continuously replenishes
- Three types: Requests per minute (RPM), Tokens per minute (TPM), Daily tokens
- Limits vary by account tier and model

## Rate Limit Tiers

| Tier | Requirements | Example Limits (Sonnet 3.5) |
|------|--------------|------------------------------|
| Tier 1 | New account | 50 RPM, 40k TPM |
| Tier 2 | $10 spend | 1000 RPM, 100k TPM |
| Tier 3 | $50 spend | 2000 RPM, 200k TPM |
| Tier 4 | $500 spend | 4000 RPM, 400k TPM |

**Note**: Limits vary by model. Check Console for exact limits.

## Response Headers

Every API response includes:

```
anthropic-ratelimit-requests-limit: 50
anthropic-ratelimit-requests-remaining: 49
anthropic-ratelimit-requests-reset: 2025-10-25T12:00:00Z
anthropic-ratelimit-tokens-limit: 50000
anthropic-ratelimit-tokens-remaining: 49500
anthropic-ratelimit-tokens-reset: 2025-10-25T12:01:00Z
```

On 429 errors:
```
retry-after: 60  // Seconds until retry allowed
```

## Handling Rate Limits

### Basic Exponential Backoff

```typescript
async function withRetry(requestFn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.status === 429) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

### Respecting retry-after Header

```typescript
const retryAfter = error.response?.headers?.['retry-after'];
const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay;
```

## Best Practices

1. **Monitor headers** - Check remaining requests/tokens
2. **Implement backoff** - Exponential delay on 429
3. **Respect retry-after** - Use provided wait time
4. **Batch requests** - Group when possible
5. **Use caching** - Reduce duplicate requests
6. **Upgrade tier** - Scale with usage

## Official Docs

https://docs.claude.com/en/api/rate-limits
