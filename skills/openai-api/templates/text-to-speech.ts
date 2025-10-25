/**
 * OpenAI Audio API - Text-to-Speech Examples
 *
 * This template demonstrates:
 * - Basic TTS with all 11 voices
 * - Different models (tts-1, tts-1-hd, gpt-4o-mini-tts)
 * - Voice instructions (gpt-4o-mini-tts only)
 * - Speed control
 * - Different audio formats
 * - Streaming TTS
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// BASIC TTS
// =============================================================================

async function basicTTS() {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: 'The quick brown fox jumped over the lazy dog.',
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync('speech.mp3', buffer);

  console.log('Speech saved to: speech.mp3');
}

// =============================================================================
// ALL 11 VOICES
// =============================================================================

async function allVoices() {
  const voices = [
    'alloy',   // Neutral, balanced
    'ash',     // Clear, professional
    'ballad',  // Warm, storytelling
    'coral',   // Soft, friendly
    'echo',    // Calm, measured
    'fable',   // Expressive, narrative
    'onyx',    // Deep, authoritative
    'nova',    // Bright, energetic
    'sage',    // Wise, thoughtful
    'shimmer', // Gentle, soothing
    'verse',   // Poetic, rhythmic
  ] as const;

  const text = 'Hello, this is a voice sample.';

  for (const voice of voices) {
    console.log(`Generating ${voice} voice...`);

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(`speech-${voice}.mp3`, buffer);

    // Wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('All voice samples generated!');
}

// =============================================================================
// MODEL COMPARISON
// =============================================================================

async function modelComparison() {
  const text = 'This is a test of different TTS models.';

  // tts-1 (standard quality, fastest)
  console.log('Generating with tts-1...');
  const tts1 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
  });

  const buffer1 = Buffer.from(await tts1.arrayBuffer());
  fs.writeFileSync('tts-1-output.mp3', buffer1);

  // tts-1-hd (high quality)
  console.log('Generating with tts-1-hd...');
  const tts1Hd = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'nova',
    input: text,
  });

  const buffer2 = Buffer.from(await tts1Hd.arrayBuffer());
  fs.writeFileSync('tts-1-hd-output.mp3', buffer2);

  console.log('Model comparison complete!');
  console.log('tts-1 file size:', buffer1.length, 'bytes');
  console.log('tts-1-hd file size:', buffer2.length, 'bytes');
}

// =============================================================================
// VOICE INSTRUCTIONS (gpt-4o-mini-tts)
// =============================================================================

async function voiceInstructions() {
  // Example 1: Calm and professional
  const professional = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'nova',
    input: 'Welcome to our customer support line. How can I help you today?',
    instructions: 'Speak in a calm, professional, and friendly tone suitable for customer service.',
  });

  const buffer1 = Buffer.from(await professional.arrayBuffer());
  fs.writeFileSync('professional-tone.mp3', buffer1);

  // Example 2: Energetic and enthusiastic
  const energetic = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'nova',
    input: 'Get ready for the biggest sale of the year! Don\'t miss out!',
    instructions: 'Use an enthusiastic, energetic tone perfect for marketing and advertisements.',
  });

  const buffer2 = Buffer.from(await energetic.arrayBuffer());
  fs.writeFileSync('energetic-tone.mp3', buffer2);

  // Example 3: Calm and soothing
  const soothing = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'shimmer',
    input: 'Take a deep breath. Relax your shoulders. Let all tension fade away.',
    instructions: 'Adopt a calm, soothing voice suitable for meditation and relaxation guidance.',
  });

  const buffer3 = Buffer.from(await soothing.arrayBuffer());
  fs.writeFileSync('soothing-tone.mp3', buffer3);

  console.log('Voice instruction examples generated!');
}

// =============================================================================
// SPEED CONTROL
// =============================================================================

async function speedControl() {
  const text = 'This sentence will be spoken at different speeds.';

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  for (const speed of speeds) {
    console.log(`Generating at ${speed}x speed...`);

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      speed,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(`speech-${speed}x.mp3`, buffer);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('Speed variations generated!');
}

// =============================================================================
// DIFFERENT AUDIO FORMATS
// =============================================================================

async function differentFormats() {
  const text = 'Testing different audio formats.';

  const formats = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'] as const;

  for (const format of formats) {
    console.log(`Generating ${format} format...`);

    const audio = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      response_format: format,
    });

    const buffer = Buffer.from(await audio.arrayBuffer());
    const extension = format === 'pcm' ? 'raw' : format;
    fs.writeFileSync(`speech.${extension}`, buffer);

    console.log(`  ${format}: ${buffer.length} bytes`);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('All format examples generated!');
}

// =============================================================================
// LONG TEXT HANDLING
// =============================================================================

async function longText() {
  const longText = `
    This is a longer piece of text that demonstrates how TTS handles extended content.
    The model can process up to 4096 characters in a single request.
    You can use this for narrating articles, generating audiobooks, or creating voice-overs.
    The speech will maintain natural pacing and intonation throughout.
  `.trim();

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'fable', // Good for narration
    input: longText,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync('long-narration.mp3', buffer);

  console.log('Long narration generated!');
  console.log('Text length:', longText.length, 'characters');
  console.log('Audio size:', buffer.length, 'bytes');
}

// =============================================================================
// STREAMING TTS (Server-Sent Events)
// =============================================================================

async function streamingTTS() {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'nova',
      input: 'This is a streaming audio example. The audio will be generated and delivered in chunks.',
      stream_format: 'sse', // Server-Sent Events
    }),
  });

  console.log('Streaming TTS...');

  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    chunks.push(value);
    console.log('Received chunk:', value.length, 'bytes');
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  fs.writeFileSync('streaming-output.mp3', Buffer.from(combined));
  console.log('Streaming TTS saved to: streaming-output.mp3');
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

async function withErrorHandling() {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: 'Hello world',
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync('output.mp3', buffer);

    return 'output.mp3';
  } catch (error: any) {
    if (error.message.includes('input too long')) {
      console.error('Text exceeds 4096 character limit');
    } else if (error.message.includes('invalid voice')) {
      console.error('Voice not recognized - use one of the 11 supported voices');
    } else if (error.status === 429) {
      console.error('Rate limit exceeded - wait and retry');
    } else {
      console.error('TTS error:', error.message);
    }

    throw error;
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Text-to-Speech Examples ===\n');

  // Example 1: Basic TTS
  console.log('1. Basic TTS:');
  await basicTTS();
  console.log();

  // Example 2: All voices (uncomment to generate all)
  // console.log('2. All 11 Voices:');
  // await allVoices();
  // console.log();

  // Example 3: Model comparison
  console.log('3. Model Comparison:');
  await modelComparison();
  console.log();

  // Example 4: Voice instructions
  console.log('4. Voice Instructions (gpt-4o-mini-tts):');
  await voiceInstructions();
  console.log();

  // Example 5: Speed control
  console.log('5. Speed Control:');
  await speedControl();
  console.log();

  // Example 6: Different formats
  console.log('6. Different Audio Formats:');
  await differentFormats();
  console.log();

  // Example 7: Long text
  console.log('7. Long Text Narration:');
  await longText();
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicTTS,
  allVoices,
  modelComparison,
  voiceInstructions,
  speedControl,
  differentFormats,
  longText,
  streamingTTS,
  withErrorHandling,
};
