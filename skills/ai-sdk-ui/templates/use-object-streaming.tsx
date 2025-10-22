/**
 * AI SDK UI - Streaming Structured Data
 *
 * Demonstrates:
 * - useObject hook for streaming structured data
 * - Partial object updates (live as schema fields fill in)
 * - Zod schema validation
 * - Loading states
 * - Error handling
 *
 * Use cases:
 * - Forms generation
 * - Recipe creation
 * - Product specs
 * - Structured content generation
 *
 * Usage:
 * 1. Copy this component
 * 2. Create /api/object route with streamObject
 * 3. Define Zod schema matching your needs
 */

'use client';

import { useObject } from 'ai/react';
import { z } from 'zod';
import { FormEvent, useState } from 'react';

// Define the schema for the object
const recipeSchema = z.object({
  recipe: z.object({
    name: z.string().describe('Recipe name'),
    description: z.string().describe('Short description'),
    prepTime: z.number().describe('Preparation time in minutes'),
    cookTime: z.number().describe('Cooking time in minutes'),
    servings: z.number().describe('Number of servings'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    ingredients: z.array(
      z.object({
        item: z.string(),
        amount: z.string(),
      })
    ),
    instructions: z.array(z.string()),
  }),
});

export default function ObjectStreaming() {
  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/recipe',
    schema: recipeSchema,
  });

  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    submit(input);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Recipe Generator</h1>
        <p className="text-gray-600 mt-2">
          Streaming structured data with live updates
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="dish"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What would you like to cook?
          </label>
          <input
            id="dish"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'chocolate chip cookies' or 'thai green curry'"
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
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              Generate Recipe
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

      {/* Generated recipe */}
      {(object?.recipe || isLoading) && (
        <div className="border rounded-lg p-6 space-y-6 bg-white shadow-sm">
          {/* Recipe header */}
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">
              {object?.recipe?.name || (
                <span className="text-gray-400 italic">
                  {isLoading ? 'Generating name...' : 'Recipe name'}
                </span>
              )}
            </h2>
            {object?.recipe?.description && (
              <p className="text-gray-600 mt-2">{object.recipe.description}</p>
            )}
          </div>

          {/* Recipe meta */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-gray-700">Prep Time</div>
              <div>
                {object?.recipe?.prepTime ? (
                  `${object.recipe.prepTime} min`
                ) : (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Cook Time</div>
              <div>
                {object?.recipe?.cookTime ? (
                  `${object.recipe.cookTime} min`
                ) : (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Servings</div>
              <div>
                {object?.recipe?.servings || (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Difficulty</div>
              <div className="capitalize">
                {object?.recipe?.difficulty || (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
            {object?.recipe?.ingredients &&
            object.recipe.ingredients.length > 0 ? (
              <ul className="space-y-2">
                {object.recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>
                      {ingredient.amount} {ingredient.item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">
                {isLoading ? 'Loading ingredients...' : 'No ingredients yet'}
              </p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Instructions</h3>
            {object?.recipe?.instructions &&
            object.recipe.instructions.length > 0 ? (
              <ol className="space-y-3">
                {object.recipe.instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400 italic">
                {isLoading ? 'Loading instructions...' : 'No instructions yet'}
              </p>
            )}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 text-blue-600 py-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
              <span>Generating recipe...</span>
            </div>
          )}
        </div>
      )}

      {/* Example prompts */}
      {!object && !isLoading && (
        <div className="space-y-2">
          <h3 className="font-semibold">Try these:</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Chocolate chip cookies',
              'Thai green curry',
              'Classic margarita pizza',
              'Banana bread',
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setInput(example)}
                className="text-left p-3 border rounded-lg hover:bg-gray-50"
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
