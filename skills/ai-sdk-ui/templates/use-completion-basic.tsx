/**
 * AI SDK UI - Basic Text Completion
 *
 * Demonstrates:
 * - useCompletion hook for text generation
 * - Streaming text completion
 * - Loading states
 * - Stop generation
 * - Clear completion
 *
 * Use cases:
 * - Text generation (blog posts, summaries, etc.)
 * - Content expansion
 * - Writing assistance
 *
 * Usage:
 * 1. Copy this component to your app
 * 2. Create /api/completion route (see references)
 * 3. Customize UI as needed
 */

'use client';

import { useCompletion } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function CompletionBasic() {
  const {
    completion,
    complete,
    isLoading,
    error,
    stop,
    setCompletion,
  } = useCompletion({
    api: '/api/completion',
  });

  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    complete(input);
    setInput('');
  };

  const handleClear = () => {
    setCompletion('');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Text Completion</h1>
        <p className="text-gray-600 mt-2">
          Enter a prompt to generate text with AI
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Prompt
          </label>
          <textarea
            id="prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a blog post about..."
            rows={4}
            disabled={isLoading}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="flex space-x-2">
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Stop Generation
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              Generate
            </button>
          )}
          {completion && (
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Completion output */}
      {(completion || isLoading) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Text</h2>
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                <span>Generating...</span>
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50 border rounded-lg whitespace-pre-wrap">
            {completion || 'Waiting for response...'}
          </div>
          {!isLoading && completion && (
            <div className="text-sm text-gray-600">
              {completion.split(/\s+/).length} words, {completion.length}{' '}
              characters
            </div>
          )}
        </div>
      )}

      {/* Example prompts */}
      {!completion && !isLoading && (
        <div className="space-y-2">
          <h3 className="font-semibold">Example prompts:</h3>
          <div className="space-y-2">
            {[
              'Write a blog post about the future of AI',
              'Explain quantum computing in simple terms',
              'Create a recipe for chocolate chip cookies',
              'Write a product description for wireless headphones',
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setInput(example)}
                className="block w-full text-left p-2 border rounded hover:bg-gray-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
