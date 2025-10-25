/**
 * Thread Lifecycle Management
 *
 * Demonstrates:
 * - Creating and reusing threads
 * - Checking for active runs
 * - Thread cleanup patterns
 * - Error handling for common issues
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simulate database storage
const userThreads = new Map<string, string>();

/**
 * Get or create a thread for a user
 */
async function getOrCreateUserThread(userId: string): Promise<string> {
  console.log(`🔍 Checking thread for user: ${userId}`);

  // Check if thread exists
  let threadId = userThreads.get(userId);

  if (!threadId) {
    console.log('   No existing thread found. Creating new thread...');
    const thread = await openai.beta.threads.create({
      metadata: {
        user_id: userId,
        created_at: new Date().toISOString(),
      },
    });
    threadId = thread.id;
    userThreads.set(userId, threadId);
    console.log(`   ✅ Thread created: ${threadId}`);
  } else {
    console.log(`   ✅ Existing thread found: ${threadId}`);
  }

  return threadId;
}

/**
 * Check if thread has an active run
 */
async function hasActiveRun(threadId: string): Promise<boolean> {
  const runs = await openai.beta.threads.runs.list(threadId, {
    limit: 1,
    order: 'desc',
  });

  const latestRun = runs.data[0];
  return latestRun && ['queued', 'in_progress', 'cancelling'].includes(latestRun.status);
}

/**
 * Wait for active run to complete or cancel it
 */
async function ensureNoActiveRun(threadId: string, cancelIfActive = false) {
  const runs = await openai.beta.threads.runs.list(threadId, {
    limit: 1,
    order: 'desc',
  });

  const latestRun = runs.data[0];

  if (latestRun && ['queued', 'in_progress', 'cancelling'].includes(latestRun.status)) {
    if (cancelIfActive) {
      console.log(`   ⚠️  Active run detected: ${latestRun.id}. Cancelling...`);
      await openai.beta.threads.runs.cancel(threadId, latestRun.id);

      // Wait for cancellation
      let run = latestRun;
      while (run.status !== 'cancelled') {
        await new Promise(resolve => setTimeout(resolve, 500));
        run = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }
      console.log('   ✅ Run cancelled');
    } else {
      throw new Error(
        `Thread ${threadId} has an active run (${latestRun.id}). ` +
        `Wait for completion or set cancelIfActive=true`
      );
    }
  }
}

/**
 * Send a message safely (check for active runs first)
 */
async function sendMessage(
  threadId: string,
  assistantId: string,
  message: string
): Promise<string> {
  console.log(`\n💬 Sending message to thread ${threadId}...`);

  // Ensure no active run
  await ensureNoActiveRun(threadId, true);

  // Add message
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
  });

  console.log('   ✅ Message added');

  // Create run
  console.log('   🏃 Creating run...');
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });

  // Poll for completion
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

  while (!['completed', 'failed', 'cancelled'].includes(runStatus.status)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  if (runStatus.status !== 'completed') {
    throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message}`);
  }

  console.log('   ✅ Run completed');

  // Get response
  const messages = await openai.beta.threads.messages.list(threadId, {
    limit: 1,
    order: 'desc',
  });

  const responseContent = messages.data[0].content[0];
  if (responseContent.type === 'text') {
    return responseContent.text.value;
  }

  return '';
}

/**
 * Clean up old threads
 */
async function cleanupOldThreads(maxAgeHours: number = 24) {
  console.log(`\n🧹 Cleaning up threads older than ${maxAgeHours} hours...`);

  let deletedCount = 0;

  for (const [userId, threadId] of userThreads.entries()) {
    try {
      const thread = await openai.beta.threads.retrieve(threadId);
      const createdAt = new Date(thread.created_at * 1000);
      const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      if (ageHours > maxAgeHours) {
        await openai.beta.threads.del(threadId);
        userThreads.delete(userId);
        deletedCount++;
        console.log(`   ✅ Deleted thread for user ${userId} (age: ${ageHours.toFixed(1)}h)`);
      }
    } catch (error) {
      console.error(`   ❌ Error deleting thread ${threadId}:`, error);
    }
  }

  console.log(`\n   Total threads deleted: ${deletedCount}`);
}

/**
 * Main demo
 */
async function main() {
  console.log('🧵 Thread Lifecycle Management Demo\n');

  // Create an assistant
  const assistant = await openai.beta.assistants.create({
    name: "Demo Assistant",
    instructions: "You are a helpful assistant.",
    model: "gpt-4o",
  });

  console.log(`✅ Assistant created: ${assistant.id}\n`);

  // Simulate multiple users
  const user1 = 'user_alice';
  const user2 = 'user_bob';

  // User 1: First message
  let thread1 = await getOrCreateUserThread(user1);
  let response1 = await sendMessage(thread1, assistant.id, "Hello! What's 2+2?");
  console.log(`\n🤖 Response: ${response1}\n`);

  // User 2: First message
  let thread2 = await getOrCreateUserThread(user2);
  let response2 = await sendMessage(thread2, assistant.id, "What's the capital of France?");
  console.log(`\n🤖 Response: ${response2}\n`);

  // User 1: Second message (reuses thread)
  thread1 = await getOrCreateUserThread(user1);
  response1 = await sendMessage(thread1, assistant.id, "Can you multiply that by 3?");
  console.log(`\n🤖 Response: ${response1}\n`);

  // Check for active runs
  console.log('\n📊 Thread Status:');
  const hasActive1 = await hasActiveRun(thread1);
  const hasActive2 = await hasActiveRun(thread2);
  console.log(`   User 1 thread active: ${hasActive1}`);
  console.log(`   User 2 thread active: ${hasActive2}`);

  // List messages in thread 1
  console.log(`\n📜 Conversation history for user 1:`);
  const messages = await openai.beta.threads.messages.list(thread1);
  for (const message of messages.data.reverse()) {
    const content = message.content[0];
    if (content.type === 'text') {
      console.log(`   ${message.role}: ${content.text.value}`);
    }
  }

  // Cleanup demo (set to 0 hours to delete all)
  // await cleanupOldThreads(0);

  console.log('\n✅ Demo complete!');
  console.log(`\n💡 Tips:`);
  console.log('   - Always check for active runs before creating new ones');
  console.log('   - Reuse threads for conversation continuity');
  console.log('   - Clean up old threads to manage costs');
  console.log('   - Use metadata to track thread ownership');
}

main().catch(console.error);
