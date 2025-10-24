import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Example 1: Basic error handling
async function basicErrorHandling(prompt: string) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    return message;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`API Error [${error.status}]:`, error.message);
      console.error('Error type:', error.type);
      console.error('Error details:', error.error);

      // Handle specific error types
      switch (error.status) {
        case 400:
          console.error('Invalid request. Check your parameters.');
          break;
        case 401:
          console.error('Authentication failed. Check your API key.');
          break;
        case 403:
          console.error('Permission denied. Check your account tier.');
          break;
        case 404:
          console.error('Resource not found. Check the endpoint.');
          break;
        case 429:
          console.error('Rate limit exceeded. Implement retry logic.');
          break;
        case 500:
          console.error('Server error. Retry with exponential backoff.');
          break;
        case 529:
          console.error('API overloaded. Retry later.');
          break;
        default:
          console.error('Unexpected error occurred.');
      }
    } else {
      console.error('Non-API error:', error);
    }

    throw error;
  }
}

// Example 2: Rate limit handler with retry
async function handleRateLimits(
  requestFn: () => Promise<any>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error instanceof Anthropic.APIError && error.status === 429) {
        // Check retry-after header
        const retryAfter = error.response?.headers?.['retry-after'];
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : baseDelay * Math.pow(2, attempt);

        if (attempt < maxRetries - 1) {
          console.warn(`Rate limited. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

// Example 3: Comprehensive error handler
class APIErrorHandler {
  private maxRetries: number;
  private baseDelay: number;
  private onError?: (error: Error) => void;

  constructor(options: {
    maxRetries?: number;
    baseDelay?: number;
    onError?: (error: Error) => void;
  } = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.onError = options.onError;
  }

  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (this.onError) {
          this.onError(error);
        }

        if (error instanceof Anthropic.APIError) {
          if (this.shouldRetry(error) && attempt < this.maxRetries - 1) {
            const delay = this.calculateDelay(error, attempt);
            console.warn(`Retrying after ${delay}ms... (${attempt + 1}/${this.maxRetries})`);
            await this.sleep(delay);
            continue;
          }
        }

        throw this.enhanceError(error);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private shouldRetry(error: Anthropic.APIError): boolean {
    // Retry on rate limits, server errors, and overload
    return error.status === 429 || error.status === 500 || error.status === 529;
  }

  private calculateDelay(error: Anthropic.APIError, attempt: number): number {
    // Use retry-after header if available
    const retryAfter = error.response?.headers?.['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }

    // Exponential backoff
    return this.baseDelay * Math.pow(2, attempt);
  }

  private enhanceError(error: any): Error {
    if (error instanceof Anthropic.APIError) {
      const enhancedError = new Error(`Claude API Error: ${error.message}`);
      (enhancedError as any).originalError = error;
      (enhancedError as any).status = error.status;
      (enhancedError as any).type = error.type;
      return enhancedError;
    }

    return error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example 4: Streaming error handling
async function streamWithErrorHandling(prompt: string) {
  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let hasError = false;

    stream.on('error', (error) => {
      hasError = true;
      console.error('Stream error:', error);

      if (error instanceof Anthropic.APIError) {
        console.error(`Status: ${error.status}`);
        console.error(`Type: ${error.type}`);
      }

      // Implement fallback or retry logic here
    });

    stream.on('abort', (error) => {
      console.warn('Stream aborted:', error);
    });

    stream.on('text', (text) => {
      if (!hasError) {
        process.stdout.write(text);
      }
    });

    await stream.finalMessage();

    if (hasError) {
      throw new Error('Stream completed with errors');
    }
  } catch (error) {
    console.error('Failed to complete stream:', error);
    throw error;
  }
}

// Example 5: Validation errors
function validateRequest(params: {
  messages: any[];
  max_tokens?: number;
  model?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(params.messages) || params.messages.length === 0) {
    errors.push('Messages must be a non-empty array');
  }

  if (params.max_tokens && (params.max_tokens < 1 || params.max_tokens > 8192)) {
    errors.push('max_tokens must be between 1 and 8192');
  }

  if (params.model && !params.model.startsWith('claude-')) {
    errors.push('Invalid model name');
  }

  for (const [index, message] of params.messages.entries()) {
    if (!message.role || !['user', 'assistant'].includes(message.role)) {
      errors.push(`Message ${index}: Invalid role. Must be "user" or "assistant"`);
    }

    if (!message.content) {
      errors.push(`Message ${index}: Missing content`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Example 6: Circuit breaker pattern
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(options: { threshold?: number; timeout?: number } = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
  }

  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        console.log('Circuit breaker: Transitioning to half-open');
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open. Service unavailable.');
      }
    }

    try {
      const result = await requestFn();

      // Success - reset failures
      if (this.state === 'half-open') {
        console.log('Circuit breaker: Transitioning to closed');
        this.state = 'closed';
      }
      this.failures = 0;

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        console.error(`Circuit breaker: Opening after ${this.failures} failures`);
        this.state = 'open';
      }

      throw error;
    }
  }

  getState(): { state: string; failures: number } {
    return {
      state: this.state,
      failures: this.failures,
    };
  }
}

// Example 7: Usage with all patterns
async function robustAPICall(prompt: string) {
  const errorHandler = new APIErrorHandler({
    maxRetries: 3,
    baseDelay: 1000,
    onError: (error) => {
      console.error('Error logged:', error);
      // Could send to monitoring service here
    },
  });

  const circuitBreaker = new CircuitBreaker({
    threshold: 5,
    timeout: 60000,
  });

  try {
    const validation = validateRequest({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      model: 'claude-sonnet-4-5-20250929',
    });

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const result = await circuitBreaker.execute(() =>
      errorHandler.execute(() =>
        anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        })
      )
    );

    return result;
  } catch (error) {
    console.error('Robust API call failed:', error);
    console.error('Circuit breaker state:', circuitBreaker.getState());
    throw error;
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Error Handling Examples ===\n');

  // Test basic error handling
  basicErrorHandling('Hello, Claude!')
    .then(() => {
      console.log('\n=== Testing Rate Limit Handler ===\n');
      return handleRateLimits(() =>
        anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [{ role: 'user', content: 'Test message' }],
        })
      );
    })
    .then(() => {
      console.log('\n=== Testing Robust API Call ===\n');
      return robustAPICall('What is 2+2?');
    })
    .catch(console.error);
}

export {
  basicErrorHandling,
  handleRateLimits,
  APIErrorHandler,
  streamWithErrorHandling,
  validateRequest,
  CircuitBreaker,
  robustAPICall,
};
