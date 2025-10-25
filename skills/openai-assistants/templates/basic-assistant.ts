/**
 * Basic Assistant Example
 *
 * Demonstrates the fundamental workflow:
 * 1. Create an assistant
 * 2. Create a thread
 * 3. Add a message
 * 4. Create a run
 * 5. Poll for completion
 * 6. Retrieve the response
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('🤖 Creating Math Tutor Assistant...\n');

  // 1. Create an assistant
  const assistant = await openai.beta.assistants.create({
    name: "Math Tutor",
    instructions: "You are a personal math tutor. When asked a question, write and run Python code to answer the question.",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4o",
  });

  console.log(`✅ Assistant created: ${assistant.id}\n`);

  // 2. Create a thread
  const thread = await openai.beta.threads.create();
  console.log(`✅ Thread created: ${thread.id}\n`);

  // 3. Add a message to the thread
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: "I need to solve the equation `3x + 11 = 14`. Can you help me?",
  });

  console.log('✅ Message added to thread\n');

  // 4. Create a run
  console.log('🏃 Creating run...\n');
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  // 5. Poll for completion
  console.log('⏳ Waiting for completion...\n');
  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

  while (runStatus.status !== 'completed') {
    if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
      console.error(`❌ Run ${runStatus.status}:`, runStatus.last_error);
      process.exit(1);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log(`   Status: ${runStatus.status}`);
  }

  console.log('\n✅ Run completed!\n');

  // 6. Retrieve messages
  const messages = await openai.beta.threads.messages.list(thread.id);

  console.log('💬 Response:\n');
  const response = messages.data[0].content[0];
  if (response.type === 'text') {
    console.log(response.text.value);
  }

  // Usage stats
  console.log('\n📊 Usage:');
  console.log(`   Prompt tokens: ${runStatus.usage?.prompt_tokens}`);
  console.log(`   Completion tokens: ${runStatus.usage?.completion_tokens}`);
  console.log(`   Total tokens: ${runStatus.usage?.total_tokens}`);

  // Cleanup (optional)
  // await openai.beta.assistants.del(assistant.id);
  // await openai.beta.threads.del(thread.id);
}

main().catch(console.error);
