// Next.js Server Action with AI SDK
// AI SDK Core - Server Actions for Next.js App Router

'use server';

import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Example 1: Simple text generation
export async function generateStory(theme: string) {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: `Write a short story about: ${theme}`,
    maxOutputTokens: 500,
  });

  return result.text;
}

// Example 2: Structured output (recipe generation)
export async function generateRecipe(ingredients: string[]) {
  const RecipeSchema = z.object({
    name: z.string(),
    description: z.string(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        amount: z.string(),
      })
    ),
    instructions: z.array(z.string()),
    cookingTime: z.number().describe('Cooking time in minutes'),
    servings: z.number(),
  });

  const result = await generateObject({
    model: openai('gpt-4'),
    schema: RecipeSchema,
    prompt: `Create a recipe using these ingredients: ${ingredients.join(', ')}`,
  });

  return result.object;
}

// Example 3: Data extraction
export async function extractContactInfo(text: string) {
  const ContactSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
  });

  const result = await generateObject({
    model: openai('gpt-4'),
    schema: ContactSchema,
    prompt: `Extract contact information from this text: ${text}`,
  });

  return result.object;
}

// Example 4: Error handling in Server Action
export async function generateWithErrorHandling(prompt: string) {
  try {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      maxOutputTokens: 200,
    });

    return { success: true, data: result.text };
  } catch (error: any) {
    console.error('AI generation error:', error);

    return {
      success: false,
      error: 'Failed to generate response. Please try again.',
    };
  }
}

/*
 * Usage in Client Component:
 *
 * 'use client';
 *
 * import { useState } from 'react';
 * import { generateStory, generateRecipe } from './actions';
 *
 * export default function AIForm() {
 *   const [result, setResult] = useState('');
 *   const [loading, setLoading] = useState(false);
 *
 *   async function handleGenerateStory(formData: FormData) {
 *     setLoading(true);
 *     const theme = formData.get('theme') as string;
 *     const story = await generateStory(theme);
 *     setResult(story);
 *     setLoading(false);
 *   }
 *
 *   async function handleGenerateRecipe(formData: FormData) {
 *     setLoading(true);
 *     const ingredients = (formData.get('ingredients') as string).split(',');
 *     const recipe = await generateRecipe(ingredients);
 *     setResult(JSON.stringify(recipe, null, 2));
 *     setLoading(false);
 *   }
 *
 *   return (
 *     <div>
 *       <form action={handleGenerateStory}>
 *         <input name="theme" placeholder="Story theme" required />
 *         <button disabled={loading}>Generate Story</button>
 *       </form>
 *
 *       <form action={handleGenerateRecipe}>
 *         <input name="ingredients" placeholder="flour, eggs, sugar" required />
 *         <button disabled={loading}>Generate Recipe</button>
 *       </form>
 *
 *       {result && <pre>{result}</pre>}
 *     </div>
 *   );
 * }
 */

/*
 * File Structure:
 *
 * app/
 * ├── actions.ts              # This file (Server Actions)
 * ├── page.tsx                # Client component using actions
 * └── api/
 *     └── chat/
 *         └── route.ts        # Alternative: API Route for streaming
 *
 * Note: Server Actions are recommended for mutations and non-streaming AI calls.
 * For streaming, use API Routes with streamText().toDataStreamResponse()
 */

/*
 * Environment Variables (.env.local):
 *
 * OPENAI_API_KEY=sk-...
 * ANTHROPIC_API_KEY=sk-ant-...
 * GOOGLE_GENERATIVE_AI_API_KEY=...
 */
