# Code Execution Patterns

Complete guide to using code execution with Google Gemini API for computational tasks, data analysis, and problem-solving.

---

## What is Code Execution?

Code Execution allows Gemini models to generate and execute Python code to solve problems requiring computation, enabling the model to:
- Perform precise mathematical calculations
- Analyze data with pandas/numpy
- Generate charts and visualizations
- Implement algorithms
- Process files and data structures

---

## How It Works

1. **Model receives prompt** requiring computation
2. **Model generates Python code** to solve the problem
3. **Code executes in sandbox** (secure, isolated environment)
4. **Results return to model** for incorporation into response
5. **Model explains results** in natural language

---

## Enabling Code Execution

### Basic Setup (SDK)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash', // Or gemini-2.5-pro
  contents: 'Calculate the sum of first 50 prime numbers',
  config: {
    tools: [{ codeExecution: {} }] // Enable code execution
  }
});
```

### Basic Setup (Fetch)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      tools: [{ code_execution: {} }],
      contents: [{ parts: [{ text: 'Calculate...' }] }]
    }),
  }
);
```

---

## Available Python Packages

### Standard Library
- `math`, `statistics`, `random`
- `datetime`, `time`, `calendar`
- `json`, `csv`, `re`
- `collections`, `itertools`, `functools`

### Data Science
- `numpy` - numerical computing
- `pandas` - data analysis and manipulation
- `scipy` - scientific computing

### Visualization
- `matplotlib` - plotting and charts
- `seaborn` - statistical visualization

**Note**: This is a **limited sandbox environment** - not all PyPI packages are available.

---

## Response Structure

### Parsing Code Execution Results

```typescript
for (const part of response.candidates[0].content.parts) {
  // Inline text
  if (part.text) {
    console.log('Text:', part.text);
  }

  // Generated code
  if (part.executableCode) {
    console.log('Language:', part.executableCode.language); // "PYTHON"
    console.log('Code:', part.executableCode.code);
  }

  // Execution results
  if (part.codeExecutionResult) {
    console.log('Outcome:', part.codeExecutionResult.outcome); // "OUTCOME_OK" or "OUTCOME_FAILED"
    console.log('Output:', part.codeExecutionResult.output);
  }
}
```

### Example Response

```json
{
  "candidates": [{
    "content": {
      "parts": [
        { "text": "I'll calculate that for you." },
        {
          "executableCode": {
            "language": "PYTHON",
            "code": "primes = []\nnum = 2\nwhile len(primes) < 50:\n  if is_prime(num):\n    primes.append(num)\n  num += 1\nprint(sum(primes))"
          }
        },
        {
          "codeExecutionResult": {
            "outcome": "OUTCOME_OK",
            "output": "5117\n"
          }
        },
        { "text": "The sum is 5117." }
      ]
    }
  }]
}
```

---

## Common Patterns

### 1. Mathematical Calculations

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Calculate the 100th Fibonacci number',
  config: { tools: [{ codeExecution: {} }] }
});
```

**Prompting Tip**: Use phrases like "generate and run code" or "calculate using code" to explicitly request code execution.

### 2. Data Analysis

```typescript
const prompt = `
  Analyze this sales data:

  month,revenue,customers
  Jan,50000,120
  Feb,62000,145
  Mar,58000,138

  Calculate:
  1. Total revenue
  2. Average revenue per customer
  3. Month-over-month growth rate

  Use pandas or numpy for analysis.
`;

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: { tools: [{ codeExecution: {} }] }
});
```

### 3. Chart Generation

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Create a bar chart showing prime number distribution by last digit (0-9) for primes under 100',
  config: { tools: [{ codeExecution: {} }] }
});
```

**Note**: Chart image data appears in `codeExecutionResult.output` (base64 encoded in some cases).

### 4. Algorithm Implementation

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Implement quicksort and sort this list: [64, 34, 25, 12, 22, 11, 90]. Show the sorted result.',
  config: { tools: [{ codeExecution: {} }] }
});
```

### 5. File Processing (In-Memory)

```typescript
const csvData = `name,age,city
Alice,30,NYC
Bob,25,LA
Charlie,35,Chicago`;

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: `Parse this CSV data and calculate average age:\n\n${csvData}`,
  config: { tools: [{ codeExecution: {} }] }
});
```

---

## Chat with Code Execution

### Multi-Turn Computational Conversations

```typescript
const chat = await ai.chats.create({
  model: 'gemini-2.5-flash',
  config: { tools: [{ codeExecution: {} }] }
});

// First turn
let response = await chat.sendMessage('I have a data analysis question');
console.log(response.text);

// Second turn (will use code execution)
response = await chat.sendMessage(`
  Calculate statistics for: [12, 15, 18, 22, 25, 28, 30]
  - Mean
  - Median
  - Standard deviation
`);

for (const part of response.candidates[0].content.parts) {
  if (part.text) console.log(part.text);
  if (part.executableCode) console.log('Code:', part.executableCode.code);
  if (part.codeExecutionResult) console.log('Results:', part.codeExecutionResult.output);
}
```

---

## Error Handling

### Checking Execution Outcome

```typescript
for (const part of response.candidates[0].content.parts) {
  if (part.codeExecutionResult) {
    if (part.codeExecutionResult.outcome === 'OUTCOME_OK') {
      console.log('✅ Success:', part.codeExecutionResult.output);
    } else if (part.codeExecutionResult.outcome === 'OUTCOME_FAILED') {
      console.error('❌ Execution failed:', part.codeExecutionResult.output);
    }
  }
}
```

### Common Execution Errors

**Timeout**:
```
Error: Execution timed out after 30 seconds
```
**Solution**: Simplify computation or reduce data size.

**Import Error**:
```
ModuleNotFoundError: No module named 'requests'
```
**Solution**: Use only available packages (numpy, pandas, matplotlib, seaborn, scipy).

**Syntax Error**:
```
SyntaxError: invalid syntax
```
**Solution**: Model generated invalid code - try rephrasing prompt or regenerating.

---

## Best Practices

### ✅ Do

1. **Be Explicit**: Use phrases like "generate and run code" to trigger code execution
2. **Provide Data**: Include data directly in prompt for analysis
3. **Specify Output**: Ask for specific calculations or metrics
4. **Use Available Packages**: Stick to numpy, pandas, matplotlib, scipy
5. **Check Outcome**: Always verify `outcome === 'OUTCOME_OK'`

### ❌ Don't

1. **Network Access**: Code cannot make HTTP requests
2. **File System**: No persistent file storage between executions
3. **Long Computations**: Timeout limits apply (~30 seconds)
4. **External Dependencies**: Can't install new packages
5. **State Persistence**: Each execution is isolated (no global state)

---

## Limitations

### Sandbox Restrictions

- **No Network Access**: Cannot call external APIs
- **No File I/O**: Cannot read/write to disk (in-memory only)
- **Limited Packages**: Only pre-installed packages available
- **Execution Timeout**: ~30 seconds maximum
- **No State**: Each execution is independent

### Supported Models

✅ **Works with**:
- `gemini-2.5-pro`
- `gemini-2.5-flash`

❌ **Does NOT work with**:
- `gemini-2.5-flash-lite` (no code execution support)
- Gemini 1.5 models (use Gemini 2.5)

---

## Advanced Patterns

### Iterative Analysis

```typescript
const chat = await ai.chats.create({
  model: 'gemini-2.5-flash',
  config: { tools: [{ codeExecution: {} }] }
});

// Step 1: Initial analysis
let response = await chat.sendMessage('Analyze data: [10, 20, 30, 40, 50]');

// Step 2: Follow-up based on results
response = await chat.sendMessage('Now calculate the variance');

// Step 3: Visualization
response = await chat.sendMessage('Create a histogram of this data');
```

### Combining with Function Calling

```typescript
const weatherFunction = {
  name: 'get_current_weather',
  description: 'Get weather for a city',
  parametersJsonSchema: {
    type: 'object',
    properties: { city: { type: 'string' } },
    required: ['city']
  }
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Get weather for NYC, LA, Chicago. Calculate the average temperature.',
  config: {
    tools: [
      { functionDeclarations: [weatherFunction] },
      { codeExecution: {} }
    ]
  }
});

// Model will:
// 1. Call get_current_weather for each city
// 2. Generate code to calculate average
// 3. Return result
```

### Data Transformation Pipeline

```typescript
const prompt = `
  Transform this data:
  Input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  Pipeline:
  1. Filter odd numbers
  2. Square each number
  3. Calculate sum
  4. Return result

  Use code to process.
`;

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: { tools: [{ codeExecution: {} }] }
});
```

---

## Optimization Tips

### 1. Clear Instructions

**❌ Vague**:
```typescript
contents: 'Analyze this data'
```

**✅ Specific**:
```typescript
contents: 'Calculate mean, median, and standard deviation for: [12, 15, 18, 22, 25]'
```

### 2. Provide Complete Data

```typescript
const csvData = `...complete dataset...`;
const prompt = `Analyze this CSV data:\n\n${csvData}\n\nCalculate total revenue.`;
```

### 3. Request Code Explicitly

```typescript
contents: 'Generate and run code to calculate the factorial of 20'
```

### 4. Handle Large Datasets

For large data, consider:
- Sampling (analyze subset)
- Aggregation (group by categories)
- Pagination (process in chunks)

---

## Troubleshooting

### Code Not Executing

**Symptom**: Response has text but no `executableCode`

**Causes**:
1. Code execution not enabled (`tools: [{ codeExecution: {} }]`)
2. Model decided code wasn't necessary
3. Using `gemini-2.5-flash-lite` (doesn't support code execution)

**Solution**: Be explicit in prompt: "Use code to calculate..."

### Timeout Errors

**Symptom**: `OUTCOME_FAILED` with timeout message

**Causes**: Computation too complex or data too large

**Solution**:
- Simplify algorithm
- Reduce data size
- Use more efficient approach

### Import Errors

**Symptom**: `ModuleNotFoundError`

**Causes**: Trying to import unavailable package

**Solution**: Use only available packages (numpy, pandas, matplotlib, seaborn, scipy)

---

## References

- Official Docs: https://ai.google.dev/gemini-api/docs/code-execution
- Templates: See `code-execution.ts` for working examples
- Available Packages: See "Available Python Packages" section above
