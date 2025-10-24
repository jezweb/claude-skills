import type { Collection } from 'tinacms'

/**
 * Blog Post Collection Template
 *
 * A complete blog post schema with:
 * - Title, excerpt, cover image
 * - Author reference
 * - Published date
 * - Draft status
 * - Rich-text body content
 *
 * Usage:
 * import { blogPostCollection } from './collections/blog-post'
 *
 * export default defineConfig({
 *   schema: {
 *     collections: [blogPostCollection]
 *   }
 * })
 */
export const blogPostCollection: Collection = {
  name: 'post',
  label: 'Blog Posts',
  path: 'content/posts',
  format: 'mdx',
  fields: [
    {
      type: 'string',
      name: 'title',
      label: 'Title',
      isTitle: true,
      required: true,
    },
    {
      type: 'string',
      name: 'excerpt',
      label: 'Excerpt',
      ui: {
        component: 'textarea',
      },
      description: 'Short summary shown in post listings (150-200 characters)',
    },
    {
      type: 'image',
      name: 'coverImage',
      label: 'Cover Image',
      description: 'Main image shown at top of post and in listings',
    },
    {
      type: 'datetime',
      name: 'date',
      label: 'Published Date',
      required: true,
      ui: {
        dateFormat: 'YYYY-MM-DD',
      },
    },
    {
      type: 'reference',
      name: 'author',
      label: 'Author',
      collections: ['author'],
      description: 'Select the author of this post',
    },
    {
      type: 'string',
      name: 'category',
      label: 'Category',
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Design', value: 'design' },
        { label: 'Business', value: 'business' },
        { label: 'Tutorials', value: 'tutorials' },
      ],
    },
    {
      type: 'string',
      name: 'tags',
      label: 'Tags',
      list: true,
      description: 'Add tags for post categorization and search',
    },
    {
      type: 'boolean',
      name: 'draft',
      label: 'Draft',
      required: true,
      description: 'If checked, post will not be published',
      ui: {
        component: 'toggle',
      },
    },
    {
      type: 'boolean',
      name: 'featured',
      label: 'Featured Post',
      description: 'Show this post prominently on homepage',
    },
    {
      type: 'object',
      name: 'seo',
      label: 'SEO Metadata',
      fields: [
        {
          type: 'string',
          name: 'metaTitle',
          label: 'Meta Title',
          description: 'SEO title (leave blank to use post title)',
        },
        {
          type: 'string',
          name: 'metaDescription',
          label: 'Meta Description',
          ui: {
            component: 'textarea',
          },
          description: 'SEO description (150-160 characters)',
        },
        {
          type: 'image',
          name: 'ogImage',
          label: 'Open Graph Image',
          description: 'Image for social media sharing (1200x630px)',
        },
      ],
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Body',
      isBody: true,
    },
  ],
  ui: {
    router: ({ document }) => {
      return `/blog/${document._sys.filename}`
    },
    defaultItem: () => ({
      title: 'New Post',
      date: new Date().toISOString(),
      draft: true,
      featured: false,
    }),
  },
}
