/**
 * OpenAI Rate Limit Handling - Production Patterns
 *
 * This template demonstrates:
 * - Exponential backoff
 * - Rate limit header monitoring
 * - Request queuing
 * - Retry logic
 * - Circuit breaker pattern
 * - Token bucket algorithm
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// EXPONENTIAL BACKOFF
// =============================================================================

async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // Only retry on rate limit errors
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // 1s, 2s, 4s
        console.log(`Rate limit hit. Retrying in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage example
async function chatWithRetry() {
  return exponentialBackoff(async () => {
    return await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
  });
}

// =============================================================================
// RATE LIMIT HEADER MONITORING
// =============================================================================

interface RateLimitInfo {
  limitRequests: number;
  remainingRequests: number;
  resetRequests: string;
  limitTokens: number;
  remainingTokens: number;
  resetTokens: string;
}

async function checkRateLimits(): Promise<RateLimitInfo> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    }),
  });

  const rateLimits: RateLimitInfo = {
    limitRequests: parseInt(response.headers.get('x-ratelimit-limit-requests') || '0'),
    remainingRequests: parseInt(response.headers.get('x-ratelimit-remaining-requests') || '0'),
    resetRequests: response.headers.get('x-ratelimit-reset-requests') || '',
    limitTokens: parseInt(response.headers.get('x-ratelimit-limit-tokens') || '0'),
    remainingTokens: parseInt(response.headers.get('x-ratelimit-remaining-tokens') || '0'),
    resetTokens: response.headers.get('x-ratelimit-reset-tokens') || '',
  };

  console.log('Rate limits:', rateLimits);

  return rateLimits;
}

// =============================================================================
// REQUEST QUEUE
// =============================================================================

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute: number;
  private lastRequestTime: number = 0;

  constructor(requestsPerMinute: number) {
    this.requestsPerMinute = requestsPerMinute;
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const minInterval = 60000 / this.requestsPerMinute;
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve =>
          setTimeout(resolve, minInterval - timeSinceLastRequest)
        );
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }

    this.processing = false;
  }
}

// Usage example
const queue = new RequestQueue(50); // 50 requests per minute

async function queuedRequest() {
  return queue.enqueue(async () => {
    return await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
  });
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

class CircuitBreaker {
  private failures = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private successThreshold: number = 2,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }

      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        this.successCount++;

        if (this.successCount >= this.successThreshold) {
          this.state = 'CLOSED';
          this.failures = 0;
          this.successCount = 0;
        }
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error('Circuit breaker tripped to OPEN');
      }

      throw error;
    }
  }

  getState() {
    return this.state;
  }
}

// Usage example
const breaker = new CircuitBreaker(5, 2, 60000);

async function protectedRequest() {
  return breaker.execute(async () => {
    return await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
  });
}

// =============================================================================
// TOKEN BUCKET ALGORITHM
// =============================================================================

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async consume(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Wait until enough tokens are available
    const deficit = tokens - this.tokens;
    const waitTime = (deficit / this.refillRate) * 1000;

    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.tokens = 0;
  }
}

// Usage example
const bucket = new TokenBucket(10, 2); // 10 tokens, refill 2 per second

async function rateLimitedRequest() {
  await bucket.consume(1);

  return await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
}

// =============================================================================
// COMBINED PRODUCTION PATTERN
// =============================================================================

class RateLimitedClient {
  private queue: RequestQueue;
  private breaker: CircuitBreaker;
  private bucket: TokenBucket;

  constructor() {
    this.queue = new RequestQueue(50); // 50 RPM
    this.breaker = new CircuitBreaker(5, 2, 60000);
    this.bucket = new TokenBucket(50, 1); // 50 tokens, 1 per second
  }

  async chatCompletion(params: any, maxRetries: number = 3) {
    return this.queue.enqueue(async () => {
      return exponentialBackoff(async () => {
        return this.breaker.execute(async () => {
          await this.bucket.consume(1);

          return await openai.chat.completions.create(params);
        });
      }, maxRetries);
    });
  }
}

// Usage
const client = new RateLimitedClient();

async function productionRequest() {
  return client.chatCompletion({
    model: 'gpt-5',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
}

// =============================================================================
// MONITORING AND LOGGING
// =============================================================================

interface RequestLog {
  timestamp: string;
  success: boolean;
  retries: number;
  error?: string;
  latency: number;
}

async function monitoredRequest(): Promise<RequestLog> {
  const startTime = Date.now();
  let retries = 0;

  try {
    const result = await exponentialBackoff(async () => {
      retries++;
      return await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Hello!' }],
      });
    });

    const latency = Date.now() - startTime;

    return {
      timestamp: new Date().toISOString(),
      success: true,
      retries: retries - 1,
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;

    return {
      timestamp: new Date().toISOString(),
      success: false,
      retries: retries - 1,
      error: error.message,
      latency,
    };
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Rate Limit Handling Examples ===\n');

  // Example 1: Exponential backoff
  console.log('1. Exponential Backoff:');
  await chatWithRetry();
  console.log('Request successful with retry logic');
  console.log();

  // Example 2: Check rate limits
  console.log('2. Check Rate Limits:');
  await checkRateLimits();
  console.log();

  // Example 3: Production pattern
  console.log('3. Production Rate-Limited Client:');
  await productionRequest();
  console.log('Request processed through production pipeline');
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  exponentialBackoff,
  checkRateLimits,
  RequestQueue,
  CircuitBreaker,
  TokenBucket,
  RateLimitedClient,
  monitoredRequest,
};
