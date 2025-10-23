#!/bin/bash
# Initialize all Cloudflare services

set -e

echo "Initializing Cloudflare services..."
echo ""

# D1 Database
echo "Creating D1 database..."
npx wrangler d1 create my-app-db
echo "→ Copy the database_id to wrangler.jsonc"
echo ""

# KV Namespace
echo "Creating KV namespace..."
npx wrangler kv:namespace create my-app-kv
echo "→ Copy the id to wrangler.jsonc"
echo ""

# R2 Bucket
echo "Creating R2 bucket..."
npx wrangler r2 bucket create my-app-bucket
echo "✓ R2 bucket created (bucket_name already in wrangler.jsonc)"
echo ""

# Vectorize Index
echo "Creating Vectorize index..."
npx wrangler vectorize create my-app-index --dimensions=1536 --metric=cosine
echo "✓ Vectorize index created (index_name already in wrangler.jsonc)"
echo ""

# Queue
echo "Creating Queue..."
npx wrangler queues create my-app-queue
echo "✓ Queue created (queue name already in wrangler.jsonc)"
echo ""

echo "✓ All services created!"
echo ""
echo "Next steps:"
echo "  1. Update wrangler.jsonc with the database_id and kv id from above"
echo "  2. Run: npm run d1:local (to create database tables)"
echo "  3. Run: npm run dev"
