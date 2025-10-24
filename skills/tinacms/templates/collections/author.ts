import type { Collection } from 'tinacms'

/**
 * Author Collection Template
 *
 * A complete author schema for blog post references:
 * - Name, email
 * - Avatar image
 * - Bio
 * - Social media links
 *
 * Usage:
 * import { authorCollection } from './collections/author'
 *
 * export default defineConfig({
 *   schema: {
 *     collections: [authorCollection, blogPostCollection]
 *   }
 * })
 *
 * Then reference in blog posts:
 * {
 *   type: 'reference',
 *   name: 'author',
 *   collections: ['author']
 * }
 */
export const authorCollection: Collection = {
  name: 'author',
  label: 'Authors',
  path: 'content/authors',
  format: 'json',
  fields: [
    {
      type: 'string',
      name: 'name',
      label: 'Name',
      isTitle: true,
      required: true,
      description: 'Author\'s full name',
    },
    {
      type: 'string',
      name: 'email',
      label: 'Email',
      required: true,
      ui: {
        validate: (value) => {
          if (!value) {
            return 'Email is required'
          }
          if (!value.includes('@')) {
            return 'Invalid email address'
          }
        },
      },
      description: 'Contact email address',
    },
    {
      type: 'string',
      name: 'role',
      label: 'Role',
      description: 'Job title or role (e.g., "Senior Developer", "Content Writer")',
    },
    {
      type: 'image',
      name: 'avatar',
      label: 'Avatar',
      description: 'Profile picture (square, 400x400px recommended)',
    },
    {
      type: 'string',
      name: 'bio',
      label: 'Bio',
      ui: {
        component: 'textarea',
      },
      description: 'Short biography (150-200 characters)',
    },
    {
      type: 'object',
      name: 'social',
      label: 'Social Media Links',
      fields: [
        {
          type: 'string',
          name: 'twitter',
          label: 'Twitter',
          description: 'Twitter/X username (without @)',
        },
        {
          type: 'string',
          name: 'github',
          label: 'GitHub',
          description: 'GitHub username',
        },
        {
          type: 'string',
          name: 'linkedin',
          label: 'LinkedIn',
          description: 'LinkedIn profile URL',
        },
        {
          type: 'string',
          name: 'website',
          label: 'Personal Website',
          description: 'Full URL to personal website',
        },
      ],
    },
    {
      type: 'boolean',
      name: 'active',
      label: 'Active Author',
      required: true,
      description: 'Uncheck to hide author from listings',
      ui: {
        component: 'toggle',
      },
    },
  ],
  ui: {
    defaultItem: () => ({
      active: true,
    }),
  },
}
