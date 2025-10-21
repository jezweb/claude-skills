/**
 * Queue Consumer with Exponential Backoff Retry
 *
 * Use when: Calling rate-limited APIs or handling temporary failures
 *
 * Strategy:
 * - Retry with increasing delays: 1m → 2m → 4m → 8m → ...
 * - Different delays for different error types
 * - Max delay cap to prevent excessive waits
 *
 * Setup:
 * 1. Create queue: npx wrangler queues create api-tasks
 * 2. Create DLQ: npx wrangler queues create api-tasks-dlq
 * 3. Configure consumer with higher max_retries (e.g., 10)
 * 4. Deploy: npm run deploy
 */

type Env = {
  DB: D1Database;
  API_KEY: string;
};

export default {
  async queue(
    batch: MessageBatch,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Processing batch of ${batch.messages.length} messages`);

    for (const message of batch.messages) {
      try {
        await processWithRetry(message, env);
        message.ack();
      } catch (error) {
        await handleError(message, error);
      }
    }
  },
};

/**
 * Process message with smart retry logic
 */
async function processWithRetry(message: Message, env: Env) {
  const { type, data } = message.body;

  console.log(`Processing ${type} (attempt ${message.attempts})`);

  switch (type) {
    case 'call-api':
      await callExternalAPI(data, message.attempts);
      break;

    case 'process-webhook':
      await processWebhook(data);
      break;

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

/**
 * Call external API with retry handling
 */
async function callExternalAPI(data: any, attempts: number) {
  const response = await fetch(data.url, {
    method: data.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...data.headers,
    },
    body: JSON.stringify(data.payload),
  });

  // Handle different response codes
  if (response.ok) {
    console.log(`✅ API call successful`);
    return await response.json();
  }

  // Rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const delaySeconds = retryAfter ? parseInt(retryAfter) : undefined;

    throw new RateLimitError('Rate limited', delaySeconds, attempts);
  }

  // Server errors (500-599) - retry
  if (response.status >= 500) {
    throw new ServerError(`Server error: ${response.status}`, attempts);
  }

  // Client errors (400-499) - don't retry
  if (response.status >= 400) {
    const error = await response.text();
    throw new ClientError(`Client error: ${error}`);
  }

  throw new Error(`Unexpected response: ${response.status}`);
}

/**
 * Process webhook with timeout
 */
async function processWebhook(data: any) {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`Webhook processed: ${data.id}`);
}

/**
 * Handle errors with appropriate retry strategy
 */
async function handleError(message: Message, error: any) {
  console.error(`Error processing message ${message.id}:`, error);

  // Rate limit error - use suggested delay or exponential backoff
  if (error instanceof RateLimitError) {
    const delaySeconds = error.suggestedDelay || calculateExponentialBackoff(
      message.attempts,
      60, // Base delay: 1 minute
      3600 // Max delay: 1 hour
    );

    console.log(`⏰ Rate limited. Retrying in ${delaySeconds}s (attempt ${message.attempts})`);

    message.retry({ delaySeconds });
    return;
  }

  // Server error - exponential backoff
  if (error instanceof ServerError) {
    const delaySeconds = calculateExponentialBackoff(
      message.attempts,
      30, // Base delay: 30 seconds
      1800 // Max delay: 30 minutes
    );

    console.log(`🔄 Server error. Retrying in ${delaySeconds}s (attempt ${message.attempts})`);

    message.retry({ delaySeconds });
    return;
  }

  // Client error - don't retry (will go to DLQ)
  if (error instanceof ClientError) {
    console.error(`❌ Client error. Not retrying: ${error.message}`);
    // Don't call ack() or retry() - will fail and go to DLQ
    return;
  }

  // Unknown error - retry with exponential backoff
  const delaySeconds = calculateExponentialBackoff(
    message.attempts,
    60, // Base delay: 1 minute
    7200 // Max delay: 2 hours
  );

  console.log(`⚠️ Unknown error. Retrying in ${delaySeconds}s (attempt ${message.attempts})`);

  message.retry({ delaySeconds });
}

/**
 * Calculate exponential backoff delay
 *
 * Formula: min(baseDelay * 2^(attempts-1), maxDelay)
 *
 * Example (baseDelay=60, maxDelay=3600):
 * - Attempt 1: 60s (1 min)
 * - Attempt 2: 120s (2 min)
 * - Attempt 3: 240s (4 min)
 * - Attempt 4: 480s (8 min)
 * - Attempt 5: 960s (16 min)
 * - Attempt 6: 1920s (32 min)
 * - Attempt 7+: 3600s (1 hour) - capped
 */
function calculateExponentialBackoff(
  attempts: number,
  baseDelay: number,
  maxDelay: number
): number {
  const delay = baseDelay * Math.pow(2, attempts - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Calculate jittered backoff (prevents thundering herd)
 *
 * Adds randomness to delay to spread out retries
 */
function calculateJitteredBackoff(
  attempts: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempts - 1);
  const delay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: ±25% randomness
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);

  return Math.floor(delay + jitter);
}

// ============================================================================
// Custom Error Classes
// ============================================================================

class RateLimitError extends Error {
  suggestedDelay?: number;
  attempts: number;

  constructor(message: string, suggestedDelay?: number, attempts: number = 1) {
    super(message);
    this.name = 'RateLimitError';
    this.suggestedDelay = suggestedDelay;
    this.attempts = attempts;
  }
}

class ServerError extends Error {
  attempts: number;

  constructor(message: string, attempts: number = 1) {
    super(message);
    this.name = 'ServerError';
    this.attempts = attempts;
  }
}

class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
  }
}
