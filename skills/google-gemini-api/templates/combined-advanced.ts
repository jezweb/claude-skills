/**
 * Google Gemini API - Combined Advanced Features Example
 *
 * Demonstrates how to use all Phase 2 advanced features together:
 * - Context Caching (cost optimization)
 * - Code Execution (computational tasks)
 * - Grounding with Google Search (real-time information)
 *
 * Use Case: Financial analysis chatbot that:
 * 1. Caches financial data and analysis instructions
 * 2. Uses code execution for calculations and data analysis
 * 3. Uses grounding for current market information
 *
 * Requirements:
 * - @google/genai@1.27.0+
 * - GEMINI_API_KEY environment variable
 * - Google Cloud project (for grounding)
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function financialAnalysisChatbot() {
  console.log('=== Combined Advanced Features: Financial Analysis Chatbot ===\n');

  // Step 1: Create cache with financial data and analysis instructions
  console.log('Step 1: Creating cache with financial data...');

  const financialData = `
    Company Financial Data (Q1-Q4 2024):

    Revenue:
    Q1: $2.5M
    Q2: $3.1M
    Q3: $2.9M
    Q4: $3.8M

    Expenses:
    Q1: $1.8M
    Q2: $2.2M
    Q3: $2.1M
    Q4: $2.6M

    Customer Acquisition:
    Q1: 1,200 new customers
    Q2: 1,500 new customers
    Q3: 1,350 new customers
    Q4: 1,800 new customers
  `.trim();

  const cache = await ai.caches.create({
    model: 'gemini-2.5-flash-001', // Explicit version required for caching
    config: {
      displayName: 'financial-analysis-cache',
      systemInstruction: `
        You are a financial analyst chatbot. You have access to:
        1. Company financial data (cached)
        2. Code execution for calculations
        3. Google Search for current market information

        Provide detailed, accurate financial analysis.
      `,
      contents: financialData,
      ttl: '3600s', // Cache for 1 hour
    },
  });

  console.log(`✓ Cache created: ${cache.name}\n`);

  // Step 2: Create chat with all advanced features enabled
  console.log('Step 2: Creating chat with code execution and grounding...\n');

  const chat = await ai.chats.create({
    model: cache.name, // Use cached context
    config: {
      tools: [
        { codeExecution: {} }, // Enable code execution
        { googleSearch: {} }, // Enable grounding
      ],
    },
  });

  // Query 1: Analysis requiring code execution (uses cache)
  console.log('===========================================');
  console.log('Query 1: Calculate year-over-year growth');
  console.log('===========================================\n');

  let response = await chat.sendMessage(`
    Calculate the following for 2024:
    1. Total annual revenue
    2. Total annual expenses
    3. Net profit
    4. Profit margin percentage
    5. Quarter-over-quarter revenue growth rates

    Use code to perform these calculations.
  `);

  console.log('📊 Financial Analysis:\n');
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    }
    if (part.executableCode) {
      console.log('\n💻 Calculations Code:');
      console.log(part.executableCode.code);
    }
    if (part.codeExecutionResult) {
      console.log('\n📈 Results:');
      console.log(part.codeExecutionResult.output);
    }
  }

  // Query 2: Current market information (uses grounding)
  console.log('\n\n===========================================');
  console.log('Query 2: Compare with industry benchmarks');
  console.log('===========================================\n');

  response = await chat.sendMessage(`
    What are the current industry benchmarks for SaaS companies in terms of:
    1. Profit margins
    2. Customer acquisition cost trends
    3. Growth rate expectations

    Use current market data to provide context.
  `);

  console.log('📰 Market Context:\n');
  console.log(response.text);

  if (response.candidates[0].groundingMetadata) {
    console.log('\n✓ Used current market data from:');
    const sources = response.candidates[0].groundingMetadata.webPages || [];
    sources.slice(0, 3).forEach((source, i) => {
      console.log(`${i + 1}. ${source.title}`);
      console.log(`   ${source.url}`);
    });
  }

  // Query 3: Combined analysis (uses cache + code + grounding)
  console.log('\n\n===========================================');
  console.log('Query 3: Comprehensive recommendation');
  console.log('===========================================\n');

  response = await chat.sendMessage(`
    Based on:
    1. Our company's financial performance (from cached data)
    2. Calculated growth metrics (using code execution)
    3. Current industry trends (from search)

    Provide a comprehensive recommendation for Q1 2025 strategy.
  `);

  console.log('💡 Strategic Recommendation:\n');
  console.log(response.text);

  // Show which features were used
  console.log('\n\n📋 Features Used in This Query:');
  let featuresUsed = [];

  // Check for code execution
  const hasCode = response.candidates[0].content.parts.some(
    (part) => part.executableCode
  );
  if (hasCode) featuresUsed.push('✓ Code Execution');

  // Check for grounding
  if (response.candidates[0].groundingMetadata) {
    featuresUsed.push('✓ Google Search Grounding');
  }

  // Cache is always used when we use cache.name as model
  featuresUsed.push('✓ Context Caching');

  featuresUsed.forEach((feature) => console.log(feature));

  // Clean up
  console.log('\n\nStep 3: Cleaning up...');
  await ai.caches.delete({ name: cache.name });
  console.log('✓ Cache deleted');

  console.log('\n=== Financial Analysis Chatbot Complete ===');
}

async function researchAssistant() {
  console.log('\n\n=== Combined Advanced Features: Research Assistant ===\n');

  // Create cache with research paper
  console.log('Step 1: Caching research paper...');

  const researchPaper = `
    Title: Climate Change Impact on Arctic Ecosystems (2024)

    Abstract:
    This study examines the effects of climate change on Arctic ecosystems
    over the past decade...

    [Imagine full research paper content here]

    Key Findings:
    - Temperature increase of 2.3°C in Arctic regions
    - 15% reduction in sea ice coverage
    - Migration pattern changes in polar species
    - etc.
  `.trim();

  const cache = await ai.caches.create({
    model: 'gemini-2.5-flash-001',
    config: {
      displayName: 'research-paper-cache',
      systemInstruction: 'You are a research assistant. Analyze papers and provide insights.',
      contents: researchPaper,
      ttl: '1800s', // 30 minutes
    },
  });

  console.log(`✓ Cache created\n`);

  // Create chat with all tools
  const chat = await ai.chats.create({
    model: cache.name,
    config: {
      tools: [{ codeExecution: {} }, { googleSearch: {} }],
    },
  });

  // Query combining all features
  console.log('Query: Comprehensive climate analysis\n');

  const response = await chat.sendMessage(`
    1. Calculate the average temperature change per year from the data in the paper (use code)
    2. Find the latest climate predictions for the next decade (use search)
    3. Synthesize findings from both sources into a summary
  `);

  console.log('Response:\n');
  for (const part of response.candidates[0].content.parts) {
    if (part.text) console.log(part.text);
    if (part.executableCode) {
      console.log('\nCode:');
      console.log(part.executableCode.code);
    }
    if (part.codeExecutionResult) {
      console.log('\nResults:');
      console.log(part.codeExecutionResult.output);
    }
  }

  if (response.candidates[0].groundingMetadata) {
    console.log('\nSources:');
    const sources = response.candidates[0].groundingMetadata.webPages || [];
    sources.slice(0, 2).forEach((s) => console.log(`- ${s.title}`));
  }

  // Clean up
  await ai.caches.delete({ name: cache.name });

  console.log('\n=== Research Assistant Complete ===');
}

// Run examples
async function main() {
  await financialAnalysisChatbot();
  await researchAssistant();

  console.log('\n\n✅ All advanced features demonstrated!');
  console.log('\nKey Takeaways:');
  console.log('- Context Caching: Saves costs by reusing large context');
  console.log('- Code Execution: Enables computational analysis');
  console.log('- Grounding: Provides real-time, fact-checked information');
  console.log('- Combined: Creates powerful, cost-effective AI applications');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
