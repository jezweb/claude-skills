# Grounding with Google Search Guide

Complete guide to using grounding with Google Search to connect Gemini models to real-time web information, reducing hallucinations and providing verifiable, up-to-date responses.

---

## What is Grounding?

Grounding connects the Gemini model to Google Search, allowing it to:
- Access real-time information beyond training cutoff
- Reduce hallucinations with fact-checked web sources
- Provide citations and source URLs
- Answer questions about current events
- Verify information against the web

---

## How It Works

1. **Model receives query** (e.g., "Who won Euro 2024?")
2. **Model determines** if current information is needed
3. **Performs Google Search** automatically
4. **Processes search results** (web pages, snippets)
5. **Incorporates findings** into response
6. **Provides citations** with source URLs

---

## Two Grounding APIs

### 1. Google Search (`googleSearch`) - Recommended for Gemini 2.5

**Simple, automatic grounding**:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Who won the euro 2024?',
  config: {
    tools: [{ googleSearch: {} }]
  }
});
```

**Features**:
- Simple configuration (empty object)
- Automatic search when model needs current info
- Available on all Gemini 2.5 models
- Recommended for new projects

### 2. Google Search Retrieval (`googleSearchRetrieval`) - Legacy for Gemini 1.5

**Dynamic threshold control**:

```typescript
import { DynamicRetrievalConfigMode } from '@google/genai';

const response = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: 'Who won the euro 2024?',
  config: {
    tools: [{
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalConfigMode.MODE_DYNAMIC,
          dynamicThreshold: 0.7 // Search only if confidence < 70%
        }
      }
    }]
  }
});
```

**Features**:
- Control when searches happen via threshold
- Used with Gemini 1.5 models
- More configuration options

**Recommendation**: Use `googleSearch` for Gemini 2.5 models (simpler and newer).

---

## Basic Usage

### SDK Approach (Gemini 2.5)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What are the latest developments in AI?',
  config: {
    tools: [{ googleSearch: {} }]
  }
});

console.log(response.text);

// Check if grounding was used
if (response.candidates[0].groundingMetadata) {
  console.log('✓ Search performed');
  console.log('Sources:', response.candidates[0].groundingMetadata.webPages);
} else {
  console.log('✓ Answered from model knowledge');
}
```

### Fetch Approach (Cloudflare Workers)

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
      contents: [{ parts: [{ text: 'What are the latest developments in AI?' }] }],
      tools: [{ google_search: {} }]
    }),
  }
);

const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);
```

---

## Grounding Metadata

### Structure

```typescript
{
  groundingMetadata: {
    // Search queries performed
    searchQueries: [
      { text: "euro 2024 winner" }
    ],

    // Web pages retrieved
    webPages: [
      {
        url: "https://example.com/euro-2024",
        title: "UEFA Euro 2024 Results",
        snippet: "Spain won UEFA Euro 2024..."
      }
    ],

    // Citations (inline references)
    citations: [
      {
        startIndex: 42,
        endIndex: 47,
        uri: "https://example.com/euro-2024"
      }
    ],

    // Retrieval queries (alternative search terms)
    retrievalQueries: [
      { query: "who won euro 2024 final" }
    ]
  }
}
```

### Accessing Metadata

```typescript
if (response.candidates[0].groundingMetadata) {
  const metadata = response.candidates[0].groundingMetadata;

  // Display sources
  console.log('Sources:');
  metadata.webPages?.forEach((page, i) => {
    console.log(`${i + 1}. ${page.title}`);
    console.log(`   ${page.url}`);
  });

  // Display citations
  console.log('\nCitations:');
  metadata.citations?.forEach((citation) => {
    console.log(`Position ${citation.startIndex}-${citation.endIndex}: ${citation.uri}`);
  });
}
```

---

## When to Use Grounding

### ✅ Good Use Cases

**Current Events**:
```typescript
'What happened in the news today?'
'Who won the latest sports championship?'
'What are the current stock prices?'
```

**Recent Developments**:
```typescript
'What are the latest AI breakthroughs?'
'What are recent changes in climate policy?'
```

**Fact-Checking**:
```typescript
'Is this claim true: [claim]?'
'What does the latest research say about [topic]?'
```

**Real-Time Data**:
```typescript
'What is the current weather in Tokyo?'
'What are today's cryptocurrency prices?'
```

### ❌ Not Recommended For

**General Knowledge**:
```typescript
'What is the capital of France?' // Model knows this
'How does photosynthesis work?' // Stable knowledge
```

**Mathematical Calculations**:
```typescript
'What is 15 * 27?' // Use code execution instead
```

**Creative Tasks**:
```typescript
'Write a poem about autumn' // No search needed
```

**Code Generation**:
```typescript
'Write a sorting algorithm' // Internal reasoning sufficient
```

---

## Chat with Grounding

### Multi-Turn Conversations

```typescript
const chat = await ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    tools: [{ googleSearch: {} }]
  }
});

// First question
let response = await chat.sendMessage('What are the latest quantum computing developments?');
console.log(response.text);

// Display sources
if (response.candidates[0].groundingMetadata) {
  const sources = response.candidates[0].groundingMetadata.webPages || [];
  console.log(`\nSources: ${sources.length} web pages`);
  sources.forEach(s => console.log(`- ${s.title}: ${s.url}`));
}

// Follow-up question
response = await chat.sendMessage('Which company made the biggest breakthrough?');
console.log('\n' + response.text);
```

---

## Combining with Other Features

### Grounding + Function Calling

```typescript
const weatherFunction = {
  name: 'get_current_weather',
  description: 'Get weather for a location',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' }
    },
    required: ['location']
  }
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather like in the city that won Euro 2024?',
  config: {
    tools: [
      { googleSearch: {} },           // For finding Euro 2024 winner
      { functionDeclarations: [weatherFunction] }  // For weather lookup
    ]
  }
});

// Model will:
// 1. Use Google Search to find Euro 2024 winner (Madrid/Spain)
// 2. Call get_current_weather function with the city
// 3. Combine both results in response
```

### Grounding + Code Execution

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Find the current stock prices for AAPL, GOOGL, MSFT and calculate their average',
  config: {
    tools: [
      { googleSearch: {} },      // For current stock prices
      { codeExecution: {} }      // For averaging
    ]
  }
});

// Model will:
// 1. Search for current stock prices
// 2. Generate code to calculate average
// 3. Execute code with the found prices
// 4. Return result with citations
```

---

## Checking Grounding Usage

### Determine if Search Was Performed

```typescript
const queries = [
  'What is 2+2?',                  // Should NOT use search
  'What happened in the news today?' // Should use search
];

for (const query of queries) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: { tools: [{ googleSearch: {} }] }
  });

  console.log(`Query: ${query}`);
  console.log(`Search used: ${response.candidates[0].groundingMetadata ? 'YES' : 'NO'}`);
  console.log();
}
```

**Output**:
```
Query: What is 2+2?
Search used: NO

Query: What happened in the news today?
Search used: YES
```

---

## Dynamic Retrieval (Gemini 1.5)

### Threshold-Based Grounding

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: 'Who won the euro 2024?',
  config: {
    tools: [{
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalConfigMode.MODE_DYNAMIC,
          dynamicThreshold: 0.7 // Search only if confidence < 70%
        }
      }
    }]
  }
});

if (!response.candidates[0].groundingMetadata) {
  console.log('Model answered from knowledge (confidence >= 70%)');
} else {
  console.log('Search performed (confidence < 70%)');
}
```

**How It Works**:
- Model evaluates confidence in its internal knowledge
- If confidence < threshold → performs search
- If confidence >= threshold → uses internal knowledge

**Threshold Values**:
- `0.0`: Never search (always use internal knowledge)
- `0.5`: Search if moderately uncertain
- `0.7`: Search if somewhat uncertain (good default)
- `1.0`: Always search

---

## Best Practices

### ✅ Do

1. **Check Metadata**: Always verify if grounding was used
   ```typescript
   if (response.candidates[0].groundingMetadata) { ... }
   ```

2. **Display Citations**: Show sources to users for transparency
   ```typescript
   metadata.webPages.forEach(page => {
     console.log(`Source: ${page.title} (${page.url})`);
   });
   ```

3. **Use Specific Queries**: Better search results with clear questions
   ```typescript
   // ✅ Good: "What are Microsoft's Q3 2024 earnings?"
   // ❌ Vague: "Tell me about Microsoft"
   ```

4. **Combine Features**: Use with function calling/code execution for powerful workflows

5. **Handle Missing Metadata**: Not all queries trigger search
   ```typescript
   const sources = response.candidates[0].groundingMetadata?.webPages || [];
   ```

### ❌ Don't

1. **Don't Assume Search Always Happens**: Model decides when to search
2. **Don't Ignore Citations**: They're crucial for fact-checking
3. **Don't Use for Stable Knowledge**: Waste of resources for unchanging facts
4. **Don't Expect Perfect Coverage**: Not all information is on the web

---

## Cost and Performance

### Cost Considerations

- **Added Latency**: Search takes 1-3 seconds typically
- **Token Costs**: Retrieved content counts as input tokens
- **Rate Limits**: Subject to API rate limits

### Optimization

**Use Dynamic Threshold** (Gemini 1.5):
```typescript
dynamicThreshold: 0.7 // Higher = more searches, lower = fewer searches
```

**Cache Grounding Results** (if appropriate):
```typescript
const cache = await ai.caches.create({
  model: 'gemini-2.5-flash-001',
  config: {
    displayName: 'grounding-cache',
    tools: [{ googleSearch: {} }],
    contents: 'Initial query that triggers search...',
    ttl: '3600s'
  }
});
// Subsequent queries reuse cached grounding results
```

---

## Troubleshooting

### Grounding Not Working

**Symptom**: No `groundingMetadata` in response

**Causes**:
1. Grounding not enabled: `tools: [{ googleSearch: {} }]`
2. Model decided search wasn't needed (query answerable from knowledge)
3. Google Cloud project not configured (grounding requires GCP)

**Solution**:
- Verify `tools` configuration
- Use queries requiring current information
- Set up Google Cloud project

### Poor Search Quality

**Symptom**: Irrelevant sources or wrong information

**Causes**:
- Vague query
- Search terms ambiguous
- Recent events not yet indexed

**Solution**:
- Make queries more specific
- Include context in prompt
- Verify search queries in metadata

### Citations Missing

**Symptom**: `groundingMetadata` present but no citations

**Explanation**: Citations are **inline references** - they may not always be present if model doesn't directly quote sources.

**Solution**: Check `webPages` instead for full source list

---

## Important Requirements

### Google Cloud Project

**⚠️ Grounding requires a Google Cloud project, not just an API key.**

**Setup**:
1. Create Google Cloud project
2. Enable Generative Language API
3. Configure billing
4. Use API key from that project

**Error if Missing**:
```
Error: Grounding requires Google Cloud project configuration
```

### Model Support

**✅ Supported**:
- All Gemini 2.5 models (`googleSearch`)
- All Gemini 1.5 models (`googleSearchRetrieval`)

**❌ Not Supported**:
- Gemini 1.0 models

---

## Examples

### News Summary

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Summarize today's top 3 technology news headlines',
  config: { tools: [{ googleSearch: {} }] }
});

console.log(response.text);
metadata.webPages?.forEach((page, i) => {
  console.log(`${i + 1}. ${page.title}: ${page.url}`);
});
```

### Fact Verification

```typescript
const claim = "The Earth is flat";

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: `Is this claim true: "${claim}"? Use reliable sources to verify.`,
  config: { tools: [{ googleSearch: {} }] }
});

console.log(response.text);
```

### Market Research

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What are the current trends in electric vehicle adoption in 2024?',
  config: { tools: [{ googleSearch: {} }] }
});

console.log(response.text);
console.log('\nSources:');
metadata.webPages?.forEach(page => {
  console.log(`- ${page.title}`);
});
```

---

## References

- Official Docs: https://ai.google.dev/gemini-api/docs/grounding
- Google Search Docs: https://ai.google.dev/gemini-api/docs/google-search
- Templates: See `grounding-search.ts` for working examples
- Combined Features: See `combined-advanced.ts` for integration patterns
