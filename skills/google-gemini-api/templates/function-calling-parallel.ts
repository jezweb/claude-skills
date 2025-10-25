/**
 * Parallel Function Calling with Gemini API
 *
 * Demonstrates:
 * - Multiple independent function calls in one request
 * - Handling multiple function call responses
 * - Compositional (sequential) vs parallel execution
 * - Complex multi-step workflows
 *
 * Prerequisites:
 * - npm install @google/genai@1.27.0
 * - export GEMINI_API_KEY="..."
 *
 * ⚠️ IMPORTANT: Only gemini-2.5-flash and gemini-2.5-pro support function calling
 */

import { GoogleGenAI } from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Define multiple functions
    const getWeather = {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' }
        },
        required: ['location']
      }
    };

    const getPopulation = {
      name: 'get_population',
      description: 'Get population of a city',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' }
        },
        required: ['city']
      }
    };

    const getTimezone = {
      name: 'get_timezone',
      description: 'Get timezone information for a location',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' }
        },
        required: ['location']
      }
    };

    // Make request that requires multiple independent functions
    console.log('User: What is the weather, population, and timezone of Tokyo?\n');

    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'What is the weather, population, and timezone of Tokyo?',
      config: {
        tools: [
          { functionDeclarations: [getWeather, getPopulation, getTimezone] }
        ]
      }
    });

    // Extract all function calls
    const functionCalls = response1.candidates[0]?.content?.parts?.filter(
      part => part.functionCall
    ) || [];

    console.log(`Model wants to call ${functionCalls.length} functions in parallel:\n`);

    // Execute all functions in parallel
    const functionResponses = await Promise.all(
      functionCalls.map(async (part) => {
        const functionCall = part.functionCall!;
        console.log(`- Calling ${functionCall.name} with args:`, functionCall.args);

        // Execute function
        let result;
        if (functionCall.name === 'get_weather') {
          result = await getWeatherImpl(functionCall.args.location);
        } else if (functionCall.name === 'get_population') {
          result = await getPopulationImpl(functionCall.args.city);
        } else if (functionCall.name === 'get_timezone') {
          result = await getTimezoneImpl(functionCall.args.location);
        }

        return {
          functionResponse: {
            name: functionCall.name,
            response: result
          }
        };
      })
    );

    console.log('\nAll functions executed.\n');

    // Send all function results back to model
    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { parts: [{ text: 'What is the weather, population, and timezone of Tokyo?' }] },
        response1.candidates[0].content,
        { parts: functionResponses }
      ],
      config: {
        tools: [
          { functionDeclarations: [getWeather, getPopulation, getTimezone] }
        ]
      }
    });

    console.log('Model final response:');
    console.log(response2.text);

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Mock function implementations
 */
async function getWeatherImpl(location: string) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    location,
    temperature: 22,
    conditions: 'Sunny',
    humidity: 60
  };
}

async function getPopulationImpl(city: string) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    city,
    population: 13960000,
    metropolitan: 37400000
  };
}

async function getTimezoneImpl(location: string) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    location,
    timezone: 'Asia/Tokyo',
    offset: '+09:00'
  };
}

/**
 * Parallel vs Compositional Function Calling:
 *
 * PARALLEL: Functions are independent and can run simultaneously
 * - Example: "What is the weather AND population of Tokyo?"
 * - Model calls get_weather() and get_population() together
 *
 * COMPOSITIONAL: Functions depend on each other (sequential)
 * - Example: "What is the weather at my current location?"
 * - Model first calls get_current_location(), then uses result for get_weather()
 *
 * Gemini automatically determines which pattern to use based on dependencies.
 */

main();
