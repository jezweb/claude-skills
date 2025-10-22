/**
 * Next.js Pages Router - Complete Chat Example
 *
 * Complete production-ready chat interface for Next.js Pages Router.
 *
 * Features:
 * - v5 useChat with manual input management
 * - Auto-scroll to bottom
 * - Loading states & error handling
 * - Stop generation button
 * - Responsive design
 *
 * Directory structure:
 * pages/
 * ├── chat.tsx (this file)
 * └── api/
 *     └── chat.ts (see nextjs-api-route.ts)
 *
 * Usage:
 * 1. Copy to pages/chat.tsx
 * 2. Create API route at pages/api/chat.ts (see nextjs-api-route.ts)
 * 3. Navigate to /chat
 */

import { useChat } from 'ai/react';
import { useState, FormEvent, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function ChatPage() {
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    api: '/api/chat',
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ content: input });
    setInput('');
  };

  return (
    <>
      <Head>
        <title>AI Chat</title>
        <meta name="description" content="Chat with AI" />
      </Head>

      <div className="flex flex-col h-screen max-w-3xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <h1 className="text-2xl font-bold">AI Chat</h1>
          <p className="text-sm text-gray-600">
            Powered by AI SDK v5 (Pages Router)
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-gray-700">
                  Start a conversation
                </h2>
                <p className="text-gray-500 mt-2">
                  Type a message below to begin
                </p>
              </div>
            </div>
          ) : (
            // Messages list
            <div className="space-y-4">
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
                    <div className="whitespace-pre-wrap">{message.content}</div>
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

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="text-red-700">
              <strong>Error:</strong> {error.message}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
              >
                Send
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
