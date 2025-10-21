// Streaming structured output with partial updates
// AI SDK Core - streamObject() with Zod

import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Define schema for RPG characters
const CharacterSchema = z.object({
  characters: z.array(
    z.object({
      name: z.string(),
      class: z.enum(['warrior', 'mage', 'rogue', 'cleric']),
      level: z.number(),
      stats: z.object({
        hp: z.number(),
        mana: z.number(),
        strength: z.number(),
        intelligence: z.number(),
      }),
      inventory: z.array(z.string()),
    })
  ),
});

async function main() {
  const stream = streamObject({
    model: google('gemini-2.5-pro'),
    schema: CharacterSchema,
    prompt: 'Generate 3 diverse RPG characters with complete stats and starting inventory.',
  });

  console.log('Streaming structured object (partial updates):');
  console.log('---\n');

  // Stream partial object updates
  for await (const partialObject of stream.partialObjectStream) {
    console.clear(); // Clear console for visual effect
    console.log('Current partial object:');
    console.log(JSON.stringify(partialObject, null, 2));
  }

  // Get final complete object
  const result = await stream.result;

  console.log('\n---');
  console.log('Final complete object:');
  console.log(JSON.stringify(result.object, null, 2));
  console.log('\nCharacter count:', result.object.characters.length);
}

main().catch(console.error);
