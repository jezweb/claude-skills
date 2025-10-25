/**
 * Basic Function Calling with Gemini API
 *
 * Demonstrates:
 * - Defining function declarations (tools)
 * - Detecting when model wants to call a function
 * - Executing functions and returning results
 * - Multi-turn function calling workflow
 *
 * Prerequisites:
 * - npm install @google/genai@1.27.0
 * - export GEMINI_API_KEY="..."
 *
 * ⚠️ IMPORTANT: Gemini 2.5 Flash-Lite does NOT support function calling!
 *   Use gemini-2.5-flash or gemini-2.5-pro
 */

import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Step 1: Define function declarations
    const getCurrentWeather = {
      name: 'get_current_weather',
      description: 'Get the current weather for a specific location',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name, e.g. San Francisco, Tokyo, London'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit'
          }
        },
        required: ['location']
      }
    };

    // Step 2: Make request with tools
    console.log('User: What\'s the weather in Tokyo?\n');

    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // ⚠️ NOT flash-lite!
      contents: 'What\'s the weather in Tokyo?',
      config: {
        tools: [
          { functionDeclarations: [getCurrentWeather] }
        ]
      }
    });

    // Step 3: Check if model wants to call a function
    const functionCall = response1.candidates[0]?.content?.parts?.find(
      part => part.functionCall
    )?.functionCall;

    if (!functionCall) {
      console.log('Model response (no function call):', response1.text);
      return;
    }

    console.log('Model wants to call function:');
    console.log('- Function name:', functionCall.name);
    console.log('- Arguments:', JSON.stringify(functionCall.args, null, 2));
    console.log('');

    // Step 4: Execute the function (your implementation)
    console.log('Executing function...\n');
    const weatherData = await getCurrentWeatherImpl(
      functionCall.args.location,
      functionCall.args.unit || 'celsius'
    );

    console.log('Function result:', JSON.stringify(weatherData, null, 2));
    console.log('');

    // Step 5: Send function result back to model
    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { parts: [{ text: 'What\'s the weather in Tokyo?' }] },
        response1.candidates[0].content, // Original assistant response with function call
        {
          parts: [
            {
              functionResponse: {
                name: functionCall.name,
                response: weatherData
              }
            }
          ]
        }
      ],
      config: {
        tools: [
          { functionDeclarations: [getCurrentWeather] }
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
 * Mock implementation of weather API
 * Replace with actual API call in production
 */
async function getCurrentWeatherImpl(location: string, unit: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data
  return {
    location,
    temperature: unit === 'celsius' ? 22 : 72,
    unit,
    conditions: 'Partly cloudy',
    humidity: 65,
    windSpeed: 10
  };
}

/**
 * Function Calling Modes:
 *
 * AUTO (default): Model decides whether to call functions
 * ANY: Force model to call at least one function
 * NONE: Disable function calling for this request
 *
 * Example with mode:
 *
 * config: {
 *   tools: [...],
 *   toolConfig: {
 *     functionCallingConfig: {
 *       mode: FunctionCallingConfigMode.ANY,
 *       allowedFunctionNames: ['get_current_weather']
 *     }
 *   }
 * }
 */

main();
