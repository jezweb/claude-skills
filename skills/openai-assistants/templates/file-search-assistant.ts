/**
 * File Search Assistant (RAG)
 *
 * Demonstrates:
 * - Creating a vector store
 * - Uploading documents
 * - Semantic search with file_search tool
 * - Retrieving answers with citations
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('📚 Creating Knowledge Base Assistant...\n');

  // 1. Create a vector store
  const vectorStore = await openai.beta.vectorStores.create({
    name: "Product Documentation",
    expires_after: {
      anchor: "last_active_at",
      days: 7, // Auto-delete after 7 days of inactivity
    },
  });

  console.log(`✅ Vector store created: ${vectorStore.id}\n`);

  // 2. Upload documents to vector store
  // Create sample documents
  const doc1 = `# Product Installation Guide

To install our product:
1. Download the installer from our website
2. Run the installer with administrator privileges
3. Follow the on-screen instructions
4. Restart your computer after installation

System Requirements:
- Windows 10 or later / macOS 11 or later
- 4GB RAM minimum, 8GB recommended
- 500MB free disk space`;

  const doc2 = `# Troubleshooting Guide

Common Issues:

1. Installation Fails
   - Ensure you have administrator privileges
   - Disable antivirus temporarily
   - Check disk space

2. Application Won't Start
   - Update graphics drivers
   - Run compatibility troubleshooter
   - Reinstall the application

3. Performance Issues
   - Close other applications
   - Increase virtual memory
   - Check for updates`;

  fs.writeFileSync('install_guide.md', doc1);
  fs.writeFileSync('troubleshooting.md', doc2);

  // Upload files
  const file1 = await openai.files.create({
    file: fs.createReadStream('install_guide.md'),
    purpose: 'assistants',
  });

  const file2 = await openai.files.create({
    file: fs.createReadStream('troubleshooting.md'),
    purpose: 'assistants',
  });

  console.log(`✅ Files uploaded: ${file1.id}, ${file2.id}\n`);

  // Add files to vector store (batch upload)
  const fileBatch = await openai.beta.vectorStores.fileBatches.create(
    vectorStore.id,
    {
      file_ids: [file1.id, file2.id],
    }
  );

  console.log('⏳ Indexing files...\n');

  // Poll for vector store completion
  let batch = await openai.beta.vectorStores.fileBatches.retrieve(
    vectorStore.id,
    fileBatch.id
  );

  while (batch.status === 'in_progress') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    batch = await openai.beta.vectorStores.fileBatches.retrieve(
      vectorStore.id,
      fileBatch.id
    );
  }

  console.log(`✅ Indexing complete! Status: ${batch.status}\n`);

  // 3. Create assistant with file search
  const assistant = await openai.beta.assistants.create({
    name: "Product Support Assistant",
    instructions: "You are a helpful product support assistant. Use the file search tool to answer questions about installation, troubleshooting, and product usage. Always cite your sources.",
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id],
      },
    },
    model: "gpt-4o",
  });

  console.log(`✅ Assistant created: ${assistant.id}\n`);

  // 4. Create thread and ask questions
  const thread = await openai.beta.threads.create();

  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: "How do I install the product?",
  });

  console.log('❓ Question: How do I install the product?\n');

  // 5. Run
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  // Poll for completion
  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

  while (!['completed', 'failed'].includes(runStatus.status)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }

  // 6. Retrieve response
  const messages = await openai.beta.threads.messages.list(thread.id);
  const response = messages.data[0];

  console.log('💬 Answer:\n');
  for (const content of response.content) {
    if (content.type === 'text') {
      console.log(content.text.value);

      // Check for citations
      if (content.text.annotations && content.text.annotations.length > 0) {
        console.log('\n📎 Citations:');
        for (const annotation of content.text.annotations) {
          if (annotation.type === 'file_citation') {
            console.log(`   File: ${annotation.file_citation.file_id}`);
            console.log(`   Quote: ${annotation.file_citation.quote}`);
          }
        }
      }
    }
  }

  console.log('\n---\n');

  // Ask another question
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: "What should I do if the application won't start?",
  });

  console.log('❓ Question: What should I do if the application won\'t start?\n');

  const run2 = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  let runStatus2 = await openai.beta.threads.runs.retrieve(thread.id, run2.id);

  while (!['completed', 'failed'].includes(runStatus2.status)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus2 = await openai.beta.threads.runs.retrieve(thread.id, run2.id);
  }

  const messages2 = await openai.beta.threads.messages.list(thread.id);
  const response2 = messages2.data[0];

  console.log('💬 Answer:\n');
  for (const content of response2.content) {
    if (content.type === 'text') {
      console.log(content.text.value);
    }
  }

  // 7. Vector store stats
  const storeInfo = await openai.beta.vectorStores.retrieve(vectorStore.id);
  console.log('\n📊 Vector Store Stats:');
  console.log(`   Files: ${storeInfo.file_counts.completed}`);
  console.log(`   Size: ${storeInfo.usage_bytes} bytes`);

  // Cleanup
  fs.unlinkSync('install_guide.md');
  fs.unlinkSync('troubleshooting.md');

  console.log('\n💡 Note: Vector store will auto-delete after 7 days of inactivity');
  console.log(`   Or manually delete with: await openai.beta.vectorStores.del("${vectorStore.id}")`);
}

main().catch(console.error);
