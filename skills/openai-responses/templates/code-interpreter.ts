/**
 * Code Interpreter Example
 *
 * Demonstrates server-side Python code execution for data analysis,
 * calculations, and visualizations.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicCalculation() {
  console.log('=== Basic Calculation ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Calculate the mean, median, and mode of: 10, 20, 30, 40, 50',
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('Response:', response.output_text);

  // Inspect code execution
  response.output.forEach((item) => {
    if (item.type === 'code_interpreter_call') {
      console.log('\nCode executed:');
      console.log(item.input);
      console.log('\nResult:', item.output);
    }
  });
}

async function dataAnalysis() {
  console.log('=== Data Analysis ===\n');

  const salesData = [
    { month: 'Jan', revenue: 10000 },
    { month: 'Feb', revenue: 12000 },
    { month: 'Mar', revenue: 11500 },
    { month: 'Apr', revenue: 13000 },
    { month: 'May', revenue: 14500 },
    { month: 'Jun', revenue: 16000 },
  ];

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Analyze this sales data and provide insights:
${JSON.stringify(salesData, null, 2)}

Calculate:
1. Total revenue
2. Average monthly revenue
3. Growth rate from Jan to Jun
4. Best performing month`,
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('Analysis:', response.output_text);
}

async function chartGeneration() {
  console.log('=== Chart Generation ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Create a bar chart showing monthly revenue:
- Jan: $10,000
- Feb: $12,000
- Mar: $11,500
- Apr: $13,000
- May: $14,500
- Jun: $16,000`,
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('Response:', response.output_text);

  // Find chart output
  response.output.forEach((item) => {
    if (item.type === 'code_interpreter_call') {
      console.log('\nChart code:');
      console.log(item.input);

      // Check for file outputs (charts saved as files)
      if (item.outputs) {
        item.outputs.forEach((output) => {
          if (output.type === 'image') {
            console.log('Chart URL:', output.url);
          }
        });
      }
    }
  });
}

async function fileProcessing() {
  console.log('=== File Processing ===\n');

  // Upload file first
  const file = await openai.files.create({
    file: Buffer.from('name,age,city\nAlice,30,NYC\nBob,25,LA\nCharlie,35,Chicago'),
    purpose: 'assistants',
  });

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Analyze the CSV file and tell me the average age',
    tools: [
      {
        type: 'code_interpreter',
        file_ids: [file.id], // ✅ Access uploaded file
      },
    ],
  });

  console.log('Analysis:', response.output_text);
}

async function complexCalculation() {
  console.log('=== Complex Calculation ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Solve this math problem step by step:

A company's revenue grows by 15% each year. If the revenue in year 1 is $100,000:
1. What will the revenue be in year 5?
2. What is the total revenue across all 5 years?
3. What year will the revenue first exceed $200,000?`,
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('Solution:', response.output_text);

  // Show step-by-step reasoning
  response.output.forEach((item) => {
    if (item.type === 'reasoning') {
      console.log('\nReasoning:', item.summary[0].text);
    }
    if (item.type === 'code_interpreter_call') {
      console.log('\nCode:', item.input);
      console.log('Result:', item.output);
    }
  });
}

async function statisticalAnalysis() {
  console.log('=== Statistical Analysis ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Perform statistical analysis on this dataset:
[12, 15, 18, 20, 22, 25, 28, 30, 35, 40]

Calculate:
1. Standard deviation
2. Variance
3. 25th, 50th, 75th percentiles
4. Outliers (if any)`,
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('Analysis:', response.output_text);
}

async function codeInterpreterWithTimeout() {
  console.log('=== Code Interpreter with Background Mode ===\n');

  // For long-running code, use background mode
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Process this large dataset and generate a comprehensive report',
    background: true, // ✅ Extended timeout for long-running code
    tools: [{ type: 'code_interpreter' }],
  });

  // Poll for completion
  let result = await openai.responses.retrieve(response.id);

  while (result.status === 'in_progress') {
    console.log('Still processing...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    result = await openai.responses.retrieve(response.id);
  }

  if (result.status === 'completed') {
    console.log('Result:', result.output_text);
  } else {
    console.error('Failed:', result.error);
  }
}

async function handleCodeInterpreterErrors() {
  console.log('=== Error Handling ===\n');

  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input: 'Run this Python code: import invalid_module',
      tools: [{ type: 'code_interpreter' }],
    });

    // Check for execution errors in output
    response.output.forEach((item) => {
      if (item.type === 'code_interpreter_call' && item.error) {
        console.error('Code execution error:', item.error);
      }
    });
  } catch (error: any) {
    if (error.type === 'code_interpreter_timeout') {
      console.error('Code execution timed out. Use background mode for long tasks.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run examples
basicCalculation();
// dataAnalysis();
// chartGeneration();
// fileProcessing();
// complexCalculation();
// statisticalAnalysis();
// codeInterpreterWithTimeout();
