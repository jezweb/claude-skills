import type { Collection } from 'tinacms'

/**
 * Documentation Page Collection Template
 *
 * A complete documentation page schema with:
 * - Title, description
 * - Sidebar ordering
 * - Nested folder support
 * - Rich-text content with code blocks
 *
 * Usage:
 * import { docPageCollection } from './collections/doc-page'
 *
 * export default defineConfig({
 *   schema: {
 *     collections: [docPageCollection]
 *   }
 * })
 *
 * File structure supports nested docs:
 * content/docs/
 * ├── getting-started.mdx
 * ├── installation/
 * │   ├── nextjs.mdx
 * │   └── vite.mdx
 * └── api/
 *     ├── authentication.mdx
 *     └── endpoints.mdx
 */
export const docPageCollection: Collection = {
  name: 'doc',
  label: 'Documentation',
  path: 'content/docs',
  format: 'mdx',
  fields: [
    {
      type: 'string',
      name: 'title',
      label: 'Title',
      isTitle: true,
      required: true,
      description: 'Page title shown in sidebar and at top of page',
    },
    {
      type: 'string',
      name: 'description',
      label: 'Description',
      ui: {
        component: 'textarea',
      },
      description: 'Short description shown below title and in search results',
    },
    {
      type: 'number',
      name: 'order',
      label: 'Order',
      description: 'Sort order in sidebar (lower numbers appear first)',
      ui: {
        parse: (val) => Number(val),
      },
    },
    {
      type: 'string',
      name: 'category',
      label: 'Category',
      description: 'Category for grouping related documentation',
      options: [
        { label: 'Getting Started', value: 'getting-started' },
        { label: 'Guides', value: 'guides' },
        { label: 'API Reference', value: 'api' },
        { label: 'Tutorials', value: 'tutorials' },
        { label: 'Examples', value: 'examples' },
      ],
    },
    {
      type: 'datetime',
      name: 'lastUpdated',
      label: 'Last Updated',
      description: 'Automatically updated when page is saved',
      ui: {
        dateFormat: 'YYYY-MM-DD',
      },
    },
    {
      type: 'object',
      name: 'sidebar',
      label: 'Sidebar Configuration',
      fields: [
        {
          type: 'boolean',
          name: 'hide',
          label: 'Hide from Sidebar',
          description: 'If checked, page won\'t appear in sidebar navigation',
        },
        {
          type: 'string',
          name: 'label',
          label: 'Custom Sidebar Label',
          description: 'Override the title shown in sidebar (leave blank to use page title)',
        },
      ],
    },
    {
      type: 'object',
      name: 'navigation',
      label: 'Page Navigation',
      description: 'Configure prev/next links at bottom of page',
      fields: [
        {
          type: 'reference',
          name: 'prev',
          label: 'Previous Page',
          collections: ['doc'],
        },
        {
          type: 'reference',
          name: 'next',
          label: 'Next Page',
          collections: ['doc'],
        },
      ],
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Body',
      isBody: true,
      templates: [
        // Add custom MDX components here if needed
        // Example:
        // {
        //   name: 'Callout',
        //   label: 'Callout',
        //   fields: [
        //     {
        //       name: 'type',
        //       label: 'Type',
        //       type: 'string',
        //       options: ['info', 'warning', 'error', 'success'],
        //     },
        //     {
        //       name: 'children',
        //       label: 'Content',
        //       type: 'rich-text',
        //     },
        //   ],
        // },
      ],
    },
  ],
  ui: {
    router: ({ document }) => {
      // Support nested docs: /docs/installation/nextjs
      const breadcrumbs = document._sys.breadcrumbs.join('/')
      return `/docs/${breadcrumbs}`
    },
    defaultItem: () => ({
      title: 'New Documentation Page',
      category: 'guides',
      lastUpdated: new Date().toISOString(),
      sidebar: {
        hide: false,
      },
    }),
  },
}
