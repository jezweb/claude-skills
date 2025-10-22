/**
 * AI SDK UI - Chat with Tool Calling
 *
 * Demonstrates:
 * - Displaying tool calls in UI
 * - Rendering tool arguments and results
 * - Handling multi-step tool invocations
 * - Visual distinction between messages and tool calls
 *
 * Requires:
 * - API route with tools configured (see ai-sdk-core skill)
 * - Backend using `tool()` helper
 *
 * Usage:
 * 1. Set up API route with tools
 * 2. Copy this component
 * 3. Customize tool rendering as needed
 */

'use client';

import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function ChatWithTools() {
  const { messages, sendMessage, isLoading, error } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">AI Chat with Tools</h1>
        <p className="text-sm text-gray-600">
          Ask about weather, calculations, or search queries
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {/* Text content */}
            {message.content && (
              <div
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            )}

            {/* Tool invocations */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] space-y-2">
                  {message.toolInvocations.map((tool, idx) => (
                    <div
                      key={idx}
                      className="border border-blue-200 bg-blue-50 p-3 rounded-lg"
                    >
                      {/* Tool name */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="font-semibold text-blue-900">
                          Tool: {tool.toolName}
                        </span>
                      </div>

                      {/* Tool state */}
                      {tool.state === 'call' && (
                        <div className="text-sm text-blue-700">
                          <strong>Calling with:</strong>
                          <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(tool.args, null, 2)}
                          </pre>
                        </div>
                      )}

                      {tool.state === 'result' && (
                        <div className="text-sm text-blue-700">
                          <strong>Arguments:</strong>
                          <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(tool.args, null, 2)}
                          </pre>
                          <strong className="block mt-2">Result:</strong>
                          <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(tool.result, null, 2)}
                          </pre>
                        </div>
                      )}

                      {tool.state === 'partial-call' && (
                        <div className="text-sm text-blue-600 italic">
                          Preparing arguments...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
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
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'What's the weather in San Francisco?'"
            disabled={isLoading}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
