/**
 * AI SDK UI - Message Persistence
 *
 * Demonstrates:
 * - Saving chat history to localStorage
 * - Loading previous conversations
 * - Multiple chat sessions
 * - Clear history functionality
 *
 * Features:
 * - Auto-save on message changes
 * - Persistent chat IDs
 * - Load on mount
 * - Clear/delete chats
 *
 * Usage:
 * 1. Copy this component
 * 2. Customize storage mechanism (localStorage, database, etc.)
 * 3. Add chat history UI if needed
 */

'use client';

import { useChat } from 'ai/react';
import { useState, FormEvent, useEffect } from 'react';
import type { Message } from 'ai';

// Storage key prefix
const STORAGE_KEY_PREFIX = 'ai-chat-';

// Helper functions for localStorage
const saveMessages = (chatId: string, messages: Message[]) => {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${chatId}`,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
};

const loadMessages = (chatId: string): Message[] => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
};

const clearMessages = (chatId: string) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${chatId}`);
  } catch (error) {
    console.error('Failed to clear messages:', error);
  }
};

const listChats = (): string[] => {
  const chats: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      chats.push(key.replace(STORAGE_KEY_PREFIX, ''));
    }
  }
  return chats;
};

export default function PersistentChat() {
  // Generate or use existing chat ID
  const [chatId, setChatId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize chat ID
  useEffect(() => {
    // Try to load from URL params or generate new
    const params = new URLSearchParams(window.location.search);
    const urlChatId = params.get('chatId');

    if (urlChatId) {
      setChatId(urlChatId);
    } else {
      // Generate new chat ID
      const newChatId = `chat-${Date.now()}`;
      setChatId(newChatId);

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('chatId', newChatId);
      window.history.replaceState({}, '', url.toString());
    }

    setIsLoaded(true);
  }, []);

  const { messages, setMessages, sendMessage, isLoading, error } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages: isLoaded ? loadMessages(chatId) : [],
  });

  const [input, setInput] = useState('');

  // Save messages whenever they change
  useEffect(() => {
    if (chatId && messages.length > 0) {
      saveMessages(chatId, messages);
    }
  }, [messages, chatId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ content: input });
    setInput('');
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear this chat?')) {
      clearMessages(chatId);
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    setChatId(newChatId);
    setMessages([]);

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('chatId', newChatId);
    window.history.pushState({}, '', url.toString());
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold">Persistent Chat</h1>
          <p className="text-sm text-gray-600">
            Chat ID: <code className="bg-gray-100 px-1 rounded">{chatId}</code>
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleNewChat}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            New Chat
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">💾</div>
              <h2 className="text-xl font-semibold text-gray-700">
                Your conversation is saved
              </h2>
              <p className="text-gray-500 mt-2">
                All messages are automatically saved to localStorage
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border p-3 rounded-lg shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200 text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            {messages.length > 0 && (
              <>Last saved: {new Date().toLocaleTimeString()}</>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Database Persistence Example (Supabase)
// ============================================================================

/*
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const saveMessagesToDB = async (chatId: string, messages: Message[]) => {
  const { error } = await supabase
    .from('chat_messages')
    .upsert({ chat_id: chatId, messages, updated_at: new Date() });

  if (error) console.error('Save error:', error);
};

const loadMessagesFromDB = async (chatId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('messages')
    .eq('chat_id', chatId)
    .single();

  if (error) {
    console.error('Load error:', error);
    return [];
  }

  return data?.messages || [];
};
*/
