/**
 * AI SDK UI - Custom Message Renderer
 *
 * Demonstrates:
 * - Markdown rendering (react-markdown)
 * - Code syntax highlighting (react-syntax-highlighter)
 * - Custom message components
 * - Copy code button
 * - Timestamp display
 * - User avatars
 *
 * Dependencies:
 * npm install react-markdown react-syntax-highlighter
 * npm install --save-dev @types/react-syntax-highlighter
 *
 * Usage:
 * 1. Install dependencies
 * 2. Copy this component
 * 3. Use <MessageRenderer message={message} /> in your chat
 */

'use client';

import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';
import type { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Custom message renderer component
function MessageRenderer({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
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
        {/* Avatar & name */}
        <div className="flex items-center space-x-2 mb-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {message.role === 'user' ? 'U' : 'AI'}
          </div>
          <span className="text-xs font-semibold">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
        </div>

        {/* Message content with markdown */}
        <div
          className={`prose prose-sm ${
            message.role === 'user' ? 'prose-invert' : ''
          } max-w-none`}
        >
          <ReactMarkdown
            components={{
              // Custom code block renderer
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                return !inline && match ? (
                  <div className="relative group">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg"
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                    <button
                      onClick={() => copyCode(codeString)}
                      className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <code
                    className={`${
                      message.role === 'user'
                        ? 'bg-blue-600'
                        : 'bg-gray-100'
                    } px-1 rounded`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Main chat component
export default function ChatWithCustomRenderer() {
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
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">Custom Message Renderer</h1>
        <p className="text-sm text-gray-600">
          With markdown, syntax highlighting, and copy buttons
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-xl font-semibold text-gray-700">
                Try asking for code examples
              </h2>
              <p className="text-gray-500 mt-2">
                Messages will render with markdown and syntax highlighting
              </p>
              <div className="mt-4 space-y-2">
                {[
                  'Write a Python function to sort a list',
                  'Explain React hooks with code examples',
                  'Show me a TypeScript interface example',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="block w-full p-2 text-left border rounded hover:bg-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageRenderer key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
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
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for code examples..."
            disabled={isLoading}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Simpler Version (without react-markdown)
// ============================================================================

/*
// Simple markdown parsing without external dependencies
function SimpleMarkdownRenderer({ content }: { content: string }) {
  // Basic markdown parsing
  const parseMarkdown = (text: string) => {
    // Code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${code}</code></pre>`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    text = text.replace(/\n/g, '<br/>');

    return text;
  };

  return (
    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
  );
}
*/
