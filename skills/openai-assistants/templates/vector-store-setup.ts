/**
 * Vector Store Setup
 *
 * Demonstrates:
 * - Creating vector stores
 * - Batch file uploads
 * - Monitoring indexing progress
 * - Vector store management
 * - Cost optimization
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('📦 Vector Store Setup Guide\n');

  // 1. Create a vector store
  console.log('Step 1: Creating vector store...\n');

  const vectorStore = await openai.beta.vectorStores.create({
    name: "Company Knowledge Base",
    metadata: {
      department: "engineering",
      version: "1.0",
    },
    expires_after: {
      anchor: "last_active_at",
      days: 30, // Auto-delete after 30 days of inactivity
    },
  });

  console.log(`✅ Vector store created: ${vectorStore.id}`);
  console.log(`   Name: ${vectorStore.name}`);
  console.log(`   Status: ${vectorStore.status}`);
  console.log(`   Auto-expires: ${vectorStore.expires_after?.days} days after last use\n`);

  // 2. Prepare sample documents
  console.log('Step 2: Preparing documents...\n');

  const documents = [
    {
      filename: 'api_docs.md',
      content: `# API Documentation

## Authentication
All API requests require an API key in the Authorization header.

## Rate Limits
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour

## Endpoints
- GET /api/users - List users
- POST /api/users - Create user
- GET /api/users/:id - Get user details`,
    },
    {
      filename: 'deployment_guide.md',
      content: `# Deployment Guide

## Prerequisites
- Docker installed
- Kubernetes cluster running
- kubectl configured

## Steps
1. Build Docker image: docker build -t app:latest .
2. Push to registry: docker push registry/app:latest
3. Deploy: kubectl apply -f deployment.yaml
4. Verify: kubectl get pods`,
    },
    {
      filename: 'security_policy.md',
      content: `# Security Policy

## Password Requirements
- Minimum 12 characters
- Must include uppercase, lowercase, numbers, symbols
- Cannot reuse last 5 passwords

## Access Control
- Use SSO for authentication
- Enable 2FA for all accounts
- Review access logs monthly

## Incident Response
- Report security issues to security@company.com
- Critical incidents escalated within 1 hour`,
    },
  ];

  // Write files to disk
  const fileIds: string[] = [];

  for (const doc of documents) {
    fs.writeFileSync(doc.filename, doc.content);
    console.log(`   📄 Created: ${doc.filename}`);
  }

  // 3. Upload files
  console.log('\nStep 3: Uploading files to OpenAI...\n');

  for (const doc of documents) {
    const file = await openai.files.create({
      file: fs.createReadStream(doc.filename),
      purpose: 'assistants',
    });

    fileIds.push(file.id);
    console.log(`   ✅ Uploaded: ${doc.filename} (${file.id})`);

    // Clean up local file
    fs.unlinkSync(doc.filename);
  }

  // 4. Add files to vector store (batch upload)
  console.log('\nStep 4: Adding files to vector store...\n');

  const fileBatch = await openai.beta.vectorStores.fileBatches.create(
    vectorStore.id,
    {
      file_ids: fileIds,
    }
  );

  console.log(`   📦 Batch created: ${fileBatch.id}`);
  console.log(`   Files in batch: ${fileBatch.file_counts.total}`);

  // 5. Monitor indexing progress
  console.log('\nStep 5: Monitoring indexing progress...\n');

  let batch = fileBatch;
  let lastStatus = '';

  while (batch.status === 'in_progress') {
    batch = await openai.beta.vectorStores.fileBatches.retrieve(
      vectorStore.id,
      fileBatch.id
    );

    const statusMsg = `   Status: ${batch.status} | ` +
      `Completed: ${batch.file_counts.completed}/${batch.file_counts.total} | ` +
      `Failed: ${batch.file_counts.failed}`;

    if (statusMsg !== lastStatus) {
      console.log(statusMsg);
      lastStatus = statusMsg;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n   ✅ Indexing ${batch.status}!`);

  if (batch.file_counts.failed > 0) {
    console.log(`   ⚠️  ${batch.file_counts.failed} files failed to index`);

    // List failed files
    const files = await openai.beta.vectorStores.files.list(vectorStore.id);
    for (const file of files.data) {
      if (file.status === 'failed') {
        console.log(`      - File ${file.id}: ${file.last_error?.message}`);
      }
    }
  }

  // 6. Get vector store details
  console.log('\nStep 6: Vector store statistics...\n');

  const updatedStore = await openai.beta.vectorStores.retrieve(vectorStore.id);

  console.log(`   📊 Statistics:`);
  console.log(`      Total files: ${updatedStore.file_counts.completed}`);
  console.log(`      Storage used: ${updatedStore.usage_bytes} bytes (${(updatedStore.usage_bytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`      Status: ${updatedStore.status}`);

  // 7. Cost estimation
  const storageMB = updatedStore.usage_bytes / 1024 / 1024;
  const storageGB = storageMB / 1024;
  const costPerDay = Math.max(0, (storageGB - 1) * 0.10); // First 1GB free, then $0.10/GB/day
  const costPerMonth = costPerDay * 30;

  console.log(`\n   💰 Cost Estimation:`);
  console.log(`      Storage: ${storageGB.toFixed(4)} GB`);
  console.log(`      Cost per day: $${costPerDay.toFixed(4)} (first 1GB free)`);
  console.log(`      Cost per month: $${costPerMonth.toFixed(2)}`);

  // 8. List all files in vector store
  console.log('\nStep 7: Files in vector store...\n');

  const filesInStore = await openai.beta.vectorStores.files.list(vectorStore.id);

  for (const file of filesInStore.data) {
    console.log(`   📄 ${file.id}`);
    console.log(`      Status: ${file.status}`);
    console.log(`      Created: ${new Date(file.created_at * 1000).toISOString()}`);
  }

  // 9. Management operations
  console.log('\nStep 8: Management operations...\n');

  // Update vector store metadata
  const updated = await openai.beta.vectorStores.update(vectorStore.id, {
    metadata: {
      department: "engineering",
      version: "1.0",
      last_updated: new Date().toISOString(),
    },
  });

  console.log('   ✅ Metadata updated');

  // List all vector stores
  const allStores = await openai.beta.vectorStores.list({ limit: 5 });
  console.log(`\n   📚 Total vector stores in account: ${allStores.data.length}`);

  for (const store of allStores.data) {
    console.log(`      - ${store.name} (${store.id}): ${store.file_counts.completed} files`);
  }

  // 10. Cleanup instructions
  console.log('\n💡 Cleanup Instructions:\n');
  console.log('   To delete individual files:');
  console.log(`      await openai.beta.vectorStores.files.del("${vectorStore.id}", "file_id");`);
  console.log('');
  console.log('   To delete entire vector store:');
  console.log(`      await openai.beta.vectorStores.del("${vectorStore.id}");`);
  console.log('');
  console.log('   Note: Vector store will auto-delete after 30 days of inactivity (configured above)');

  console.log('\n✅ Vector store setup complete!');
  console.log(`\n🔑 Save this ID to use with assistants:`);
  console.log(`   ${vectorStore.id}`);
}

main().catch(console.error);
