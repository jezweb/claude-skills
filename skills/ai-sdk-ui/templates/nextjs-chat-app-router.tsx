/**
 * Next.js App Router - Complete Chat Example
 *
 * Complete production-ready chat interface for Next.js App Router.
 *
 * Features:
 * - v5 useChat with manual input management
 * - Auto-scroll to bottom
 * - Loading states & error handling
 * - Stop generation button
 * - Responsive design
 * - Keyboard shortcuts (Enter to send, Cmd+K to clear)
 *
 * Directory structure:
 * app/
 * ├── chat/
 * │   └── page.tsx (this file)
 * └── api/
 *     └── chat/
 *         └── route.ts (see nextjs-api-route.ts)
 *
 * Usage:
 * 1. Copy to app/chat/page.tsx
 * 2. Create API route (see nextjs-api-route.ts)
 * 3. Navigate to /chat
 */

'use client';

import { useChat } from 'ai/react';
import { useState, FormEvent, useRef, useEffect } from 'react';

export default function ChatPage() {
  const { messages, sendMessage, isLoading, error, stop, reload } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ content: input });
    setInput('');
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+K or Ctrl+K to clear (focus input)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="text-sm text-gray-600">
            {messages.length > 0
              ? `${messages.length} message${messages.length === 1 ? '' : 's'}`
              : 'Start a conversation'}
          </p>
        </div>
        {messages.length > 0 && !isLoading && (
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="text-4xl">💬</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Start a conversation
                </h2>
                <p className="text-gray-600 mt-2">
                  Ask me anything or try one of these:
                </p>
              </div>
              <div className="grid gap-2 max-w-md">
                {[
                  'Explain quantum computing',
                  'Write a haiku about coding',
                  'Plan a trip to Tokyo',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="p-3 text-left border rounded-lg hover:bg-white hover:shadow-sm transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages list
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {/* Role label (only for assistant on first message) */}
                  {message.role === 'assistant' && idx === 1 && (
                    <div className="text-xs font-semibold text-gray-500 mb-2">
                      AI Assistant
                    </div>
                  )}

                  {/* Message content */}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 text-red-700">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-semibold">Error</div>
                <div className="text-sm">{error.message}</div>
              </div>
            </div>
            <button
              onClick={reload}
              className="px-3 py-1 text-sm border border-red-300 rounded hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
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
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 font-medium"
              >
                Send
              </button>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Press Enter to send • Cmd+K to focus input
          </div>
        </div>
      </form>
    </div>
  );
}
