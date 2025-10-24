import type { Collection } from 'tinacms'

/**
 * Landing Page Collection Template
 *
 * A complete landing page schema with multiple templates:
 * - Basic page (simple content)
 * - Marketing page (hero, features, CTA)
 *
 * Usage:
 * import { landingPageCollection } from './collections/landing-page'
 *
 * export default defineConfig({
 *   schema: {
 *     collections: [landingPageCollection]
 *   }
 * })
 *
 * When using templates, documents must include _template field:
 * ---
 * _template: marketing
 * title: Homepage
 * ---
 */
export const landingPageCollection: Collection = {
  name: 'page',
  label: 'Landing Pages',
  path: 'content/pages',
  format: 'mdx',
  templates: [
    {
      name: 'basic',
      label: 'Basic Page',
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
          name: 'description',
          label: 'Description',
          ui: {
            component: 'textarea',
          },
        },
        {
          type: 'rich-text',
          name: 'body',
          label: 'Body',
          isBody: true,
        },
      ],
    },
    {
      name: 'marketing',
      label: 'Marketing Page',
      ui: {
        defaultItem: {
          hero: {
            buttonText: 'Get Started',
          },
          features: [],
        },
      },
      fields: [
        {
          type: 'string',
          name: 'title',
          label: 'Title',
          isTitle: true,
          required: true,
          description: 'Page title (used in browser tab and SEO)',
        },
        {
          type: 'object',
          name: 'hero',
          label: 'Hero Section',
          fields: [
            {
              type: 'string',
              name: 'headline',
              label: 'Headline',
              required: true,
              description: 'Main headline (45-65 characters works best)',
            },
            {
              type: 'string',
              name: 'subheadline',
              label: 'Subheadline',
              ui: {
                component: 'textarea',
              },
              description: 'Supporting text below headline (150-200 characters)',
            },
            {
              type: 'image',
              name: 'image',
              label: 'Hero Image',
              description: 'Main hero image (1920x1080px recommended)',
            },
            {
              type: 'string',
              name: 'buttonText',
              label: 'Button Text',
              description: 'Call-to-action button text',
            },
            {
              type: 'string',
              name: 'buttonUrl',
              label: 'Button URL',
              description: 'Where the CTA button links to',
            },
          ],
        },
        {
          type: 'object',
          name: 'features',
          label: 'Features Section',
          list: true,
          ui: {
            itemProps: (item) => ({
              label: item?.title || 'New Feature',
            }),
          },
          fields: [
            {
              type: 'image',
              name: 'icon',
              label: 'Icon',
              description: 'Feature icon (SVG or PNG, 64x64px)',
            },
            {
              type: 'string',
              name: 'title',
              label: 'Title',
              required: true,
            },
            {
              type: 'string',
              name: 'description',
              label: 'Description',
              ui: {
                component: 'textarea',
              },
            },
          ],
        },
        {
          type: 'object',
          name: 'testimonials',
          label: 'Testimonials',
          list: true,
          ui: {
            itemProps: (item) => ({
              label: item?.author || 'New Testimonial',
            }),
          },
          fields: [
            {
              type: 'string',
              name: 'quote',
              label: 'Quote',
              required: true,
              ui: {
                component: 'textarea',
              },
            },
            {
              type: 'string',
              name: 'author',
              label: 'Author',
              required: true,
            },
            {
              type: 'string',
              name: 'role',
              label: 'Role',
              description: 'Job title and company',
            },
            {
              type: 'image',
              name: 'avatar',
              label: 'Avatar',
              description: 'Author photo (square, 200x200px)',
            },
          ],
        },
        {
          type: 'object',
          name: 'cta',
          label: 'Call to Action',
          fields: [
            {
              type: 'string',
              name: 'headline',
              label: 'Headline',
              required: true,
            },
            {
              type: 'string',
              name: 'text',
              label: 'Supporting Text',
              ui: {
                component: 'textarea',
              },
            },
            {
              type: 'string',
              name: 'buttonText',
              label: 'Button Text',
              required: true,
            },
            {
              type: 'string',
              name: 'buttonUrl',
              label: 'Button URL',
              required: true,
            },
          ],
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
              description: 'SEO title (leave blank to use page title)',
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
      ],
    },
  ],
  ui: {
    router: ({ document }) => {
      // Root pages like /about, /pricing
      return `/${document._sys.filename}`
    },
  },
}
