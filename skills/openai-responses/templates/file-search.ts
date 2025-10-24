/**
 * File Search Example
 *
 * Demonstrates RAG (Retrieval-Augmented Generation) without building
 * your own vector store. OpenAI handles embeddings and search automatically.
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicFileSearch() {
  console.log('=== Basic File Search ===\n');

  // 1. Upload file (one-time setup)
  const file = await openai.files.create({
    file: fs.createReadStream('./knowledge-base.pdf'),
    purpose: 'assistants',
  });

  console.log('File uploaded:', file.id);

  // 2. Search file for information
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What does the document say about pricing?',
    tools: [
      {
        type: 'file_search',
        file_ids: [file.id],
      },
    ],
  });

  console.log('Answer:', response.output_text);

  // 3. Inspect search results
  response.output.forEach((item) => {
    if (item.type === 'file_search_call') {
      console.log('\nSearch query:', item.query);
      console.log('Relevant chunks:', item.results.length);

      item.results.forEach((result, idx) => {
        console.log(`\nChunk ${idx + 1}:`);
        console.log('Text:', result.text.substring(0, 200) + '...');
        console.log('Score:', result.score);
        console.log('File:', result.file_id);
      });
    }
  });
}

async function multipleFileSearch() {
  console.log('=== Multiple File Search ===\n');

  // Upload multiple files
  const file1 = await openai.files.create({
    file: fs.createReadStream('./product-guide.pdf'),
    purpose: 'assistants',
  });

  const file2 = await openai.files.create({
    file: fs.createReadStream('./pricing-doc.pdf'),
    purpose: 'assistants',
  });

  const file3 = await openai.files.create({
    file: fs.createReadStream('./faq.pdf'),
    purpose: 'assistants',
  });

  // Search across all files
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'What are the key features and how much does the premium plan cost?',
    tools: [
      {
        type: 'file_search',
        file_ids: [file1.id, file2.id, file3.id], // ✅ Multiple files
      },
    ],
  });

  console.log('Answer (synthesized from all files):', response.output_text);
}

async function conversationalFileSearch() {
  console.log('=== Conversational File Search ===\n');

  // Upload knowledge base
  const file = await openai.files.create({
    file: fs.createReadStream('./company-handbook.pdf'),
    purpose: 'assistants',
  });

  // Create conversation
  const conv = await openai.conversations.create();

  // First question
  const response1 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'What is the PTO policy?',
    tools: [{ type: 'file_search', file_ids: [file.id] }],
  });

  console.log('Q1:', response1.output_text);

  // Follow-up question (model remembers previous answer)
  const response2 = await openai.responses.create({
    model: 'gpt-5',
    conversation: conv.id,
    input: 'How do I request it?',
    tools: [{ type: 'file_search', file_ids: [file.id] }],
  });

  console.log('Q2:', response2.output_text);
  // Model knows "it" refers to PTO from previous turn
}

async function fileSearchWithCitations() {
  console.log('=== File Search with Citations ===\n');

  const file = await openai.files.create({
    file: fs.createReadStream('./research-paper.pdf'),
    purpose: 'assistants',
  });

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Summarize the key findings and provide citations',
    tools: [{ type: 'file_search', file_ids: [file.id] }],
  });

  console.log('Summary:', response.output_text);

  // Extract citations
  response.output.forEach((item) => {
    if (item.type === 'file_search_call') {
      console.log('\nCitations:');
      item.results.forEach((result, idx) => {
        console.log(`[${idx + 1}] File: ${result.file_id}, Page: ${result.page || 'N/A'}`);
      });
    }
  });
}

async function filterSearchResults() {
  console.log('=== Filter Search Results by Relevance ===\n');

  const file = await openai.files.create({
    file: fs.createReadStream('./large-document.pdf'),
    purpose: 'assistants',
  });

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Find all mentions of "quarterly revenue" in the document',
    tools: [{ type: 'file_search', file_ids: [file.id] }],
  });

  // Filter high-confidence results
  response.output.forEach((item) => {
    if (item.type === 'file_search_call') {
      const highConfidence = item.results.filter((r) => r.score > 0.7);

      console.log(`Found ${highConfidence.length} high-confidence matches:`);
      highConfidence.forEach((result) => {
        console.log('Text:', result.text);
        console.log('Score:', result.score);
        console.log('---');
      });
    }
  });
}

async function supportedFileTypes() {
  console.log('=== Supported File Types ===\n');

  // Upload different file types
  const pdfFile = await openai.files.create({
    file: fs.createReadStream('./document.pdf'),
    purpose: 'assistants',
  });

  const textFile = await openai.files.create({
    file: fs.createReadStream('./notes.txt'),
    purpose: 'assistants',
  });

  const markdownFile = await openai.files.create({
    file: fs.createReadStream('./README.md'),
    purpose: 'assistants',
  });

  const codeFile = await openai.files.create({
    file: fs.createReadStream('./main.ts'),
    purpose: 'assistants',
  });

  // Search across different file types
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: 'Find information about the authentication system',
    tools: [
      {
        type: 'file_search',
        file_ids: [pdfFile.id, textFile.id, markdownFile.id, codeFile.id],
      },
    ],
  });

  console.log('Answer:', response.output_text);
}

async function handleFileSearchErrors() {
  console.log('=== Error Handling ===\n');

  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input: 'Search for information',
      tools: [
        {
          type: 'file_search',
          file_ids: ['file_invalid'], // ❌ Invalid file ID
        },
      ],
    });
  } catch (error: any) {
    if (error.type === 'invalid_request_error') {
      console.error('File not found. Upload file first.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function listUploadedFiles() {
  console.log('=== List Uploaded Files ===\n');

  const files = await openai.files.list({
    purpose: 'assistants',
  });

  console.log(`Found ${files.data.length} files:`);
  files.data.forEach((file) => {
    console.log('ID:', file.id);
    console.log('Filename:', file.filename);
    console.log('Size:', file.bytes, 'bytes');
    console.log('Created:', new Date(file.created_at * 1000));
    console.log('---');
  });
}

async function deleteFile(fileId: string) {
  // Delete file (cleanup)
  await openai.files.delete(fileId);
  console.log('File deleted:', fileId);
}

// Run examples
// basicFileSearch();
// multipleFileSearch();
// conversationalFileSearch();
// fileSearchWithCitations();
// filterSearchResults();
// listUploadedFiles();
