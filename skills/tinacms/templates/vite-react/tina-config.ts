import { defineConfig } from 'tinacms'
import { blogPostCollection } from './collections/blog-post'
import { docPageCollection } from './collections/doc-page'
import { authorCollection } from './collections/author'

/**
 * TinaCMS Configuration for Vite + React
 *
 * This config works with Vite + React applications.
 *
 * Key Differences from Next.js:
 * - Environment variables use VITE_ prefix
 * - Admin interface setup is more manual
 * - Data fetching requires custom implementation
 *
 * Usage:
 * 1. Copy this file to: tina/config.ts
 * 2. Copy collection files to: tina/collections/
 * 3. Set environment variables in .env
 * 4. Run: npm run dev
 * 5. Access admin: http://localhost:3000/admin/index.html
 *
 * Visual Editing:
 * - Import useTina from 'tinacms/dist/react'
 * - Wrap your components with useTina hook
 * - See templates for examples
 */

// Get Git branch from environment
const branch =
  process.env.VITE_GITHUB_BRANCH ||
  process.env.VITE_VERCEL_GIT_COMMIT_REF ||
  'main'

export default defineConfig({
  // Git branch to use
  branch,

  // TinaCloud credentials
  // Note: Use VITE_ prefix for Vite environment variables
  clientId: process.env.VITE_TINA_CLIENT_ID,
  token: process.env.VITE_TINA_TOKEN,

  // Build configuration
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  // Media configuration
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },

  // Content schema
  schema: {
    collections: [
      blogPostCollection,
      authorCollection,
      docPageCollection,
    ],
  },

  // Optional: Self-hosted backend
  // contentApiUrlOverride: '/api/tina/gql',
})
