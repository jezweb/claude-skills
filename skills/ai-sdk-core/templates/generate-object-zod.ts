// Structured output with Zod schema validation
// AI SDK Core - generateObject() with Zod

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Define Zod schema
const PersonSchema = z.object({
  name: z.string().describe('Person full name'),
  age: z.number().describe('Person age in years'),
  role: z.enum(['engineer', 'designer', 'manager', 'other']).describe('Job role'),
  skills: z.array(z.string()).describe('List of technical skills'),
  experience: z.object({
    years: z.number(),
    companies: z.array(z.string()),
  }),
});

async function main() {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: PersonSchema,
    prompt: 'Generate a profile for a senior software engineer with 8 years of experience.',
  });

  console.log('Generated object:');
  console.log(JSON.stringify(result.object, null, 2));

  // TypeScript knows the exact type
  console.log('\nAccessing typed properties:');
  console.log('Name:', result.object.name);
  console.log('Skills:', result.object.skills.join(', '));
  console.log('Years of experience:', result.object.experience.years);
}

main().catch(console.error);
