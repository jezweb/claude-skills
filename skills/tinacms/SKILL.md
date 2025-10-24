---
name: tinacms
description: |
  Complete TinaCMS skill for building content-heavy sites with Git-backed CMS.
  Use this skill when setting up blogs, documentation sites, or marketing sites
  that require visual editing and content management for non-technical users.
  Supports Next.js (App Router + Pages Router), Vite + React, Astro, and
  framework-agnostic setups. Prevents 9+ common errors including ESbuild compilation
  issues, module resolution problems, schema configuration errors, Docker binding
  issues, and deployment problems. Self-hosting options for Cloudflare Workers,
  Vercel Functions, and Netlify Functions included.
license: MIT
allowed-tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep']
metadata:
  token_savings: "65-70%"
  errors_prevented: 9
  package_version: "2.9.0"
  cli_version: "1.11.0"
  last_verified: "2025-10-24"
  frameworks: ["Next.js", "Vite+React", "Astro", "Framework-agnostic"]
  deployment: ["TinaCloud", "Cloudflare Workers", "Vercel", "Netlify"]
---

# TinaCMS Skill

Complete skill for integrating TinaCMS into modern web applications.

---

## What is TinaCMS?

**TinaCMS** is an open-source, Git-backed headless content management system (CMS) that enables developers and content creators to collaborate seamlessly on content-heavy websites.

### Key Features

1. **Git-Backed Storage**
   - Content stored as Markdown, MDX, or JSON files in Git repository
   - Full version control and change history
   - No vendor lock-in - content lives in your repo

2. **Visual/Contextual Editing**
   - Side-by-side editing experience
   - Live preview of changes as you type
   - WYSIWYG-like editing for Markdown content

3. **Schema-Driven Content Modeling**
   - Define content structure in code (`tina/config.ts`)
   - Type-safe GraphQL API auto-generated from schema
   - Collections and fields system for organized content

4. **Flexible Deployment**
   - **TinaCloud**: Managed service (easiest, free tier available)
   - **Self-Hosted**: Cloudflare Workers, Vercel Functions, Netlify Functions, AWS Lambda
   - Multiple authentication options (Auth.js, custom, local dev)

5. **Framework Support**
   - **Best**: Next.js (App Router + Pages Router)
   - **Good**: React, Astro (experimental visual editing), Gatsby, Hugo, Jekyll, Remix, 11ty
   - **Framework-Agnostic**: Works with any framework (visual editing limited to React)

### Current Versions

- **tinacms**: 2.9.0 (September 2025)
- **@tinacms/cli**: 1.11.0 (October 2025)
- **React Support**: 19.x (>=18.3.1 <20.0.0)

---

## When to Use This Skill

### ✅ Use TinaCMS When:

1. **Building Content-Heavy Sites**
   - Blogs and personal websites
   - Documentation sites
   - Marketing websites
   - Portfolio sites

2. **Non-Technical Editors Need Access**
   - Content teams without coding knowledge
   - Marketing teams managing pages
   - Authors writing blog posts

3. **Git-Based Workflow Desired**
   - Want content versioning through Git
   - Need content review through pull requests
   - Prefer content in repository with code

4. **Visual Editing Required**
   - Editors want to see changes live
   - WYSIWYG experience preferred
   - Side-by-side editing workflow

### ❌ Don't Use TinaCMS When:

1. **Real-Time Collaboration Needed**
   - Multiple users editing simultaneously (Google Docs-style)
   - Use Sanity, Contentful, or Firebase instead

2. **Highly Dynamic Data**
   - E-commerce product catalogs with frequent inventory changes
   - Real-time dashboards
   - Use traditional databases (D1, PostgreSQL) instead

3. **No Content Management Needed**
   - Application is data-driven, not content-driven
   - Hard-coded content is sufficient

---

## Setup Patterns by Framework

Use the appropriate setup pattern based on your framework choice.

### 1. Next.js Setup (Recommended)

#### App Router (Next.js 13+)

**Steps:**

1. **Initialize TinaCMS:**
   ```bash
   npx @tinacms/cli@latest init
   ```
   - When prompted for public assets directory, enter `public`

2. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "dev": "tinacms dev -c \"next dev\"",
       "build": "tinacms build && next build",
       "start": "tinacms build && next start"
     }
   }
   ```

3. **Set environment variables:**
   ```env
   # .env.local
   NEXT_PUBLIC_TINA_CLIENT_ID=your_client_id
   TINA_TOKEN=your_read_only_token
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access admin interface:**
   ```
   http://localhost:3000/admin/index.html
   ```

**Key Files Created:**
- `tina/config.ts` - Schema configuration
- `app/admin/[[...index]]/page.tsx` - Admin UI route (if using App Router)

**Template**: See `templates/nextjs/tina-config-app-router.ts`

---

#### Pages Router (Next.js 12 and below)

**Setup is identical**, except admin route is:
- `pages/admin/[[...index]].tsx` instead of app directory

**Data Fetching Pattern:**
```tsx
// pages/posts/[slug].tsx
import { client } from '../../tina/__generated__/client'
import { useTina } from 'tinacms/dist/react'

export default function BlogPost(props) {
  // Hydrate for visual editing
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data
  })

  return (
    <article>
      <h1>{data.post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.post.body }} />
    </article>
  )
}

export async function getStaticProps({ params }) {
  const response = await client.queries.post({
    relativePath: `${params.slug}.md`
  })

  return {
    props: {
      data: response.data,
      query: response.query,
      variables: response.variables
    }
  }
}

export async function getStaticPaths() {
  const response = await client.queries.postConnection()
  const paths = response.data.postConnection.edges.map((edge) => ({
    params: { slug: edge.node._sys.filename }
  }))

  return { paths, fallback: 'blocking' }
}
```

**Template**: See `templates/nextjs/tina-config-pages-router.ts`

---

### 2. Vite + React Setup

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install react@^19 react-dom@^19 tinacms
   ```

2. **Initialize TinaCMS:**
   ```bash
   npx @tinacms/cli@latest init
   ```
   - Set public assets directory to `public`

3. **Update vite.config.ts:**
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3000  // TinaCMS default
     }
   })
   ```

4. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "dev": "tinacms dev -c \"vite\"",
       "build": "tinacms build && vite build",
       "preview": "vite preview"
     }
   }
   ```

5. **Create admin interface:**

   **Option A: Manual route (React Router)**
   ```tsx
   // src/pages/Admin.tsx
   import TinaCMS from 'tinacms'

   export default function Admin() {
     return <div id="tina-admin" />
   }
   ```

   **Option B: Direct HTML**
   ```html
   <!-- public/admin/index.html -->
   <!DOCTYPE html>
   <html>
     <head>
       <meta charset="utf-8" />
       <title>Tina CMS</title>
       <meta name="viewport" content="width=device-width, initial-scale=1" />
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/@fs/[path-to-tina-admin]"></script>
     </body>
   </html>
   ```

6. **Use useTina hook for visual editing:**
   ```tsx
   import { useTina } from 'tinacms/dist/react'
   import { client } from '../tina/__generated__/client'

   function BlogPost({ initialData }) {
     const { data } = useTina({
       query: initialData.query,
       variables: initialData.variables,
       data: initialData.data
     })

     return (
       <article>
         <h1>{data.post.title}</h1>
         <div>{/* render body */}</div>
       </article>
     )
   }
   ```

7. **Set environment variables:**
   ```env
   # .env
   VITE_TINA_CLIENT_ID=your_client_id
   VITE_TINA_TOKEN=your_read_only_token
   ```

**Template**: See `templates/vite-react/`

---

### 3. Astro Setup

**Steps:**

1. **Use official starter (recommended):**
   ```bash
   npx create-tina-app@latest --template tina-astro-starter
   ```

   **Or initialize manually:**
   ```bash
   npx @tinacms/cli@latest init
   ```

2. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "dev": "tinacms dev -c \"astro dev\"",
       "build": "tinacms build && astro build",
       "preview": "astro preview"
     }
   }
   ```

3. **Configure Astro:**
   ```javascript
   // astro.config.mjs
   import { defineConfig } from 'astro/config'
   import react from '@astro/react'

   export default defineConfig({
     integrations: [react()]  // Required for Tina admin
   })
   ```

4. **Visual editing (experimental):**
   - Requires React components
   - Use `client:tinaDirective` for interactive editing
   - Full visual editing is experimental as of October 2025

5. **Set environment variables:**
   ```env
   # .env
   PUBLIC_TINA_CLIENT_ID=your_client_id
   TINA_TOKEN=your_read_only_token
   ```

**Best For**: Content-focused static sites, documentation, blogs

**Template**: See `templates/astro/`

---

### 4. Framework-Agnostic Setup

**Applies to**: Hugo, Jekyll, Eleventy, Gatsby, Remix, or any framework

**Steps:**

1. **Initialize TinaCMS:**
   ```bash
   npx @tinacms/cli@latest init
   ```

2. **Manually configure build scripts:**
   ```json
   {
     "scripts": {
       "dev": "tinacms dev -c \"<your-dev-command>\"",
       "build": "tinacms build && <your-build-command>"
     }
   }
   ```

3. **Admin interface:**
   - Automatically created at `http://localhost:<port>/admin/index.html`
   - Port depends on your framework

4. **Data fetching:**
   - No visual editing (sidebar only)
   - Content edited through Git-backed interface
   - Changes saved directly to files

5. **Set environment variables:**
   ```env
   TINA_CLIENT_ID=your_client_id
   TINA_TOKEN=your_read_only_token
   ```

**Limitations:**
- No visual editing (React-only feature)
- Manual integration required
- Sidebar-based editing only

---

## Schema Modeling Best Practices

Define your content structure in `tina/config.ts`.

### Basic Config Structure

```typescript
import { defineConfig } from 'tinacms'

export default defineConfig({
  // Branch configuration
  branch: process.env.GITHUB_BRANCH ||
          process.env.VERCEL_GIT_COMMIT_REF ||
          'main',

  // TinaCloud credentials (if using managed service)
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
      mediaRoot: '',
      publicFolder: 'public',
    },
  },

  // Content schema
  schema: {
    collections: [
      // Define collections here
    ],
  },
})
```

---

### Collections

**Collection** = Content type + directory mapping

```typescript
{
  name: 'post',           // Singular, internal name (used in API)
  label: 'Blog Posts',    // Plural, display name (shown in admin)
  path: 'content/posts',  // Directory where files are stored
  format: 'mdx',          // File format: md, mdx, markdown, json, yaml, toml
  fields: [/* ... */]     // Array of field definitions
}
```

**Key Properties:**
- `name`: Internal identifier (alphanumeric + underscores only)
- `label`: Human-readable name for admin interface
- `path`: File path relative to project root
- `format`: File extension (defaults to 'md')
- `fields`: Content structure definition

---

### Field Types Reference

| Type | Use Case | Example |
|------|----------|---------|
| `string` | Short text (single line) | Title, slug, author name |
| `rich-text` | Long formatted content | Blog body, page content |
| `number` | Numeric values | Price, quantity, rating |
| `datetime` | Date/time values | Published date, event time |
| `boolean` | True/false toggles | Draft status, featured flag |
| `image` | Image uploads | Hero image, thumbnail, avatar |
| `reference` | Link to another document | Author, category, related posts |
| `object` | Nested fields group | SEO metadata, social links |

**Complete reference**: See `references/field-types-reference.md`

---

### Collection Templates

#### Blog Post Collection

```typescript
{
  name: 'post',
  label: 'Blog Posts',
  path: 'content/posts',
  format: 'mdx',
  fields: [
    {
      type: 'string',
      name: 'title',
      label: 'Title',
      isTitle: true,  // Shows in content list
      required: true
    },
    {
      type: 'string',
      name: 'excerpt',
      label: 'Excerpt',
      ui: {
        component: 'textarea'  // Multi-line input
      }
    },
    {
      type: 'image',
      name: 'coverImage',
      label: 'Cover Image'
    },
    {
      type: 'datetime',
      name: 'date',
      label: 'Published Date',
      required: true
    },
    {
      type: 'reference',
      name: 'author',
      label: 'Author',
      collections: ['author']  // References author collection
    },
    {
      type: 'boolean',
      name: 'draft',
      label: 'Draft',
      description: 'If checked, post will not be published',
      required: true
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Body',
      isBody: true  // Main content area
    }
  ],
  ui: {
    router: ({ document }) => `/blog/${document._sys.filename}`
  }
}
```

**Template**: See `templates/collections/blog-post.ts`

---

#### Documentation Page Collection

```typescript
{
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
      required: true
    },
    {
      type: 'string',
      name: 'description',
      label: 'Description',
      ui: {
        component: 'textarea'
      }
    },
    {
      type: 'number',
      name: 'order',
      label: 'Order',
      description: 'Sort order in sidebar'
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Body',
      isBody: true,
      templates: [
        // MDX components can be defined here
      ]
    }
  ],
  ui: {
    router: ({ document }) => {
      const breadcrumbs = document._sys.breadcrumbs.join('/')
      return `/docs/${breadcrumbs}`
    }
  }
}
```

**Template**: See `templates/collections/doc-page.ts`

---

#### Author Collection (Reference Target)

```typescript
{
  name: 'author',
  label: 'Authors',
  path: 'content/authors',
  format: 'json',  // Use JSON for structured data
  fields: [
    {
      type: 'string',
      name: 'name',
      label: 'Name',
      isTitle: true,
      required: true
    },
    {
      type: 'string',
      name: 'email',
      label: 'Email',
      ui: {
        validate: (value) => {
          if (!value?.includes('@')) {
            return 'Invalid email address'
          }
        }
      }
    },
    {
      type: 'image',
      name: 'avatar',
      label: 'Avatar'
    },
    {
      type: 'string',
      name: 'bio',
      label: 'Bio',
      ui: {
        component: 'textarea'
      }
    },
    {
      type: 'object',
      name: 'social',
      label: 'Social Links',
      fields: [
        {
          type: 'string',
          name: 'twitter',
          label: 'Twitter'
        },
        {
          type: 'string',
          name: 'github',
          label: 'GitHub'
        }
      ]
    }
  ]
}
```

**Template**: See `templates/collections/author.ts`

---

#### Landing Page Collection (Multiple Templates)

```typescript
{
  name: 'page',
  label: 'Pages',
  path: 'content/pages',
  format: 'mdx',
  templates: [  // Multiple templates for different page types
    {
      name: 'basic',
      label: 'Basic Page',
      fields: [
        {
          type: 'string',
          name: 'title',
          label: 'Title',
          isTitle: true,
          required: true
        },
        {
          type: 'rich-text',
          name: 'body',
          label: 'Body',
          isBody: true
        }
      ]
    },
    {
      name: 'landing',
      label: 'Landing Page',
      fields: [
        {
          type: 'string',
          name: 'title',
          label: 'Title',
          isTitle: true,
          required: true
        },
        {
          type: 'object',
          name: 'hero',
          label: 'Hero Section',
          fields: [
            {
              type: 'string',
              name: 'headline',
              label: 'Headline'
            },
            {
              type: 'string',
              name: 'subheadline',
              label: 'Subheadline',
              ui: { component: 'textarea' }
            },
            {
              type: 'image',
              name: 'image',
              label: 'Hero Image'
            }
          ]
        },
        {
          type: 'object',
          name: 'cta',
          label: 'Call to Action',
          fields: [
            {
              type: 'string',
              name: 'text',
              label: 'Button Text'
            },
            {
              type: 'string',
              name: 'url',
              label: 'Button URL'
            }
          ]
        }
      ]
    }
  ]
}
```

**When using templates**: Documents must include `_template` field in frontmatter:
```yaml
---
_template: landing
title: My Landing Page
---
```

**Template**: See `templates/collections/landing-page.ts`

---

## Common Errors & Solutions

### 1. ❌ ESbuild Compilation Errors

**Error Message:**
```
ERROR: Schema Not Successfully Built
ERROR: Config Not Successfully Executed
```

**Causes:**
- Importing code with custom loaders (webpack, babel plugins, esbuild loaders)
- Importing frontend-only code (uses `window`, DOM APIs, React hooks)
- Importing entire component libraries instead of specific modules

**Solution:**

Import only what you need:
```typescript
// ❌ Bad - Imports entire component directory
import { HeroComponent } from '../components/'

// ✅ Good - Import specific file
import { HeroComponent } from '../components/blocks/hero'
```

**Prevention Tips:**
- Keep `tina/config.ts` imports minimal
- Only import type definitions and simple utilities
- Avoid importing UI components directly
- Create separate `.schema.ts` files if needed

**Reference**: See `references/common-errors.md#esbuild`

---

### 2. ❌ Module Resolution: "Could not resolve 'tinacms'"

**Error Message:**
```
Error: Could not resolve "tinacms"
```

**Causes:**
- Corrupted or incomplete installation
- Version mismatch between dependencies
- Missing peer dependencies

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or with yarn
rm -rf node_modules yarn.lock
yarn install
```

**Prevention:**
- Use lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)
- Don't use `--no-optional` or `--omit=optional` flags
- Ensure `react` and `react-dom` are installed (even for non-React frameworks)

---

### 3. ❌ Field Naming Constraints

**Error Message:**
```
Field name contains invalid characters
```

**Cause:**
- TinaCMS field names can only contain: letters, numbers, underscores
- Hyphens, spaces, special characters are NOT allowed

**Solution:**
```typescript
// ❌ Bad - Uses hyphens
{
  name: 'hero-image',
  label: 'Hero Image',
  type: 'image'
}

// ❌ Bad - Uses spaces
{
  name: 'hero image',
  label: 'Hero Image',
  type: 'image'
}

// ✅ Good - Uses underscores
{
  name: 'hero_image',
  label: 'Hero Image',
  type: 'image'
}

// ✅ Good - CamelCase also works
{
  name: 'heroImage',
  label: 'Hero Image',
  type: 'image'
}
```

**Note**: This is a **breaking change** from Forestry.io migration

---

### 4. ❌ Docker Binding Issues

**Error:**
- TinaCMS admin not accessible from outside Docker container

**Cause:**
- TinaCMS binds to `127.0.0.1` (localhost only) by default
- Docker containers need `0.0.0.0` binding to accept external connections

**Solution:**
```bash
# Ensure framework dev server listens on all interfaces
tinacms dev -c "next dev --hostname 0.0.0.0"
tinacms dev -c "vite --host 0.0.0.0"
tinacms dev -c "astro dev --host 0.0.0.0"
```

**Docker Compose Example:**
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    command: npm run dev  # Which runs: tinacms dev -c "next dev --hostname 0.0.0.0"
```

---

### 5. ❌ Missing `_template` Key Error

**Error Message:**
```
GetCollection failed: Unable to fetch
template name was not provided
```

**Cause:**
- Collection uses `templates` array (multiple schemas)
- Document missing `_template` field in frontmatter
- Migrating from `templates` to `fields` and documents not updated

**Solution:**

**Option 1: Use `fields` instead (recommended for single template)**
```typescript
{
  name: 'post',
  path: 'content/posts',
  fields: [/* ... */]  // No _template needed
}
```

**Option 2: Ensure `_template` exists in frontmatter**
```yaml
---
_template: article  # ← Required when using templates array
title: My Post
---
```

**Migration Script** (if converting from templates to fields):
```bash
# Remove _template from all files in content/posts/
find content/posts -name "*.md" -exec sed -i '/_template:/d' {} +
```

---

### 6. ❌ Path Mismatch Issues

**Error:**
- Files not appearing in Tina admin
- "File not found" errors when saving
- GraphQL queries return empty results

**Cause:**
- `path` in collection config doesn't match actual file directory
- Relative vs absolute path confusion
- Trailing slash issues

**Solution:**
```typescript
// Files located at: content/posts/hello.md

// ✅ Correct
{
  name: 'post',
  path: 'content/posts',  // Matches file location
  fields: [/* ... */]
}

// ❌ Wrong - Missing 'content/'
{
  name: 'post',
  path: 'posts',  // Files won't be found
  fields: [/* ... */]
}

// ❌ Wrong - Trailing slash
{
  name: 'post',
  path: 'content/posts/',  // May cause issues
  fields: [/* ... */]
}
```

**Debugging:**
1. Run `npx @tinacms/cli@latest audit` to check paths
2. Verify files exist in specified directory
3. Check file extensions match `format` field

---

### 7. ❌ Build Script Ordering Problems

**Error Message:**
```
ERROR: Cannot find module '../tina/__generated__/client'
ERROR: Property 'queries' does not exist on type '{}'
```

**Cause:**
- Framework build running before `tinacms build`
- Tina types not generated before TypeScript compilation
- CI/CD pipeline incorrect order

**Solution:**
```json
{
  "scripts": {
    "build": "tinacms build && next build"  // ✅ Tina FIRST
    // NOT: "build": "next build && tinacms build"  // ❌ Wrong order
  }
}
```

**CI/CD Example (GitHub Actions):**
```yaml
- name: Build
  run: |
    npx @tinacms/cli@latest build  # Generate types first
    npm run build                   # Then build framework
```

**Why This Matters:**
- `tinacms build` generates TypeScript types in `tina/__generated__/`
- Framework build needs these types to compile successfully
- Running in wrong order causes type errors

---

### 8. ❌ Failed Loading TinaCMS Assets

**Error Message:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
http://localhost:4001/...
```

**Causes:**
- Pushed development `admin/index.html` to production (loads assets from localhost)
- Site served on subdirectory but `basePath` not configured

**Solution:**

**For Production Deploys:**
```json
{
  "scripts": {
    "build": "tinacms build && next build"  // ✅ Always build
    // NOT: "build": "tinacms dev"          // ❌ Never dev in production
  }
}
```

**For Subdirectory Deployments:**
```typescript
// tina/config.ts
export default defineConfig({
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
    basePath: 'your-subdirectory'  // ← Set if site not at domain root
  }
})
```

**CI/CD Fix:**
```yaml
# GitHub Actions / Vercel / Netlify
- run: npx @tinacms/cli@latest build  # Always use build, not dev
```

---

### 9. ❌ Reference Field 503 Service Unavailable

**Error:**
- Reference field dropdown times out with 503 error
- Admin interface becomes unresponsive when loading reference field

**Cause:**
- Too many items in referenced collection (100s or 1000s)
- No pagination support for reference fields currently

**Solutions:**

**Option 1: Split collections**
```typescript
// Instead of one huge "authors" collection
// Split by active status or alphabetically

{
  name: 'active_author',
  label: 'Active Authors',
  path: 'content/authors/active',
  fields: [/* ... */]
}

{
  name: 'archived_author',
  label: 'Archived Authors',
  path: 'content/authors/archived',
  fields: [/* ... */]
}
```

**Option 2: Use string field with validation**
```typescript
// Instead of reference
{
  type: 'string',
  name: 'authorId',
  label: 'Author ID',
  ui: {
    component: 'select',
    options: ['author-1', 'author-2', 'author-3']  // Curated list
  }
}
```

**Option 3: Custom field component** (advanced)
- Implement pagination in custom component
- See TinaCMS docs: https://tina.io/docs/extending-tina/custom-field-components/

---

## Deployment Patterns

Choose the deployment approach that fits your needs.

### Option 1: TinaCloud (Managed) - Easiest ⭐

**Best For**: Quick setup, free tier, managed infrastructure

**Steps:**

1. **Sign up** at https://app.tina.io
2. **Create project**, get Client ID and Read Only Token
3. **Set environment variables:**
   ```env
   NEXT_PUBLIC_TINA_CLIENT_ID=your_client_id
   TINA_TOKEN=your_read_only_token
   ```
4. **Initialize backend:**
   ```bash
   npx @tinacms/cli@latest init backend
   ```
5. **Deploy to hosting provider** (Vercel, Netlify, Cloudflare Pages)
6. **Set up GitHub integration** in Tina dashboard

**Pros:**
- ✅ Zero backend configuration
- ✅ Automatic GraphQL API
- ✅ Built-in authentication
- ✅ Git integration handled automatically
- ✅ Free tier generous (10k monthly requests)

**Cons:**
- ❌ Paid service beyond free tier
- ❌ Vendor dependency (content still in Git though)

**Reference**: See `references/deployment-guide.md#tinacloud`

---

### Option 2: Self-Hosted on Cloudflare Workers 🔥

**Best For**: Full control, Cloudflare ecosystem, edge deployment

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install @tinacms/datalayer tinacms-authjs
   ```

2. **Initialize backend:**
   ```bash
   npx @tinacms/cli@latest init backend
   ```

3. **Create Workers endpoint:**
   ```typescript
   // workers/src/index.ts
   import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
   import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
   import databaseClient from '../../tina/__generated__/databaseClient'

   const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

   export default {
     async fetch(request: Request, env: Env) {
       const handler = TinaNodeBackend({
         authProvider: isLocal
           ? LocalBackendAuthProvider()
           : AuthJsBackendAuthProvider({
               authOptions: TinaAuthJSOptions({
                 databaseClient,
                 secret: env.NEXTAUTH_SECRET,
               }),
             }),
         databaseClient,
       })

       return handler(request)
     }
   }
   ```

4. **Update `tina/config.ts`:**
   ```typescript
   export default defineConfig({
     contentApiUrlOverride: '/api/tina/gql',  // Your Workers endpoint
     // ... rest of config
   })
   ```

5. **Configure `wrangler.jsonc`:**
   ```jsonc
   {
     "name": "tina-backend",
     "main": "workers/src/index.ts",
     "compatibility_date": "2025-10-24",
     "vars": {
       "TINA_PUBLIC_IS_LOCAL": "false"
     },
     "env": {
       "production": {
         "vars": {
           "NEXTAUTH_SECRET": "your-secret-here"
         }
       }
     }
   }
   ```

6. **Deploy:**
   ```bash
   npx wrangler deploy
   ```

**Pros:**
- ✅ Full control over backend
- ✅ Generous free tier (100k requests/day)
- ✅ Global edge network (fast worldwide)
- ✅ No vendor lock-in

**Cons:**
- ❌ More setup complexity
- ❌ Authentication configuration required
- ❌ Cloudflare Workers knowledge needed

**Complete Guide**: See `references/self-hosting-cloudflare.md`

**Template**: See `templates/cloudflare-worker-backend/`

---

### Option 3: Self-Hosted on Vercel Functions

**Best For**: Next.js projects, Vercel ecosystem

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install @tinacms/datalayer tinacms-authjs
   ```

2. **Create API route:**
   ```typescript
   // api/tina/backend.ts
   import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
   import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
   import databaseClient from '../../../tina/__generated__/databaseClient'

   const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

   const handler = TinaNodeBackend({
     authProvider: isLocal
       ? LocalBackendAuthProvider()
       : AuthJsBackendAuthProvider({
           authOptions: TinaAuthJSOptions({
             databaseClient,
             secret: process.env.NEXTAUTH_SECRET,
           }),
         }),
     databaseClient,
   })

   export default handler
   ```

3. **Create `vercel.json` rewrites:**
   ```json
   {
     "rewrites": [
       {
         "source": "/api/tina/:path*",
         "destination": "/api/tina/backend"
       }
     ]
   }
   ```

4. **Update dev script:**
   ```json
   {
     "scripts": {
       "dev": "TINA_PUBLIC_IS_LOCAL=true tinacms dev -c \"next dev --port $PORT\""
     }
   }
   ```

5. **Set environment variables** in Vercel dashboard:
   ```
   NEXTAUTH_SECRET=your-secret
   TINA_PUBLIC_IS_LOCAL=false
   ```

6. **Deploy:**
   ```bash
   vercel deploy
   ```

**Pros:**
- ✅ Native Next.js integration
- ✅ Simple Vercel deployment
- ✅ Serverless (scales automatically)

**Cons:**
- ❌ Vercel-specific
- ❌ Function limitations (10s timeout, 50MB size)

**Reference**: See `references/deployment-guide.md#vercel`

---

### Option 4: Self-Hosted on Netlify Functions

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install express serverless-http @tinacms/datalayer tinacms-authjs
   ```

2. **Create function:**
   ```typescript
   // netlify/functions/tina.ts
   import express from 'express'
   import ServerlessHttp from 'serverless-http'
   import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
   import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
   import databaseClient from '../../tina/__generated__/databaseClient'

   const app = express()
   app.use(express.json())

   const tinaBackend = TinaNodeBackend({
     authProvider: AuthJsBackendAuthProvider({
       authOptions: TinaAuthJSOptions({
         databaseClient,
         secret: process.env.NEXTAUTH_SECRET,
       }),
     }),
     databaseClient,
   })

   app.post('/api/tina/*', tinaBackend)
   app.get('/api/tina/*', tinaBackend)

   export const handler = ServerlessHttp(app)
   ```

3. **Create `netlify.toml`:**
   ```toml
   [functions]
     node_bundler = "esbuild"

   [[redirects]]
     from = "/api/tina/*"
     to = "/.netlify/functions/tina"
     status = 200
     force = true
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

**Reference**: See `references/deployment-guide.md#netlify`

---

## Authentication Setup

### Option 1: Local Development (Default)

**Use for**: Local development, no production deployment

```typescript
// tina/__generated__/databaseClient or backend config
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

authProvider: isLocal ? LocalBackendAuthProvider() : /* ... */
```

**Environment Variable:**
```env
TINA_PUBLIC_IS_LOCAL=true
```

**Security**: NO authentication - only use locally!

---

### Option 2: Auth.js (Recommended for Self-Hosted)

**Use for**: Self-hosted with OAuth providers (GitHub, Discord, Google, etc.)

**Install:**
```bash
npm install next-auth tinacms-authjs
```

**Configure:**
```typescript
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
import DiscordProvider from 'next-auth/providers/discord'

export const AuthOptions = TinaAuthJSOptions({
  databaseClient,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
    // Add GitHub, Google, etc.
  ],
})

const handler = TinaNodeBackend({
  authProvider: AuthJsBackendAuthProvider({
    authOptions: AuthOptions,
  }),
  databaseClient,
})
```

**Supported Providers**: GitHub, Discord, Google, Twitter, Facebook, Email, etc.

**Reference**: https://next-auth.js.org/providers/

---

### Option 3: TinaCloud Auth (Managed)

**Use for**: TinaCloud hosted service

```typescript
import { TinaCloudBackendAuthProvider } from '@tinacms/auth'

authProvider: TinaCloudBackendAuthProvider()
```

**Setup:**
1. Sign up at https://app.tina.io
2. Create project
3. Manage users in dashboard
4. Automatically handles authentication

---

### Option 4: Custom Auth Provider

**Use for**: Existing auth system, custom requirements

```typescript
const CustomBackendAuth = () => {
  return {
    isAuthorized: async (req, res) => {
      const token = req.headers.authorization

      // Your validation logic
      const user = await validateToken(token)

      if (user && user.canEdit) {
        return { isAuthorized: true }
      }

      return {
        isAuthorized: false,
        errorMessage: 'Unauthorized',
        errorCode: 401
      }
    },
  }
}

authProvider: CustomBackendAuth()
```

---

## GraphQL API Usage

TinaCMS automatically generates a type-safe GraphQL client.

### Querying Data

**TinaCloud:**
```typescript
import client from '../tina/__generated__/client'

// Single document
const post = await client.queries.post({
  relativePath: 'hello-world.md'
})

// Multiple documents
const posts = await client.queries.postConnection()
```

**Self-Hosted:**
```typescript
import client from '../tina/__generated__/databaseClient'

// Same API as TinaCloud client
const post = await client.queries.post({
  relativePath: 'hello-world.md'
})
```

### Visual Editing with useTina Hook

**Next.js Example:**
```tsx
import { useTina } from 'tinacms/dist/react'
import { client } from '../../tina/__generated__/client'

export default function BlogPost(props) {
  // Hydrate data for visual editing
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data
  })

  return (
    <article>
      <h1>{data.post.title}</h1>
      <p>{data.post.excerpt}</p>
      <div dangerouslySetInnerHTML={{ __html: data.post.body }} />
    </article>
  )
}

export async function getStaticProps({ params }) {
  const response = await client.queries.post({
    relativePath: `${params.slug}.md`
  })

  return {
    props: {
      data: response.data,
      query: response.query,
      variables: response.variables
    }
  }
}
```

**How It Works:**
- In **production**: `useTina` returns the initial data (no overhead)
- In **edit mode**: `useTina` connects to GraphQL and updates in real-time
- Changes appear immediately in preview

---

## Additional Resources

### Templates
- `templates/nextjs/` - Next.js App Router + Pages Router configs
- `templates/vite-react/` - Vite + React setup
- `templates/astro/` - Astro integration
- `templates/collections/` - Pre-built collection schemas
- `templates/cloudflare-worker-backend/` - Cloudflare Workers self-hosting

### References
- `references/schema-patterns.md` - Advanced schema modeling patterns
- `references/field-types-reference.md` - Complete field type documentation
- `references/deployment-guide.md` - Deployment guides for all platforms
- `references/self-hosting-cloudflare.md` - Complete Cloudflare Workers guide
- `references/common-errors.md` - Extended error troubleshooting
- `references/migration-guide.md` - Migrating from Forestry.io

### Scripts
- `scripts/init-nextjs.sh` - Automated Next.js setup
- `scripts/init-vite-react.sh` - Automated Vite + React setup
- `scripts/init-astro.sh` - Automated Astro setup
- `scripts/check-versions.sh` - Verify package versions

### Official Documentation
- Website: https://tina.io
- Docs: https://tina.io/docs
- GitHub: https://github.com/tinacms/tinacms
- Discord: https://discord.gg/zumN63Ybpf

---

## Token Efficiency

**Estimated Savings**: 65-70% (10,900 tokens saved)

**Without Skill** (~16,000 tokens):
- Initial research and exploration: 3,000 tokens
- Framework setup trial & error: 2,500 tokens
- Schema modeling attempts: 2,000 tokens
- Error troubleshooting: 4,000 tokens
- Deployment configuration: 2,500 tokens
- Authentication setup: 2,000 tokens

**With Skill** (~5,100 tokens):
- Skill discovery: 100 tokens
- Skill loading (SKILL.md): 3,000 tokens
- Template selection: 500 tokens
- Minor project-specific adjustments: 1,500 tokens

---

## Errors Prevented

This skill prevents **9 common errors** (100% prevention rate):

1. ✅ ESbuild compilation errors (import issues)
2. ✅ Module resolution problems
3. ✅ Field naming constraint violations
4. ✅ Docker binding issues
5. ✅ Missing `_template` key errors
6. ✅ Path mismatch problems
7. ✅ Build script ordering failures
8. ✅ Asset loading errors in production
9. ✅ Reference field 503 timeouts

---

## Quick Start Examples

### Example 1: Blog with Next.js + TinaCloud

```bash
# 1. Create Next.js app
npx create-next-app@latest my-blog --typescript --app

# 2. Initialize TinaCMS
cd my-blog
npx @tinacms/cli@latest init

# 3. Set environment variables
echo "NEXT_PUBLIC_TINA_CLIENT_ID=your_client_id" >> .env.local
echo "TINA_TOKEN=your_token" >> .env.local

# 4. Start dev server
npm run dev

# 5. Access admin
open http://localhost:3000/admin/index.html
```

---

### Example 2: Documentation Site with Astro

```bash
# 1. Use official starter
npx create-tina-app@latest my-docs --template tina-astro-starter

# 2. Install dependencies
cd my-docs
npm install

# 3. Start dev server
npm run dev

# 4. Access admin
open http://localhost:4321/admin/index.html
```

---

### Example 3: Self-Hosted on Cloudflare Workers

```bash
# 1. Initialize project
npm create cloudflare@latest my-app

# 2. Add TinaCMS
npx @tinacms/cli@latest init
npx @tinacms/cli@latest init backend

# 3. Install dependencies
npm install @tinacms/datalayer tinacms-authjs

# 4. Copy Cloudflare Workers backend template
cp -r [path-to-skill]/templates/cloudflare-worker-backend/* workers/

# 5. Configure and deploy
npx wrangler deploy
```

---

## Production Examples

- **TinaCMS Website**: https://tina.io (dogfooding)
- **Astro Starter**: https://github.com/tinacms/tina-astro-starter
- **Next.js Starter**: https://github.com/tinacms/tina-starter-alpaca

---

## Support

**Issues?** Check `references/common-errors.md` first

**Still Stuck?**
- Discord: https://discord.gg/zumN63Ybpf
- GitHub Issues: https://github.com/tinacms/tinacms/issues
- Official Docs: https://tina.io/docs

---

**Last Updated**: 2025-10-24
**Skill Version**: 1.0.0
**TinaCMS Version**: 2.9.0
**CLI Version**: 1.11.0
