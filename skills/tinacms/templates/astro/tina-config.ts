import { defineConfig } from 'tinacms'
import { blogPostCollection } from './collections/blog-post'
import { docPageCollection } from './collections/doc-page'
import { authorCollection } from './collections/author'

/**
 * TinaCMS Configuration for Astro
 *
 * This config works with Astro static site generator.
 *
 * Key Points:
 * - Visual editing is experimental (requires React components)
 * - Best for content-focused static sites
 * - Environment variables use PUBLIC_ prefix
 * - Admin interface requires React integration
 *
 * Usage:
 * 1. Copy this file to: tina/config.ts
 * 2. Copy collection files to: tina/collections/
 * 3. Set environment variables in .env
 * 4. Run: npm run dev
 * 5. Access admin: http://localhost:4321/admin/index.html
 */

// Get Git branch from environment
const branch =
  process.env.PUBLIC_GITHUB_BRANCH ||
  process.env.PUBLIC_VERCEL_GIT_COMMIT_REF ||
  'main'

export default defineConfig({
  // Git branch to use
  branch,

  // TinaCloud credentials
  // Note: Astro requires PUBLIC_ prefix for client-exposed variables
  clientId: process.env.PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

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
