/**
 * Google Gemini API - Code Execution Example
 *
 * Demonstrates how to enable code execution so the model can generate
 * and run Python code to solve computational problems.
 *
 * Features:
 * - Basic code execution
 * - Data analysis with code
 * - Chart generation
 * - Error handling for failed execution
 *
 * Requirements:
 * - @google/genai@1.27.0+
 * - GEMINI_API_KEY environment variable
 *
 * Note: Code Execution is NOT available on gemini-2.5-flash-lite
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function basicCodeExecution() {
  console.log('=== Basic Code Execution Example ===\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents:
      'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.',
    config: {
      tools: [{ codeExecution: {} }],
    },
  });

  // Parse response parts
  console.log('Response parts:\n');
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log('📝 Text:', part.text);
    }
    if (part.executableCode) {
      console.log('\n💻 Generated Code:');
      console.log(part.executableCode.code);
    }
    if (part.codeExecutionResult) {
      console.log('\n✅ Execution Output:');
      console.log(part.codeExecutionResult.output);
    }
  }

  console.log('\n=== Basic Code Execution Complete ===');
}

async function dataAnalysisExample() {
  console.log('\n=== Data Analysis Example ===\n');

  const prompt = `
    Analyze this sales data and calculate:
    1. Total revenue
    2. Average sale price
    3. Best-selling month
    4. Month with highest revenue

    Use pandas or numpy for analysis.

    Data (CSV format):
    month,sales,revenue
    Jan,150,45000
    Feb,200,62000
    Mar,175,53000
    Apr,220,68000
    May,190,58000
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ codeExecution: {} }],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log('📊 Analysis:', part.text);
    }
    if (part.executableCode) {
      console.log('\n💻 Analysis Code:');
      console.log(part.executableCode.code);
    }
    if (part.codeExecutionResult) {
      console.log('\n📈 Results:');
      console.log(part.codeExecutionResult.output);
    }
  }

  console.log('\n=== Data Analysis Complete ===');
}

async function chartGenerationExample() {
  console.log('\n=== Chart Generation Example ===\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents:
      'Create a bar chart showing the distribution of prime numbers under 100 by their last digit. Generate the chart code and describe any patterns you see.',
    config: {
      tools: [{ codeExecution: {} }],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log('📊 Chart Description:', part.text);
    }
    if (part.executableCode) {
      console.log('\n📉 Chart Code:');
      console.log(part.executableCode.code);
    }
    if (part.codeExecutionResult) {
      console.log('\n✓ Chart generated');
      // Note: Image data would be in output
    }
  }

  console.log('\n=== Chart Generation Complete ===');
}

async function chatWithCodeExecution() {
  console.log('\n=== Chat with Code Execution Example ===\n');

  const chat = await ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      tools: [{ codeExecution: {} }],
    },
  });

  // First message
  console.log('User: I have a math question for you.');
  let response = await chat.sendMessage('I have a math question for you.');
  console.log(`Assistant: ${response.text}\n`);

  // Second message (will generate and execute code)
  console.log('User: Calculate the Fibonacci sequence up to the 20th number and sum them.');
  response = await chat.sendMessage(
    'Calculate the Fibonacci sequence up to the 20th number and sum them.'
  );

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log('Assistant:', part.text);
    }
    if (part.executableCode) {
      console.log('\nCode:');
      console.log(part.executableCode.code);
    }
    if (part.codeExecutionResult) {
      console.log('\nOutput:');
      console.log(part.codeExecutionResult.output);
    }
  }

  console.log('\n=== Chat with Code Execution Complete ===');
}

async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Write code that divides by zero and see what happens',
    config: {
      tools: [{ codeExecution: {} }],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.codeExecutionResult) {
      if (part.codeExecutionResult.outcome === 'OUTCOME_FAILED') {
        console.error('❌ Code execution failed:');
        console.error(part.codeExecutionResult.output);
      } else {
        console.log('✅ Success:');
        console.log(part.codeExecutionResult.output);
      }
    }
  }

  console.log('\n=== Error Handling Example Complete ===');
}

// Run all examples
async function main() {
  await basicCodeExecution();
  await dataAnalysisExample();
  await chartGenerationExample();
  await chatWithCodeExecution();
  await errorHandlingExample();
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
