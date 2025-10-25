/**
 * Multimodal Video and Audio Understanding with Gemini API
 *
 * Demonstrates:
 * - Video analysis (what happens in the video)
 * - Audio transcription and understanding
 * - PDF document parsing
 * - Combining multiple modalities
 *
 * Prerequisites:
 * - npm install @google/genai@1.27.0
 * - export GEMINI_API_KEY="..."
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Example 1: Analyze video
    console.log('Example 1: Video Analysis\n');

    const videoPath = '/path/to/video.mp4'; // Replace with actual path
    const videoData = fs.readFileSync(videoPath);
    const base64Video = videoData.toString('base64');

    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'Describe what happens in this video. Summarize the key events.' },
            {
              inlineData: {
                data: base64Video,
                mimeType: 'video/mp4'
              }
            }
          ]
        }
      ]
    });

    console.log(response1.text);
    console.log('\n---\n');

    // Example 2: Transcribe and analyze audio
    console.log('Example 2: Audio Transcription and Analysis\n');

    const audioPath = '/path/to/audio.mp3'; // Replace with actual path
    const audioData = fs.readFileSync(audioPath);
    const base64Audio = audioData.toString('base64');

    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'Transcribe this audio and provide a summary of the main points discussed.' },
            {
              inlineData: {
                data: base64Audio,
                mimeType: 'audio/mp3'
              }
            }
          ]
        }
      ]
    });

    console.log(response2.text);
    console.log('\n---\n');

    // Example 3: Parse PDF document
    console.log('Example 3: PDF Document Parsing\n');

    const pdfPath = '/path/to/document.pdf'; // Replace with actual path
    const pdfData = fs.readFileSync(pdfPath);
    const base64Pdf = pdfData.toString('base64');

    const response3 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'Summarize the key points in this PDF document. Extract any important data or conclusions.' },
            {
              inlineData: {
                data: base64Pdf,
                mimeType: 'application/pdf'
              }
            }
          ]
        }
      ]
    });

    console.log(response3.text);
    console.log('\n---\n');

    // Example 4: Combine multiple modalities
    console.log('Example 4: Multiple Modalities (Video + Text Questions)\n');

    const response4 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: 'Based on this video, answer these questions:\n1. How many people appear?\n2. What is the main activity?\n3. Where does this take place?' },
            { inlineData: { data: base64Video, mimeType: 'video/mp4' } }
          ]
        }
      ]
    });

    console.log(response4.text);

  } catch (error: any) {
    console.error('Error:', error.message);

    if (error.message.includes('ENOENT')) {
      console.error('\n⚠️ File not found. Update the file path variables with valid paths.');
    }
  }
}

/**
 * Supported Video Formats:
 * - MP4, MPEG, MOV, AVI, FLV, MPG, WebM, WMV
 * Max size: 2GB (use File API for larger - Phase 2)
 * Max length (inline): 2 minutes
 *
 * Supported Audio Formats:
 * - MP3, WAV, FLAC, AAC, OGG, OPUS
 * Max size: 20MB
 *
 * PDF:
 * - Max size: 30MB
 * - Text-based PDFs work best
 * - Scanned images may have lower accuracy
 *
 * Tips:
 * - For videos > 2 minutes, use the File API (Phase 2)
 * - Specific prompts yield better results
 * - You can combine text, images, video, audio, and PDFs in one request
 */

main();
