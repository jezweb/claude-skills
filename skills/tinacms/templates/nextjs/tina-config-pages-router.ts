import { defineConfig } from 'tinacms'
import { blogPostCollection } from './collections/blog-post'
import { docPageCollection } from './collections/doc-page'
import { authorCollection } from './collections/author'

/**
 * TinaCMS Configuration for Next.js Pages Router
 *
 * This config file works with Next.js 12 and Pages Router setup.
 *
 * Differences from App Router:
 * - Admin route: pages/admin/[[...index]].tsx (not app/)
 * - Data fetching: getStaticProps + getStaticPaths
 * - Client hook: useTina for visual editing
 *
 * Usage:
 * 1. Copy this file to: tina/config.ts
 * 2. Copy collection files to: tina/collections/
 * 3. Set environment variables in .env.local
 * 4. Run: npm run dev
 * 5. Access admin: http://localhost:3000/admin/index.html
 */

// Get Git branch from environment
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main'

export default defineConfig({
  // Git branch to use
  branch,

  // TinaCloud credentials (get from https://app.tina.io)
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
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

  // Optional: Self-hosted backend configuration
  // contentApiUrlOverride: '/api/tina/gql',
})
