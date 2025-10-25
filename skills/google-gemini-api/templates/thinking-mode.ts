/**
 * Thinking Mode Configuration with Gemini API
 *
 * Demonstrates:
 * - Thinking mode (enabled by default on Gemini 2.5 models)
 * - Configuring thinking budget
 * - When to use thinking mode
 * - Impact on latency and quality
 *
 * Prerequisites:
 * - npm install @google/genai@1.27.0
 * - export GEMINI_API_KEY="..."
 *
 * ℹ️ Thinking mode is ALWAYS ENABLED on Gemini 2.5 models (cannot be disabled)
 */

import { GoogleGenAI } from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Example 1: Default thinking budget
    console.log('Example 1: Default Thinking Budget\n');
    console.log('Prompt: Solve this complex math problem:\n');
    console.log('If a train travels 120 km in 1.5 hours, then slows down to 60 km/h for 45 minutes, how far has it traveled total?\n');

    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'If a train travels 120 km in 1.5 hours, then slows down to 60 km/h for 45 minutes, how far has it traveled total?'
      // No thinkingConfig = uses default budget
    });

    console.log('Answer:', response1.text);
    console.log('\nToken usage:', response1.usageMetadata);
    console.log('\n---\n');

    // Example 2: Increased thinking budget for complex reasoning
    console.log('Example 2: Increased Thinking Budget (8192 tokens)\n');
    console.log('Prompt: Complex logic puzzle\n');

    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Three people (Alice, Bob, Carol) have different jobs (doctor, engineer, teacher).
        Clues:
        1. Alice is not a doctor
        2. The engineer is older than Bob
        3. Carol is younger than the teacher
        4. The doctor is the youngest

        Who has which job?
      `,
      config: {
        thinkingConfig: {
          thinkingBudget: 8192 // Increase budget for complex reasoning
        }
      }
    });

    console.log('Answer:', response2.text);
    console.log('\nToken usage:', response2.usageMetadata);
    console.log('\n---\n');

    // Example 3: Comparison with gemini-2.5-pro (more thinking capability)
    console.log('Example 3: Using gemini-2.5-pro for Advanced Reasoning\n');
    console.log('Prompt: Multi-step code optimization problem\n');

    const response3 = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Pro model has better reasoning
      contents: `
        Optimize this Python code for better performance:

        def find_duplicates(arr):
            duplicates = []
            for i in range(len(arr)):
                for j in range(i + 1, len(arr)):
                    if arr[i] == arr[j] and arr[i] not in duplicates:
                        duplicates.append(arr[i])
            return duplicates

        Explain your optimization strategy step by step.
      `,
      config: {
        thinkingConfig: {
          thinkingBudget: 8192
        }
      }
    });

    console.log('Optimization:', response3.text);
    console.log('\nToken usage:', response3.usageMetadata);

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Thinking Mode Guidelines:
 *
 * What is Thinking Mode?
 * - Gemini 2.5 models "think" before responding, improving accuracy
 * - The model internally reasons through the problem
 * - This happens transparently (you don't see the thinking process)
 *
 * Thinking Budget:
 * - Controls max tokens allocated for internal reasoning
 * - Higher budget = more thorough reasoning (may increase latency)
 * - Default budget is usually sufficient for most tasks
 *
 * When to Increase Budget:
 * ✅ Complex math/logic problems
 * ✅ Multi-step reasoning tasks
 * ✅ Code optimization challenges
 * ✅ Detailed analysis requiring careful consideration
 *
 * When Default is Fine:
 * ⏺️ Simple factual questions
 * ⏺️ Creative writing
 * ⏺️ Translation
 * ⏺️ Summarization
 *
 * Model Comparison:
 * - gemini-2.5-pro: Best for complex reasoning, higher default thinking budget
 * - gemini-2.5-flash: Good balance, suitable for most thinking tasks
 * - gemini-2.5-flash-lite: Basic thinking, optimized for speed
 *
 * Important Notes:
 * - You CANNOT disable thinking mode on 2.5 models (always on)
 * - Thinking tokens count toward total usage
 * - Higher thinking budget may increase latency slightly
 */

main();
