import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cloudflare from '@cloudflare/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({
      // Worker entry point
      main: './backend/src/index.ts',

      // Cloudflare bindings for development
      bindings: {
        // AI binding
        AI: {
          type: 'ai',
        },

        // D1 database (use local for dev)
        DB: {
          type: 'd1',
          databaseName: 'my-app-db',
        },

        // KV namespace (use local for dev)
        KV: {
          type: 'kv',
          id: 'local-kv',
        },

        // R2 bucket (use local for dev)
        BUCKET: {
          type: 'r2',
          bucketName: 'my-app-bucket',
        },

        // Vectorize index (use local for dev)
        VECTORIZE: {
          type: 'vectorize',
          indexName: 'my-app-index',
        },

        // Queue producer (use local for dev)
        QUEUE: {
          type: 'queue',
          queueName: 'my-app-queue',
        },
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/backend': path.resolve(__dirname, './backend'),
    },
  },

  build: {
    outDir: 'dist',
  },
})
