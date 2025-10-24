/**
 * Background Mode Example
 *
 * Demonstrates long-running tasks with background mode (up to 10 minutes).
 * Standard mode timeout: 60 seconds
 * Background mode timeout: 10 minutes
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicBackgroundMode() {
  console.log('=== Basic Background Mode ===\n');

  // Start background task
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Analyze this 500-page document and provide a comprehensive summary',
    background: true, // ✅ Extended timeout
  });

  console.log('Task started:', response.id);
  console.log('Status:', response.status); // "in_progress"

  // Poll for completion
  let result = await openai.responses.retrieve(response.id);

  while (result.status === 'in_progress') {
    console.log('Still processing...');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds
    result = await openai.responses.retrieve(response.id);
  }

  if (result.status === 'completed') {
    console.log('\nCompleted!');
    console.log('Result:', result.output_text);
  } else if (result.status === 'failed') {
    console.error('Task failed:', result.error);
  }
}

async function backgroundWithCodeInterpreter() {
  console.log('=== Background Mode + Code Interpreter ===\n');

  // Long-running data analysis
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Process this large dataset and generate detailed statistical analysis',
    background: true,
    tools: [{ type: 'code_interpreter' }],
  });

  console.log('Analysis started:', response.id);

  // Poll with progress updates
  let checks = 0;
  let result = await openai.responses.retrieve(response.id);

  while (result.status === 'in_progress') {
    checks++;
    console.log(`Check ${checks}: Still processing...`);
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Check every 10 seconds
    result = await openai.responses.retrieve(response.id);
  }

  if (result.status === 'completed') {
    console.log(`\nCompleted after ${checks} checks`);
    console.log('Analysis:', result.output_text);
  }
}

async function backgroundWithFileSearch() {
  console.log('=== Background Mode + File Search ===\n');

  // Upload large document
  const file = await openai.files.create({
    file: Buffer.from('Large document content...'),
    purpose: 'assistants',
  });

  // Long-running file analysis
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Read this entire document and extract all key insights, metrics, and action items',
    background: true,
    tools: [{ type: 'file_search', file_ids: [file.id] }],
  });

  console.log('File analysis started:', response.id);

  // Wait for completion
  const result = await waitForCompletion(response.id);
  console.log('Insights:', result.output_text);
}

async function backgroundWithWebSearch() {
  console.log('=== Background Mode + Web Search ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Research the top 50 AI companies and create a comprehensive comparison report',
    background: true,
    tools: [{ type: 'web_search' }],
  });

  console.log('Research started:', response.id);

  const result = await waitForCompletion(response.id);
  console.log('Report:', result.output_text);
}

async function multipleBackgroundTasks() {
  console.log('=== Multiple Background Tasks ===\n');

  // Start multiple tasks in parallel
  const task1 = openai.responses.create({
    model: 'gpt-5',
    input: 'Analyze Q1 financial data',
    background: true,
    tools: [{ type: 'code_interpreter' }],
  });

  const task2 = openai.responses.create({
    model: 'gpt-5',
    input: 'Research competitor landscape',
    background: true,
    tools: [{ type: 'web_search' }],
  });

  const task3 = openai.responses.create({
    model: 'gpt-5',
    input: 'Summarize customer feedback documents',
    background: true,
    tools: [{ type: 'file_search', file_ids: ['file_123'] }],
  });

  // Wait for all
  const [response1, response2, response3] = await Promise.all([task1, task2, task3]);

  console.log('All tasks started:');
  console.log('Task 1:', response1.id);
  console.log('Task 2:', response2.id);
  console.log('Task 3:', response3.id);

  // Wait for completion
  const result1 = await waitForCompletion(response1.id);
  const result2 = await waitForCompletion(response2.id);
  const result3 = await waitForCompletion(response3.id);

  console.log('\nAll tasks completed!');
  console.log('Q1 Analysis:', result1.output_text);
  console.log('Competitor Research:', result2.output_text);
  console.log('Customer Feedback:', result3.output_text);
}

async function backgroundWithStatusTracking() {
  console.log('=== Background Mode with Status Tracking ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Complex multi-step research task',
    background: true,
  });

  console.log('Task ID:', response.id);

  // Track status with detailed logging
  let previousStatus = '';
  let result = await openai.responses.retrieve(response.id);

  while (result.status === 'in_progress') {
    if (result.status !== previousStatus) {
      console.log(`Status changed: ${previousStatus} → ${result.status}`);
      previousStatus = result.status;
    }

    // Log additional info if available
    if (result.metadata) {
      console.log('Metadata:', result.metadata);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    result = await openai.responses.retrieve(response.id);
  }

  console.log('Final status:', result.status);
}

async function handleBackgroundErrors() {
  console.log('=== Error Handling ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Long-running task',
    background: true,
  });

  try {
    const result = await waitForCompletion(response.id, {
      maxWaitTime: 5 * 60 * 1000, // 5 minutes max
      checkInterval: 5000,
    });

    console.log('Success:', result.output_text);
  } catch (error: any) {
    if (error.message === 'TIMEOUT') {
      console.error('Task exceeded maximum wait time');
      console.error('Task ID:', response.id);
      console.error('Check status later or increase timeout');
    } else if (error.status === 'failed') {
      console.error('Task failed:', error.error);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

async function cancelBackgroundTask() {
  console.log('=== Cancel Background Task ===\n');

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Long task',
    background: true,
  });

  console.log('Task started:', response.id);

  // Cancel after 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 10000));

  try {
    await openai.responses.cancel(response.id);
    console.log('Task cancelled:', response.id);
  } catch (error: any) {
    console.error('Cancellation error:', error.message);
  }
}

// Helper function
async function waitForCompletion(
  responseId: string,
  options: { maxWaitTime?: number; checkInterval?: number } = {}
): Promise<any> {
  const { maxWaitTime = 10 * 60 * 1000, checkInterval = 5000 } = options;

  const startTime = Date.now();
  let result = await openai.responses.retrieve(responseId);

  while (result.status === 'in_progress') {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('TIMEOUT');
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
    result = await openai.responses.retrieve(responseId);
  }

  if (result.status === 'failed') {
    throw result;
  }

  return result;
}

// Run examples
// basicBackgroundMode();
// backgroundWithCodeInterpreter();
// multipleBackgroundTasks();
// handleBackgroundErrors();
