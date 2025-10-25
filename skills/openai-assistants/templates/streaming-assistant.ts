/**
 * Streaming Assistant
 *
 * Demonstrates:
 * - Real-time streaming with Server-Sent Events (SSE)
 * - Handling different event types
 * - Streaming message deltas
 * - Tool call progress updates
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('🌊 Creating Streaming Assistant...\n');

  // 1. Create assistant
  const assistant = await openai.beta.assistants.create({
    name: "Streaming Tutor",
    instructions: "You are a helpful tutor. Explain concepts clearly and use code interpreter when helpful.",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4o",
  });

  console.log(`✅ Assistant created: ${assistant.id}\n`);

  // 2. Create thread
  const thread = await openai.beta.threads.create({
    messages: [{
      role: "user",
      content: "Explain the Fibonacci sequence and calculate the first 10 numbers.",
    }],
  });

  console.log(`✅ Thread created: ${thread.id}\n`);
  console.log('💬 User: Explain the Fibonacci sequence and calculate the first 10 numbers.\n');
  console.log('🤖 Assistant: ');

  // 3. Create streaming run
  const stream = await openai.beta.threads.runs.stream(thread.id, {
    assistant_id: assistant.id,
  });

  // Track state
  let currentMessageId: string | null = null;
  let fullResponse = '';

  // 4. Handle stream events
  for await (const event of stream) {
    switch (event.event) {
      case 'thread.run.created':
        console.log('[Run started]\n');
        break;

      case 'thread.run.queued':
        console.log('[Run queued...]\n');
        break;

      case 'thread.run.in_progress':
        console.log('[Processing...]\n');
        break;

      case 'thread.message.created':
        currentMessageId = event.data.id;
        break;

      case 'thread.message.delta':
        // Stream text content in real-time
        const delta = event.data.delta.content?.[0];
        if (delta?.type === 'text' && delta.text?.value) {
          process.stdout.write(delta.text.value);
          fullResponse += delta.text.value;
        }
        break;

      case 'thread.message.completed':
        console.log('\n\n[Message completed]\n');
        break;

      case 'thread.run.step.created':
        const step = event.data;
        if (step.type === 'tool_calls') {
          console.log('\n[Tool call initiated...]\n');
        }
        break;

      case 'thread.run.step.delta':
        // Show code interpreter progress
        const stepDelta = event.data.delta.step_details;
        if (stepDelta?.type === 'tool_calls') {
          const toolCall = stepDelta.tool_calls?.[0];

          if (toolCall?.type === 'code_interpreter') {
            if (toolCall.code_interpreter?.input) {
              console.log('\n🔧 Executing Python code:\n');
              console.log(toolCall.code_interpreter.input);
              console.log('\n');
            }

            if (toolCall.code_interpreter?.outputs) {
              for (const output of toolCall.code_interpreter.outputs) {
                if (output.type === 'logs') {
                  console.log('📋 Output:', output.logs);
                }
              }
            }
          }
        }
        break;

      case 'thread.run.step.completed':
        console.log('[Step completed]\n');
        break;

      case 'thread.run.completed':
        console.log('\n✅ Run completed!\n');
        break;

      case 'thread.run.failed':
        console.error('\n❌ Run failed:', event.data.last_error);
        break;

      case 'thread.run.requires_action':
        console.log('\n⚠️  Requires action (function calling needed)');
        break;

      case 'error':
        console.error('\n❌ Stream error:', event.data);
        break;
    }
  }

  console.log('---\n');

  // Ask a follow-up question
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: "Can you explain how recursion works in that sequence?",
  });

  console.log('💬 User: Can you explain how recursion works in that sequence?\n');
  console.log('🤖 Assistant: ');

  const stream2 = await openai.beta.threads.runs.stream(thread.id, {
    assistant_id: assistant.id,
  });

  for await (const event of stream2) {
    if (event.event === 'thread.message.delta') {
      const delta = event.data.delta.content?.[0];
      if (delta?.type === 'text' && delta.text?.value) {
        process.stdout.write(delta.text.value);
      }
    }

    if (event.event === 'thread.run.completed') {
      console.log('\n\n✅ Streaming complete!\n');
    }
  }
}

main().catch(console.error);
