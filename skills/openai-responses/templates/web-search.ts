/**
 * Web Search Example
 *
 * Demonstrates real-time web search for current information.
 * No cutoff date limitations.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicWebSearch() {
  console.log('=== Basic Web Search ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What are the latest updates on GPT-5?',
    tools: [{ type: 'web_search' }],
  });

  console.log('Answer:', response.output_text);

  // Inspect search results
  response.output.forEach((item) => {
    if (item.type === 'web_search_call') {
      console.log('\nSearch query:', item.query);
      console.log('Sources:', item.results.length);

      item.results.forEach((result, idx) => {
        console.log(`\nSource ${idx + 1}:`);
        console.log('Title:', result.title);
        console.log('URL:', result.url);
        console.log('Snippet:', result.snippet);
      });
    }
  });
}

async function currentEvents() {
  console.log('=== Current Events ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What are the top tech news stories today?',
    tools: [{ type: 'web_search' }],
  });

  console.log('News summary:', response.output_text);
}

async function factChecking() {
  console.log('=== Fact Checking ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Is it true that GPT-5 was released in 2025? Find recent sources.',
    tools: [{ type: 'web_search' }],
  });

  console.log('Fact check:', response.output_text);

  // Get source citations
  response.output.forEach((item) => {
    if (item.type === 'web_search_call') {
      console.log('\nSources:');
      item.results.forEach((result) => {
        console.log('-', result.url);
      });
    }
  });
}

async function researchQuestion() {
  console.log('=== Research Question ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What are the pros and cons of using Cloudflare Workers for serverless applications?',
    tools: [{ type: 'web_search' }],
  });

  console.log('Research findings:', response.output_text);
}

async function conversationalWebSearch() {
  console.log('=== Conversational Web Search ===\n');

  // Create conversation
  const conv = await openai.conversations.create();

  // First question
  const response1 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'What is the current price of Bitcoin?',
    tools: [{ type: 'web_search' }],
  });

  console.log('Q1:', response1.output_text);

  // Follow-up question (model remembers previous answer)
  const response2 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'How has it changed in the last 24 hours?',
    tools: [{ type: 'web_search' }],
  });

  console.log('Q2:', response2.output_text);
}

async function comparisonResearch() {
  console.log('=== Comparison Research ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Compare the features and pricing of OpenAI GPT-5 vs Anthropic Claude 3.5 Sonnet',
    tools: [{ type: 'web_search' }],
  });

  console.log('Comparison:', response.output_text);
}

async function localInformation() {
  console.log('=== Local Information ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What are the best restaurants in San Francisco for Italian food?',
    tools: [{ type: 'web_search' }],
  });

  console.log('Recommendations:', response.output_text);
}

async function productReviews() {
  console.log('=== Product Reviews ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What are people saying about the iPhone 16 Pro? Find recent reviews.',
    tools: [{ type: 'web_search' }],
  });

  console.log('Review summary:', response.output_text);
}

async function combinedTools() {
  console.log('=== Combined Tools (Web Search + Code Interpreter) ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Find the current Bitcoin price and calculate what $1000 would be worth',
    tools: [
      { type: 'web_search' },
      { type: 'code_interpreter' },
    ],
  });

  console.log('Answer:', response.output_text);

  // Model uses web search to get price, then code interpreter to calculate
}

async function webSearchWithFileSearch() {
  console.log('=== Web Search + File Search ===\n');

  // Upload internal document
  const file = await openai.files.create({
    file: Buffer.from('Internal policy: Always check external sources for pricing info'),
    purpose: 'assistants',
  });

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What is our policy on competitor pricing research?',
    tools: [
      { type: 'file_search', file_ids: [file.id] },
      { type: 'web_search' },
    ],
  });

  console.log('Answer:', response.output_text);
  // Model checks internal policy, then searches web if needed
}

// Run examples
basicWebSearch();
// currentEvents();
// factChecking();
// researchQuestion();
// conversationalWebSearch();
// comparisonResearch();
