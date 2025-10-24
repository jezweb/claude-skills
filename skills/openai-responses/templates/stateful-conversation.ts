/**
 * Stateful Conversation Example
 *
 * Demonstrates automatic state management using conversation IDs.
 * The model remembers previous turns automatically.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function automaticStateManagement() {
  console.log('=== Automatic State Management ===\n');

  // 1. Create conversation
  const conversation = await openai.conversations.create({
    metadata: {
      user_id: 'user_123',
      session_type: 'support',
    },
  });

  console.log('Conversation ID:', conversation.id);

  // 2. First turn
  const response1 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conversation.id, // ✅ Reuse this ID
    input: 'What are the 5 Ds of dodgeball?',
  });

  console.log('Turn 1:', response1.output_text);
  console.log('');

  // 3. Second turn - model remembers context
  const response2 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conversation.id, // ✅ Same ID
    input: 'Tell me more about the first one',
  });

  console.log('Turn 2:', response2.output_text);
  // Model knows "first one" refers to first D from previous turn
  console.log('');

  // 4. Third turn - still remembers everything
  const response3 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conversation.id, // ✅ Same ID
    input: 'What was my original question?',
  });

  console.log('Turn 3:', response3.output_text);
  // Model recalls original question from turn 1
}

async function manualStateManagement() {
  console.log('=== Manual State Management ===\n');

  // Alternative: Manually manage history array
  let history = [
    { role: 'user', content: 'Tell me a joke' },
  ];

  // First turn
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: history,
    store: true, // Optional: store for retrieval later
  });

  console.log('Turn 1:', response.output_text);

  // Add response to history
  history = [
    ...history,
    ...response.output.map((el) => ({
      role: el.role,
      content: el.content,
    })),
  ];

  // Second turn
  history.push({ role: 'user', content: 'Tell me another' });

  const secondResponse = await openai.responses.create({
    model: 'gpt-5',
    input: history, // ✅ Full history
  });

  console.log('Turn 2:', secondResponse.output_text);
}

async function listConversations() {
  // List all conversations (for user dashboard)
  const conversations = await openai.conversations.list({
    limit: 10,
  });

  console.log('=== Recent Conversations ===');
  conversations.data.forEach((conv) => {
    console.log('ID:', conv.id);
    console.log('Created:', new Date(conv.created_at * 1000));
    console.log('Metadata:', conv.metadata);
    console.log('');
  });
}

async function deleteConversation(conversationId: string) {
  // Delete conversation (cleanup)
  await openai.conversations.delete(conversationId);
  console.log('Conversation deleted:', conversationId);
}

// Run examples
automaticStateManagement();
// manualStateManagement();
// listConversations();
