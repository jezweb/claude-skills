/**
 * OpenAI Audio API - Whisper Transcription Examples
 *
 * This template demonstrates:
 * - Basic audio transcription
 * - Supported audio formats
 * - Both SDK and fetch approaches
 * - Error handling
 */

import OpenAI from 'openai';
import fs from 'fs';
import FormData from 'form-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// BASIC TRANSCRIPTION (SDK)
// =============================================================================

async function basicTranscription() {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream('./audio.mp3'),
    model: 'whisper-1',
  });

  console.log('Transcription:', transcription.text);

  return transcription.text;
}

// =============================================================================
// TRANSCRIPTION WITH FETCH
// =============================================================================

async function transcriptionFetch() {
  const formData = new FormData();
  formData.append('file', fs.createReadStream('./audio.mp3'));
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const data: any = await response.json();
  console.log('Transcription:', data.text);

  return data.text;
}

// =============================================================================
// MULTIPLE AUDIO FORMATS
// =============================================================================

async function multipleFormats() {
  const formats = ['mp3', 'wav', 'm4a', 'webm'];

  for (const format of formats) {
    const filename = `./audio.${format}`;

    if (fs.existsSync(filename)) {
      console.log(`Transcribing ${format}...`);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filename),
        model: 'whisper-1',
      });

      console.log(`${format.toUpperCase()}: ${transcription.text}`);
    } else {
      console.log(`${filename} not found, skipping...`);
    }
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

async function withErrorHandling(audioFilePath: string) {
  try {
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Check file size (Whisper has limits)
    const stats = fs.statSync(audioFilePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);

    if (fileSizeMB > 25) {
      console.warn('Warning: File larger than 25MB may be rejected');
    }

    // Transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
    });

    return transcription.text;
  } catch (error: any) {
    if (error.message.includes('file not found')) {
      console.error('Audio file not found');
    } else if (error.message.includes('file too large')) {
      console.error('Audio file exceeds size limit');
    } else if (error.message.includes('unsupported format')) {
      console.error('Audio format not supported');
    } else {
      console.error('Transcription error:', error.message);
    }

    throw error;
  }
}

// =============================================================================
// BATCH TRANSCRIPTION
// =============================================================================

async function batchTranscription(audioFiles: string[]) {
  const results = [];

  for (const filePath of audioFiles) {
    console.log(`Transcribing: ${filePath}`);

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
      });

      results.push({
        file: filePath,
        text: transcription.text,
        success: true,
      });

      console.log(`✓ ${filePath}: ${transcription.text.substring(0, 50)}...`);
    } catch (error: any) {
      results.push({
        file: filePath,
        error: error.message,
        success: false,
      });

      console.error(`✗ ${filePath}: ${error.message}`);
    }

    // Wait 1 second between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\nCompleted: ${results.filter(r => r.success).length}/${results.length}`);

  return results;
}

// =============================================================================
// SAVE TRANSCRIPTION TO FILE
// =============================================================================

async function transcribeAndSave(audioFilePath: string, outputFilePath: string) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
  });

  fs.writeFileSync(outputFilePath, transcription.text);

  console.log(`Transcription saved to: ${outputFilePath}`);
  console.log(`Content: ${transcription.text}`);

  return transcription.text;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Whisper Transcription Examples ===\n');

  console.log('Note: This script requires audio files to run.');
  console.log('Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm\n');

  // Example 1: Basic transcription (uncomment when you have audio.mp3)
  // console.log('1. Basic Transcription:');
  // await basicTranscription();
  // console.log();

  // Example 2: Transcription with fetch
  // console.log('2. Transcription with Fetch:');
  // await transcriptionFetch();
  // console.log();

  // Example 3: Multiple formats
  // console.log('3. Multiple Formats:');
  // await multipleFormats();
  // console.log();

  // Example 4: Save to file
  // console.log('4. Transcribe and Save:');
  // await transcribeAndSave('./audio.mp3', './transcription.txt');
  // console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicTranscription,
  transcriptionFetch,
  multipleFormats,
  withErrorHandling,
  batchTranscription,
  transcribeAndSave,
};
