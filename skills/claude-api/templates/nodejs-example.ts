// Complete Node.js examples for Claude API

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Example 1: Simple CLI chatbot
async function simpleCLIChatbot() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages: Anthropic.MessageParam[] = [];

  console.log('Claude CLI Chatbot (type "exit" to quit)\n');

  const chat = async () => {
    rl.question('You: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      messages.push({ role: 'user', content: userInput });

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages,
        });

        const textContent = response.content.find(b => b.type === 'text');
        if (textContent && textContent.type === 'text') {
          console.log(`\nClaude: ${textContent.text}\n`);
          messages.push({ role: 'assistant', content: textContent.text });
        }
      } catch (error) {
        console.error('Error:', error.message);
      }

      chat();
    });
  };

  chat();
}

// Example 2: Streaming CLI chatbot
async function streamingCLIChatbot() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Streaming Claude CLI Chatbot (type "exit" to quit)\n');

  const chat = async () => {
    rl.question('You: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      try {
        process.stdout.write('\nClaude: ');

        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [{ role: 'user', content: userInput }],
        });

        let fullText = '';

        stream.on('text', (text) => {
          process.stdout.write(text);
          fullText += text;
        });

        await stream.finalMessage();
        console.log('\n');
      } catch (error) {
        console.error('\nError:', error.message);
      }

      chat();
    });
  };

  chat();
}

// Example 3: Batch processing from file
import * as fs from 'fs';

async function batchProcessing(inputFile: string, outputFile: string) {
  const lines = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);
  const results = [];

  console.log(`Processing ${lines.length} prompts...`);

  for (let i = 0; i < lines.length; i++) {
    const prompt = lines[i];
    console.log(`\n[${i + 1}/${lines.length}] Processing: ${prompt.substring(0, 50)}...`);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = message.content.find(b => b.type === 'text');
      if (textContent && textContent.type === 'text') {
        results.push({
          prompt,
          response: textContent.text,
          tokens: message.usage,
        });
      }

      // Rate limiting pause
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing prompt ${i + 1}:`, error.message);
      results.push({
        prompt,
        error: error.message,
      });
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${outputFile}`);
}

// Example 4: Document summarization
async function summarizeDocument(filePath: string) {
  const document = fs.readFileSync(filePath, 'utf-8');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: 'You are an expert document summarizer. Provide concise, accurate summaries.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Summarize the following document in 3-5 bullet points:',
          },
          {
            type: 'text',
            text: document,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  });

  const textContent = message.content.find(b => b.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log('Summary:');
    console.log(textContent.text);
    console.log('\nToken usage:', message.usage);
  }
}

// Example 5: Code review assistant
async function codeReview(codeContent: string, language: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: `You are an expert ${language} code reviewer. Analyze code for:
- Bugs and potential issues
- Performance optimizations
- Security vulnerabilities
- Best practices
- Code style and readability`,
    messages: [
      {
        role: 'user',
        content: `Review this ${language} code:\n\n\`\`\`${language}\n${codeContent}\n\`\`\``,
      },
    ],
  });

  const textContent = message.content.find(b => b.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log('Code Review:');
    console.log(textContent.text);
  }
}

// Example 6: Translation service
async function translateText(text: string, from: string, to: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Translate the following text from ${from} to ${to}:\n\n${text}`,
      },
    ],
  });

  const textContent = message.content.find(b => b.type === 'text');
  if (textContent && textContent.type === 'text') {
    return textContent.text;
  }

  return null;
}

// Example 7: Parallel requests
async function parallelRequests(prompts: string[]) {
  console.log(`Processing ${prompts.length} prompts in parallel...`);

  const promises = prompts.map(async (prompt, index) => {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = message.content.find(b => b.type === 'text');
      return {
        index,
        prompt,
        response: textContent && textContent.type === 'text' ? textContent.text : null,
      };
    } catch (error) {
      return {
        index,
        prompt,
        error: error.message,
      };
    }
  });

  const results = await Promise.all(promises);
  return results;
}

// Example 8: Retry logic with exponential backoff
async function requestWithRetry(
  prompt: string,
  maxRetries = 3,
  baseDelay = 1000
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = message.content.find(b => b.type === 'text');
      if (textContent && textContent.type === 'text') {
        return textContent.text;
      }

      throw new Error('No text content in response');
    } catch (error) {
      if (error instanceof Anthropic.APIError && error.status === 429) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

// Example 9: Conversation logger
class ConversationLogger {
  private messages: Anthropic.MessageParam[] = [];
  private logFile: string;

  constructor(logFile: string) {
    this.logFile = logFile;
  }

  async chat(userMessage: string): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: this.messages,
    });

    const textContent = response.content.find(b => b.type === 'text');
    if (textContent && textContent.type === 'text') {
      this.messages.push({ role: 'assistant', content: textContent.text });
      this.save();
      return textContent.text;
    }

    throw new Error('No response');
  }

  private save() {
    fs.writeFileSync(this.logFile, JSON.stringify(this.messages, null, 2));
  }

  load() {
    if (fs.existsSync(this.logFile)) {
      this.messages = JSON.parse(fs.readFileSync(this.logFile, 'utf-8'));
    }
  }
}

// Run examples
if (require.main === module) {
  const args = process.argv.slice(2);
  const example = args[0];

  switch (example) {
    case 'cli':
      simpleCLIChatbot();
      break;
    case 'stream':
      streamingCLIChatbot();
      break;
    case 'batch':
      batchProcessing(args[1], args[2] || 'output.json');
      break;
    case 'summarize':
      summarizeDocument(args[1]);
      break;
    case 'review':
      const code = fs.readFileSync(args[1], 'utf-8');
      codeReview(code, args[2] || 'typescript');
      break;
    case 'translate':
      translateText(args[1], args[2], args[3]).then(console.log);
      break;
    default:
      console.log('Available examples:');
      console.log('- cli: Interactive chatbot');
      console.log('- stream: Streaming chatbot');
      console.log('- batch <input> [output]: Batch processing');
      console.log('- summarize <file>: Document summarization');
      console.log('- review <file> [language]: Code review');
      console.log('- translate <text> <from> <to>: Translation');
  }
}

export {
  simpleCLIChatbot,
  streamingCLIChatbot,
  batchProcessing,
  summarizeDocument,
  codeReview,
  translateText,
  parallelRequests,
  requestWithRetry,
  ConversationLogger,
};
