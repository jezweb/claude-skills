/**
 * OpenAI Structured Outputs - JSON Schema Examples
 *
 * This template demonstrates:
 * - JSON schema with strict mode
 * - Complex nested schemas
 * - Type-safe responses
 * - Validation patterns
 * - Common use cases (extraction, classification, formatting)
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// BASIC STRUCTURED OUTPUT
// =============================================================================

async function basicStructuredOutput() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', // Best for structured outputs
    messages: [
      { role: 'user', content: 'Generate a person profile' }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'person_profile',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            email: { type: 'string' },
          },
          required: ['name', 'age', 'email'],
          additionalProperties: false,
        },
      },
    },
  });

  const person = JSON.parse(completion.choices[0].message.content!);
  console.log('Person:', person);

  return person;
}

// =============================================================================
// COMPLEX NESTED SCHEMA
// =============================================================================

async function complexSchema() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'Generate a company organizational structure' }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'org_structure',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            company: { type: 'string' },
            founded: { type: 'number' },
            departments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  head: { type: 'string' },
                  employees: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        role: { type: 'string' },
                        years: { type: 'number' },
                      },
                      required: ['name', 'role', 'years'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['name', 'head', 'employees'],
                additionalProperties: false,
              },
            },
          },
          required: ['company', 'founded', 'departments'],
          additionalProperties: false,
        },
      },
    },
  });

  const org = JSON.parse(completion.choices[0].message.content!);
  console.log('Organization:', JSON.stringify(org, null, 2));

  return org;
}

// =============================================================================
// DATA EXTRACTION
// =============================================================================

async function extractData() {
  const text = `
    John Doe is a 35-year-old software engineer living in San Francisco.
    He works at TechCorp and has been there for 5 years.
    His email is john.doe@example.com and his phone is (555) 123-4567.
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Extract structured information from the provided text.',
      },
      {
        role: 'user',
        content: text,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'extracted_info',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            occupation: { type: 'string' },
            location: { type: 'string' },
            company: { type: 'string' },
            tenure_years: { type: 'number' },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone: { type: 'string' },
              },
              required: ['email', 'phone'],
              additionalProperties: false,
            },
          },
          required: ['name', 'age', 'occupation', 'location', 'company', 'tenure_years', 'contact'],
          additionalProperties: false,
        },
      },
    },
  });

  const extracted = JSON.parse(completion.choices[0].message.content!);
  console.log('Extracted:', JSON.stringify(extracted, null, 2));

  return extracted;
}

// =============================================================================
// CLASSIFICATION
// =============================================================================

async function classifyText() {
  const text = 'This product is absolutely terrible. It broke after one day of use. Very disappointed!';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Classify the sentiment and extract key information from product reviews.',
      },
      {
        role: 'user',
        content: text,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'review_classification',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            sentiment: {
              type: 'string',
              enum: ['positive', 'negative', 'neutral'],
            },
            confidence: { type: 'number' },
            category: {
              type: 'string',
              enum: ['product_quality', 'customer_service', 'shipping', 'pricing', 'other'],
            },
            issues: {
              type: 'array',
              items: { type: 'string' },
            },
            rating_estimate: { type: 'number' },
          },
          required: ['sentiment', 'confidence', 'category', 'issues', 'rating_estimate'],
          additionalProperties: false,
        },
      },
    },
  });

  const classification = JSON.parse(completion.choices[0].message.content!);
  console.log('Classification:', JSON.stringify(classification, null, 2));

  return classification;
}

// =============================================================================
// SIMPLE JSON MODE (Without Strict Schema)
// =============================================================================

async function simpleJsonMode() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'user', content: 'List 3 programming languages and their use cases as JSON' }
    ],
    response_format: { type: 'json_object' },
  });

  const data = JSON.parse(completion.choices[0].message.content!);
  console.log('JSON output:', data);

  return data;
}

// =============================================================================
// ENUM VALUES
// =============================================================================

async function withEnums() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'Categorize this as a bug report: The app crashes on startup' }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'issue_categorization',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['bug', 'feature_request', 'question', 'documentation'],
            },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
            },
            component: {
              type: 'string',
              enum: ['frontend', 'backend', 'database', 'infrastructure', 'unknown'],
            },
          },
          required: ['type', 'severity', 'component'],
          additionalProperties: false,
        },
      },
    },
  });

  const categorization = JSON.parse(completion.choices[0].message.content!);
  console.log('Categorization:', categorization);

  return categorization;
}

// =============================================================================
// VALIDATION EXAMPLE
// =============================================================================

function validateSchema<T>(data: any, expectedFields: string[]): T {
  for (const field of expectedFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return data as T;
}

async function withValidation() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'Generate a user profile with name and email' }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'user_profile',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['name', 'email'],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = JSON.parse(completion.choices[0].message.content!);

  // Validate before using
  interface UserProfile {
    name: string;
    email: string;
  }

  const validated = validateSchema<UserProfile>(raw, ['name', 'email']);
  console.log('Validated user:', validated);

  return validated;
}

// =============================================================================
// BATCH EXTRACTION
// =============================================================================

async function batchExtraction(texts: string[]) {
  const results = [];

  for (const text of texts) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Extract key information as structured data' },
        { role: 'user', content: text },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              key_points: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['summary', 'key_points'],
            additionalProperties: false,
          },
        },
      },
    });

    const extracted = JSON.parse(completion.choices[0].message.content!);
    results.push({ text, extracted });

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Extracted ${results.length} items`);
  return results;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Structured Outputs Examples ===\n');

  // Example 1: Basic
  console.log('1. Basic Structured Output:');
  await basicStructuredOutput();
  console.log();

  // Example 2: Complex schema
  console.log('2. Complex Nested Schema:');
  await complexSchema();
  console.log();

  // Example 3: Data extraction
  console.log('3. Data Extraction:');
  await extractData();
  console.log();

  // Example 4: Classification
  console.log('4. Text Classification:');
  await classifyText();
  console.log();

  // Example 5: Simple JSON mode
  console.log('5. Simple JSON Mode:');
  await simpleJsonMode();
  console.log();

  // Example 6: Enums
  console.log('6. Enum Values:');
  await withEnums();
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicStructuredOutput,
  complexSchema,
  extractData,
  classifyText,
  simpleJsonMode,
  withEnums,
  withValidation,
  batchExtraction,
};
