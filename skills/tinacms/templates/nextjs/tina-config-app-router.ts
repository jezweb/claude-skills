import { defineConfig } from 'tinacms'
import { blogPostCollection } from './collections/blog-post'
import { docPageCollection } from './collections/doc-page'
import { authorCollection } from './collections/author'

/**
 * TinaCMS Configuration for Next.js App Router
 *
 * This config file:
 * - Sets up TinaCloud connection (or self-hosted)
 * - Defines content collections and their schemas
 * - Configures media handling
 * - Sets up build output
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
    outputFolder: 'admin',      // Where admin UI is built
    publicFolder: 'public',     // Your public assets folder
  },

  // Media configuration
  media: {
    tina: {
      mediaRoot: 'uploads',     // Subfolder for uploads
      publicFolder: 'public',   // Where files are stored
    },
  },

  // Content schema
  schema: {
    collections: [
      // Import your collections here
      blogPostCollection,
      authorCollection,
      docPageCollection,

      // Or define collections inline:
      // {
      //   name: 'post',
      //   label: 'Blog Posts',
      //   path: 'content/posts',
      //   format: 'mdx',
      //   fields: [
      //     {
      //       type: 'string',
      //       name: 'title',
      //       label: 'Title',
      //       isTitle: true,
      //       required: true,
      //     },
      //     {
      //       type: 'rich-text',
      //       name: 'body',
      //       label: 'Body',
      //       isBody: true,
      //     },
      //   ],
      // },
    ],
  },

  // Optional: Self-hosted backend configuration
  // Uncomment if using self-hosted backend
  // contentApiUrlOverride: '/api/tina/gql',
})
