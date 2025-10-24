import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Example 1: Basic prompt caching with system prompt
async function cacheSystemPrompt() {
  // Simulate a large system prompt (must be >= 1024 tokens for caching)
  const largeSystemPrompt = `
You are an expert software architect with deep knowledge of:
- Microservices architecture and design patterns
- Cloud-native applications (AWS, GCP, Azure)
- Containerization (Docker, Kubernetes)
- CI/CD pipelines and DevOps practices
- Database design (SQL and NoSQL)
- API design (REST, GraphQL, gRPC)
- Security best practices and compliance
- Performance optimization and scalability
- Monitoring and observability (Prometheus, Grafana)
- Event-driven architectures and message queues

${' '.repeat(10000)} // Padding to ensure > 1024 tokens

Always provide detailed, production-ready advice with code examples.
`.trim();

  // First request - creates cache
  const message1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: largeSystemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: 'How do I design a scalable authentication system?',
      },
    ],
  });

  console.log('=== First Request (Cache Creation) ===');
  console.log('Cache creation tokens:', message1.usage.cache_creation_input_tokens);
  console.log('Cache read tokens:', message1.usage.cache_read_input_tokens);
  console.log('Input tokens:', message1.usage.input_tokens);
  console.log('Output tokens:', message1.usage.output_tokens);

  // Second request - hits cache (within 5 minutes)
  const message2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: largeSystemPrompt, // MUST be identical to hit cache
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: 'What about rate limiting strategies?',
      },
    ],
  });

  console.log('\n=== Second Request (Cache Hit) ===');
  console.log('Cache creation tokens:', message2.usage.cache_creation_input_tokens);
  console.log('Cache read tokens:', message2.usage.cache_read_input_tokens);
  console.log('Input tokens:', message2.usage.input_tokens);
  console.log('Output tokens:', message2.usage.output_tokens);
  console.log('Savings: ~90% on cached content');
}

// Example 2: Caching large documents
async function cacheLargeDocument() {
  // Read a large document (e.g., documentation, codebase)
  const largeDocument = fs.readFileSync('./large-document.txt', 'utf-8');
  // Ensure document is >= 1024 tokens

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze the following documentation:',
          },
          {
            type: 'text',
            text: largeDocument,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: 'What are the main API endpoints?',
          },
        ],
      },
    ],
  });

  console.log('=== Document Analysis with Caching ===');
  console.log('Cache creation:', message.usage.cache_creation_input_tokens);
  console.log('Cache read:', message.usage.cache_read_input_tokens);
}

// Example 3: Multi-turn conversation with caching (chatbot pattern)
async function multiTurnCachingConversation() {
  const systemInstructions = `
You are a customer support AI for TechCorp, specializing in:
- Product troubleshooting
- Account management
- Billing inquiries
- Technical specifications

${' '.repeat(10000)} // Ensure > 1024 tokens

Knowledge Base:
- Product A: Cloud storage service
- Product B: Analytics platform
- Product C: AI API service

Always be polite, helpful, and provide actionable solutions.
`.trim();

  // Conversation state
  const messages: Anthropic.MessageParam[] = [];

  // Turn 1
  messages.push({
    role: 'user',
    content: 'How do I reset my password?',
  });

  const response1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: systemInstructions,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  });

  const text1 = response1.content.find(b => b.type === 'text');
  if (text1 && text1.type === 'text') {
    messages.push({ role: 'assistant', content: text1.text });
    console.log('Turn 1 - Cache creation:', response1.usage.cache_creation_input_tokens);
  }

  // Turn 2 - cache hit
  messages.push({
    role: 'user',
    content: 'What about two-factor authentication?',
  });

  const response2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: systemInstructions,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  });

  console.log('Turn 2 - Cache read:', response2.usage.cache_read_input_tokens);
  console.log('Turn 2 - New input tokens:', response2.usage.input_tokens);
}

// Example 4: Caching with conversation history
async function cacheConversationHistory() {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Tell me about TypeScript' },
    { role: 'assistant', content: 'TypeScript is a superset of JavaScript...' },
    { role: 'user', content: 'What about interfaces?' },
    { role: 'assistant', content: 'Interfaces in TypeScript define contracts...' },
    { role: 'user', content: 'Can you give examples?' },
  ];

  // Cache the conversation history
  const messagesWithCache: Anthropic.MessageParam[] = messages.slice(0, -1).map((msg, idx) => {
    if (idx === messages.length - 2) {
      // Cache the last assistant message
      return {
        ...msg,
        content: [
          {
            type: 'text',
            text: typeof msg.content === 'string' ? msg.content : '',
            cache_control: { type: 'ephemeral' },
          },
        ],
      };
    }
    return msg;
  });

  messagesWithCache.push(messages[messages.length - 1]);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: messagesWithCache,
  });

  console.log('=== Caching Conversation History ===');
  console.log('Cache usage:', response.usage);
}

// Example 5: Cost comparison calculator
function calculateCachingSavings(inputTokens: number, outputTokens: number, turnCount: number) {
  const inputCostPerMTok = 3; // $3 per million tokens
  const outputCostPerMTok = 15; // $15 per million tokens
  const cacheCostPerMTok = 3.75; // $3.75 per million tokens (write)
  const cacheReadCostPerMTok = 0.3; // $0.30 per million tokens (read)

  // Without caching
  const costWithoutCache =
    (inputTokens / 1_000_000) * inputCostPerMTok * turnCount +
    (outputTokens / 1_000_000) * outputCostPerMTok * turnCount;

  // With caching
  const cacheWriteCost = (inputTokens / 1_000_000) * cacheCostPerMTok; // First request
  const cacheReadCost = (inputTokens / 1_000_000) * cacheReadCostPerMTok * (turnCount - 1); // Subsequent
  const outputCost = (outputTokens / 1_000_000) * outputCostPerMTok * turnCount;
  const costWithCache = cacheWriteCost + cacheReadCost + outputCost;

  const savings = costWithoutCache - costWithCache;
  const savingsPercent = (savings / costWithoutCache) * 100;

  console.log('\n=== Cost Comparison ===');
  console.log(`Input tokens: ${inputTokens}, Output tokens: ${outputTokens}, Turns: ${turnCount}`);
  console.log(`Without caching: $${costWithoutCache.toFixed(4)}`);
  console.log(`With caching: $${costWithCache.toFixed(4)}`);
  console.log(`Savings: $${savings.toFixed(4)} (${savingsPercent.toFixed(1)}%)`);
}

// Run examples
if (require.main === module) {
  cacheSystemPrompt()
    .then(() => multiTurnCachingConversation())
    .then(() => {
      // Example cost calculation
      calculateCachingSavings(100000, 5000, 10); // 100k input, 5k output, 10 turns
    })
    .catch(console.error);
}

export {
  cacheSystemPrompt,
  cacheLargeDocument,
  multiTurnCachingConversation,
  cacheConversationHistory,
  calculateCachingSavings,
};
