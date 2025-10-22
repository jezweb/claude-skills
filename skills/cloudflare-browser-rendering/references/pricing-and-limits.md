# Pricing and Limits Reference

Complete breakdown of Cloudflare Browser Rendering pricing, limits, and cost optimization strategies.

---

## Pricing Overview

Browser Rendering is billed on **two metrics**:

1. **Duration** - Total browser hours used
2. **Concurrency** - Monthly average of concurrent browsers (Workers Bindings only)

---

## Free Tier (Workers Free Plan)

| Feature | Limit |
|---------|-------|
| **Browser Duration** | 10 minutes per day |
| **Concurrent Browsers** | 3 per account |
| **New Browsers per Minute** | 3 per minute |
| **REST API Requests** | 6 per minute |
| **Browser Timeout (Idle)** | 60 seconds |
| **Max Session Duration** | No hard limit (closes on idle timeout) |

### Free Tier Use Cases

**Good for:**
- Development and testing
- Personal projects
- Low-traffic screenshot services (<100 requests/day)
- Learning and experimentation

**Not suitable for:**
- Production applications
- High-traffic services
- Long-running scraping jobs
- Batch operations (>3 concurrent browsers)

---

## Paid Tier (Workers Paid Plan)

### Included Limits

| Feature | Included |
|---------|----------|
| **Browser Duration** | 10 hours per month |
| **Concurrent Browsers** | 10 (monthly average) |
| **New Browsers per Minute** | 30 per minute |
| **REST API Requests** | 180 per minute |
| **Max Concurrent Browsers** | 30 per account |
| **Browser Timeout** | 60 seconds (extendable to 10 minutes with keep_alive) |

### Beyond Included Limits

| Metric | Price |
|--------|-------|
| **Additional Browser Hours** | $0.09 per hour |
| **Additional Concurrent Browsers** | $2.00 per browser (monthly average) |

### Requesting Higher Limits

If you need more than:
- 30 concurrent browsers
- 30 new browsers per minute
- 180 REST API requests per minute

**Request higher limits**: https://forms.gle/CdueDKvb26mTaepa9

---

## Rate Limits

### Per-Second Enforcement

Rate limits are enforced **per-second**, not per-minute.

**Example**: 180 requests per minute = 3 requests per second

**This means:**
- ❌ Cannot send all 180 requests at once
- ✅ Must spread evenly over the minute (3/second)

**Implementation:**
```typescript
async function rateLimitedLaunch(env: Env): Promise<Browser> {
  const limits = await puppeteer.limits(env.MYBROWSER);

  if (limits.allowedBrowserAcquisitions === 0) {
    const delay = limits.timeUntilNextAllowedBrowserAcquisition;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return await puppeteer.launch(env.MYBROWSER);
}
```

### Free Tier Rate Limits

- **Concurrent browsers**: 3
- **New browsers/minute**: 3 (= 1 every 20 seconds)
- **REST API requests/minute**: 6 (= 1 every 10 seconds)

### Paid Tier Rate Limits

- **Concurrent browsers**: 30 (default, can request higher)
- **New browsers/minute**: 30 (= 1 every 2 seconds)
- **REST API requests/minute**: 180 (= 3 per second)

---

## Duration Billing

### How It Works

1. **Daily Totals**: Cloudflare sums all browser usage each day (in seconds)
2. **Monthly Total**: Sum of all daily totals
3. **Rounded to Hours**: Total rounded to nearest hour
4. **Billed**: Total hours minus 10 included hours

**Example:**
- Day 1: 60 seconds (1 minute)
- Day 2: 120 seconds (2 minutes)
- ...
- Day 30: 90 seconds (1.5 minutes)
- **Monthly Total**: 45 minutes = 0.75 hours (rounded to 1 hour)
- **Billable**: 1 hour - 10 included = 0 hours (still within free allowance)

### Failed Requests

**Failed requests are NOT billed** if they fail with `waitForTimeout` error.

**Example:**
```typescript
try {
  await page.goto(url, { timeout: 30000 });
} catch (error) {
  // If this times out, browser time is NOT charged
  console.log("Navigation timeout - not billed");
}
```

### Duration Optimization

**Minimize browser time:**

1. **Close browsers promptly**
   ```typescript
   await browser.close(); // Don't leave hanging
   ```

2. **Use session reuse**
   ```typescript
   // Reuse session instead of launching new browser
   const browser = await puppeteer.connect(env.MYBROWSER, sessionId);
   ```

3. **Timeout management**
   ```typescript
   // Set appropriate timeouts (don't wait forever)
   await page.goto(url, { timeout: 30000 });
   ```

4. **Cache aggressively**
   ```typescript
   // Cache screenshots in KV to avoid re-rendering
   const cached = await env.KV.get(url, { type: "arrayBuffer" });
   if (cached) return new Response(cached);
   ```

---

## Concurrency Billing

### How It Works

1. **Daily Peak**: Cloudflare records highest concurrent browsers each day
2. **Monthly Average**: Average of all daily peaks
3. **Billed**: Average - 10 included browsers

**Formula:**
```
monthly_average = sum(daily_peaks) / days_in_month
billable = max(0, monthly_average - 10)
cost = billable * $2.00
```

**Example:**
- Days 1-15: 10 concurrent browsers (daily peak)
- Days 16-30: 20 concurrent browsers (daily peak)
- Monthly average: ((10 × 15) + (20 × 15)) / 30 = 15 browsers
- Billable: 15 - 10 = 5 browsers
- **Cost**: 5 × $2.00 = **$10.00**

### Concurrency vs Duration

| Scenario | Concurrency Impact | Duration Impact |
|----------|-------------------|-----------------|
| 1 browser for 10 hours | 1 concurrent browser | 10 browser hours |
| 10 browsers for 1 hour | 10 concurrent browsers | 10 browser hours |
| 100 browsers for 6 minutes | 100 concurrent browsers (!!) | 10 browser hours |

**Key Insight**: Short bursts of high concurrency are EXPENSIVE.

### Concurrency Optimization

**Minimize concurrent browsers:**

1. **Use multiple tabs**
   ```typescript
   // ❌ Bad: 10 browsers
   for (const url of urls) {
     const browser = await puppeteer.launch(env.MYBROWSER);
     // ...
   }

   // ✅ Good: 1 browser, 10 tabs
   const browser = await puppeteer.launch(env.MYBROWSER);
   await Promise.all(urls.map(async url => {
     const page = await browser.newPage();
     // ...
   }));
   ```

2. **Session reuse**
   ```typescript
   // Maintain pool of warm browsers
   // Reuse instead of launching new ones
   ```

3. **Queue requests**
   ```typescript
   // Limit concurrent operations
   const queue = new PQueue({ concurrency: 3 });
   await Promise.all(urls.map(url => queue.add(() => process(url))));
   ```

4. **Incognito contexts**
   ```typescript
   // Share browser, isolate sessions
   const context1 = await browser.createBrowserContext();
   const context2 = await browser.createBrowserContext();
   ```

---

## Cost Examples

### Example 1: Screenshot Service

**Scenario:**
- 10,000 screenshots per month
- 3 second average per screenshot
- No caching, no session reuse

**Duration:**
- 10,000 × 3 seconds = 30,000 seconds = 8.33 hours
- Billable: 8.33 - 10 = 0 hours (within free allowance)
- **Duration Cost**: $0.00

**Concurrency:**
- Assume 100 requests/hour during peak (9am-5pm weekdays)
- 100 requests/hour ÷ 3600 seconds = 0.028 browsers/second
- Peak: ~3 concurrent browsers
- Daily peak (weekdays): 3 browsers
- Daily peak (weekends): 1 browser
- Monthly average: ((3 × 22) + (1 × 8)) / 30 = 2.5 browsers
- Billable: 2.5 - 10 = 0 (within free allowance)
- **Concurrency Cost**: $0.00

**Total: $0.00** (within free tier!)

---

### Example 2: Heavy Scraping

**Scenario:**
- 1,000 URLs per day
- 10 seconds average per URL
- Batch processing (10 concurrent browsers)

**Duration:**
- 1,000 × 10 seconds × 30 days = 300,000 seconds = 83.33 hours
- Billable: 83.33 - 10 = 73.33 hours
- **Duration Cost**: 73.33 × $0.09 = **$6.60**

**Concurrency:**
- Daily peak: 10 concurrent browsers (every day)
- Monthly average: 10 browsers
- Billable: 10 - 10 = 0 (within free allowance)
- **Concurrency Cost**: $0.00

**Total: $6.60/month**

---

### Example 3: Burst Traffic

**Scenario:**
- Newsletter sent monthly with screenshot links
- 10,000 screenshots in 1 hour
- Each screenshot: 3 seconds

**Duration:**
- 10,000 × 3 seconds = 30,000 seconds = 8.33 hours
- Billable: 8.33 - 10 = 0 hours
- **Duration Cost**: $0.00

**Concurrency:**
- 10,000 screenshots in 1 hour = 166 requests/minute
- At 3 seconds each: ~8.3 concurrent browsers
- But limited to 30 max, so likely queueing
- Daily peak: 30 browsers (rate limit)
- Monthly average: (30 × 1 day + 1 × 29 days) / 30 = 1.97 browsers
- Billable: 1.97 - 10 = 0
- **Concurrency Cost**: $0.00

**Total: $0.00**

**Note**: Would hit rate limits. Better to spread over longer period or request higher limits.

---

### Example 4: Production API (Optimized)

**Scenario:**
- 100,000 screenshots per month
- Session reuse + KV caching (90% cache hit rate)
- 10,000 actual browser renderings
- 5 seconds average per render
- Maintain pool of 5 warm browsers

**Duration:**
- 10,000 × 5 seconds = 50,000 seconds = 13.89 hours
- Billable: 13.89 - 10 = 3.89 hours
- **Duration Cost**: 3.89 × $0.09 = **$0.35**

**Concurrency:**
- Maintain pool of 5 browsers (keep_alive)
- Daily peak: 5 browsers
- Monthly average: 5 browsers
- Billable: 5 - 10 = 0
- **Concurrency Cost**: $0.00

**Total: $0.35/month** for 100k requests!

**ROI**: $0.0000035 per screenshot

---

## Cost Optimization Strategies

### 1. Aggressive Caching

**Strategy**: Cache screenshots/PDFs in KV or R2

**Impact**:
- Reduces browser hours by 80-95%
- Reduces concurrency needs
- Faster response times

**Implementation**:
```typescript
// Check cache first
const cached = await env.KV.get(url, { type: "arrayBuffer" });
if (cached) return new Response(cached);

// Generate and cache
const screenshot = await generateScreenshot(url);
await env.KV.put(url, screenshot, { expirationTtl: 86400 });
```

**Cost Savings**: 80-95% reduction

---

### 2. Session Reuse

**Strategy**: Maintain pool of warm browsers, reuse sessions

**Impact**:
- Reduces cold start time
- Lower concurrency charges
- Better throughput

**Implementation**: See `session-reuse.ts` template

**Cost Savings**: 30-50% reduction

---

### 3. Multiple Tabs

**Strategy**: Use tabs instead of multiple browsers

**Impact**:
- 10-50x reduction in concurrency
- Minimal duration increase
- Much cheaper

**Implementation**:
```typescript
const browser = await puppeteer.launch(env.MYBROWSER);
await Promise.all(urls.map(async url => {
  const page = await browser.newPage();
  // process
  await page.close();
}));
await browser.close();
```

**Cost Savings**: 90%+ reduction in concurrency charges

---

### 4. Appropriate Timeouts

**Strategy**: Set reasonable timeouts, don't wait forever

**Impact**:
- Prevents hanging browsers
- Reduces wasted duration
- Better error handling

**Implementation**:
```typescript
await page.goto(url, {
  timeout: 30000,  // 30 second max
  waitUntil: "networkidle0"
});
```

**Cost Savings**: 20-40% reduction

---

### 5. Request Queueing

**Strategy**: Limit concurrent operations to stay within limits

**Impact**:
- Avoid rate limit errors
- Predictable costs
- Better resource utilization

**Implementation**:
```typescript
import PQueue from "p-queue";

const queue = new PQueue({ concurrency: 5 });

await Promise.all(urls.map(url =>
  queue.add(() => processUrl(url))
));
```

**Cost Savings**: Avoids rate limit charges

---

## Monitoring Usage

### Dashboard

View usage in Cloudflare Dashboard:

https://dash.cloudflare.com/?to=/:account/workers/browser-rendering

**Metrics available:**
- Total browser hours used
- REST API requests
- Concurrent browsers (graph)
- Cost estimates

### Response Headers

REST API returns browser time used:

```
X-Browser-Ms-Used: 2340
```

(Browser time in milliseconds for that request)

### Custom Tracking

```typescript
interface UsageMetrics {
  date: string;
  browserHours: number;
  peakConcurrency: number;
  requests: number;
  cacheHitRate: number;
}

// Track in D1 or Analytics Engine
await env.ANALYTICS.writeDataPoint({
  indexes: [date],
  blobs: ["browser_usage"],
  doubles: [browserHours, peakConcurrency, requests]
});
```

---

## Cost Alerts

### Set Up Alerts

1. **Monitor daily peaks**
   ```typescript
   const limits = await puppeteer.limits(env.MYBROWSER);
   if (limits.activeSessions.length > 15) {
     console.warn("High concurrency detected:", limits.activeSessions.length);
   }
   ```

2. **Track hourly usage**
   ```typescript
   const usage = await getHourlyUsage();
   if (usage.browserHours > 1) {
     console.warn("High browser usage this hour:", usage.browserHours);
   }
   ```

3. **Set budget limits**
   ```typescript
   const monthlyBudget = 50; // $50/month
   const currentCost = await estimateCurrentCost();
   if (currentCost > monthlyBudget * 0.8) {
     console.warn("Approaching monthly budget:", currentCost);
   }
   ```

---

## Best Practices Summary

1. **Always cache** screenshots/PDFs in KV or R2
2. **Reuse sessions** instead of launching new browsers
3. **Use multiple tabs** instead of multiple browsers
4. **Set appropriate timeouts** to prevent hanging
5. **Monitor usage** in dashboard and logs
6. **Queue requests** to stay within rate limits
7. **Test caching** to optimize hit rate
8. **Profile operations** to identify slow requests
9. **Use incognito contexts** for session isolation
10. **Request higher limits** if needed for production

---

## Common Questions

### Q: Are failed requests billed?

**A**: No. Requests that fail with `waitForTimeout` error are NOT billed.

### Q: How is concurrency calculated?

**A**: Monthly average of daily peak concurrent browsers.

### Q: Can I reduce my bill?

**A**: Yes! Use caching, session reuse, and multiple tabs. See optimization strategies above.

### Q: What if I hit limits?

**A**: Implement queueing, or request higher limits: https://forms.gle/CdueDKvb26mTaepa9

### Q: Is there a free tier?

**A**: Yes! 10 minutes/day browser time, 3 concurrent browsers.

### Q: How do I estimate costs?

**A**: Monitor usage in dashboard, then calculate:
- Duration: (hours - 10) × $0.09
- Concurrency: (avg - 10) × $2.00

---

## References

- **Official Pricing Docs**: https://developers.cloudflare.com/browser-rendering/platform/pricing/
- **Limits Docs**: https://developers.cloudflare.com/browser-rendering/platform/limits/
- **Dashboard**: https://dash.cloudflare.com/?to=/:account/workers/browser-rendering
- **Request Higher Limits**: https://forms.gle/CdueDKvb26mTaepa9

---

**Last Updated**: 2025-10-22
