/**
 * Code Interpreter Assistant
 *
 * Demonstrates:
 * - Python code execution
 * - File uploads for data analysis
 * - Retrieving generated files (charts, CSVs)
 * - Data visualization
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('📊 Creating Data Analyst Assistant...\n');

  // 1. Create assistant with code interpreter
  const assistant = await openai.beta.assistants.create({
    name: "Data Analyst",
    instructions: "You are a data analyst. Analyze data and create visualizations. Always explain your approach and findings.",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4o",
  });

  console.log(`✅ Assistant created: ${assistant.id}\n`);

  // 2. Upload a data file (CSV example)
  // For this example, create a sample CSV
  const csvData = `date,revenue,expenses
2025-01-01,10000,4000
2025-01-02,12000,4500
2025-01-03,9500,4200
2025-01-04,15000,5000
2025-01-05,13500,4800`;

  fs.writeFileSync('sample_data.csv', csvData);

  const file = await openai.files.create({
    file: fs.createReadStream('sample_data.csv'),
    purpose: 'assistants',
  });

  console.log(`✅ File uploaded: ${file.id}\n`);

  // 3. Create thread with file attachment
  const thread = await openai.beta.threads.create({
    messages: [{
      role: "user",
      content: "Analyze this revenue data. Calculate total revenue, average daily revenue, and create a visualization showing revenue and expenses over time.",
      attachments: [{
        file_id: file.id,
        tools: [{ type: "code_interpreter" }],
      }],
    }],
  });

  console.log(`✅ Thread created: ${thread.id}\n`);

  // 4. Run the assistant
  console.log('🏃 Running analysis...\n');
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  // 5. Poll for completion
  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

  while (!['completed', 'failed', 'cancelled'].includes(runStatus.status)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log(`   Status: ${runStatus.status}`);
  }

  if (runStatus.status !== 'completed') {
    console.error(`❌ Run ${runStatus.status}:`, runStatus.last_error);
    process.exit(1);
  }

  console.log('\n✅ Analysis completed!\n');

  // 6. Retrieve the response
  const messages = await openai.beta.threads.messages.list(thread.id);
  const responseMessage = messages.data[0];

  console.log('💬 Analysis Results:\n');

  for (const content of responseMessage.content) {
    if (content.type === 'text') {
      console.log(content.text.value);
      console.log('\n---\n');
    }

    // Download generated image files (charts)
    if (content.type === 'image_file') {
      const imageFileId = content.image_file.file_id;
      console.log(`📈 Chart generated: ${imageFileId}`);

      // Download the image
      const imageData = await openai.files.content(imageFileId);
      const imageBuffer = Buffer.from(await imageData.arrayBuffer());

      fs.writeFileSync(`chart_${imageFileId}.png`, imageBuffer);
      console.log(`   Saved as: chart_${imageFileId}.png\n`);
    }
  }

  // 7. Check run steps to see code that was executed
  const runSteps = await openai.beta.threads.runs.steps.list(thread.id, run.id);

  console.log('🔍 Execution Steps:\n');
  for (const step of runSteps.data) {
    if (step.step_details.type === 'tool_calls') {
      for (const toolCall of step.step_details.tool_calls) {
        if (toolCall.type === 'code_interpreter') {
          console.log('Python code executed:');
          console.log(toolCall.code_interpreter.input);
          console.log('\nOutput:');
          console.log(toolCall.code_interpreter.outputs);
          console.log('\n---\n');
        }
      }
    }
  }

  // Cleanup
  fs.unlinkSync('sample_data.csv');

  console.log('\n📊 Usage:');
  console.log(`   Total tokens: ${runStatus.usage?.total_tokens}`);
}

main().catch(console.error);
