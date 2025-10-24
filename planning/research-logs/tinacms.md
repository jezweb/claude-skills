# TinaCMS Skill Research Log

**Date**: 2025-10-24
**Researcher**: Claude Code
**Status**: Research Complete ✅

---

## Executive Summary

TinaCMS is an excellent candidate for a skill in the claude-skills repository. It fills a critical gap in the collection (CMS for content-heavy sites), has comprehensive documentation, significant complexity warranting skill creation, and 8+ documented common errors to prevent.

**Recommendation**: **PROCEED** with skill creation

**Priority**: High - Fills CMS gap in skill library

**Estimated Token Savings**: 60-70%

**Errors Prevented**: 8+ documented issues

---

## Package Information

### Current Versions (2025-10-24)

| Package | Version | Last Updated |
|---------|---------|--------------|
| `tinacms` | 2.9.0 | September 2025 |
| `@tinacms/cli` | 1.11.0 | October 2025 |
| React Support | 19.x (>=18.3.1 <20.0.0) | Current |

### Framework Versions

| Framework | Current Version | TinaCMS Support Level |
|-----------|----------------|----------------------|
| Next.js | 16.0.0 | ✅ Primary (App Router + Pages Router) |
| Astro | 5.15.1 | ⚠️ Experimental (visual editing) |
| Vite | 7.1.12 | ✅ Community Support |
| React | 19.2.0 | ✅ Fully Supported |

---

## What is TinaCMS?

**TinaCMS** is an open-source, Git-backed headless content management system (CMS) that enables developers and content creators to collaborate seamlessly.

### Key Features

1. **Git-Backed Storage**
   - Content stored as Markdown, MDX, JSON files in Git
   - Full version control and history
   - No vendor lock-in

2. **Visual/Contextual Editing**
   - Side-by-side editing experience
   - Live preview of changes
   - WYSIWYG-like editing for Markdown

3. **Schema-Driven Content Modeling**
   - Define content structure in code (`tina/config.ts`)
   - Type-safe GraphQL API auto-generated
   - Collections and fields system

4. **Flexible Deployment**
   - **TinaCloud**: Managed service (easiest)
   - **Self-Hosted**: Cloudflare Workers, Vercel Functions, Netlify Functions, AWS Lambda
   - Authentication: Auth.js, custom providers, local dev mode

5. **Framework Support**
   - **Best**: Next.js (App Router, Pages Router)
   - **Good**: React, Astro (experimental), Gatsby, Hugo, Jekyll, Remix, 11ty
   - **Framework-Agnostic**: Works with any framework, visual editing limited to React

---

## Use Cases (When to Use TinaCMS)

✅ **Perfect For:**
- Blogs and personal websites
- Documentation sites
- Marketing websites
- Portfolio sites
- Content-heavy applications requiring non-technical editors
- Projects needing Git-based content versioning

❌ **Not Ideal For:**
- Real-time collaborative editing (Google Docs-style)
- Highly dynamic, database-driven applications
- E-commerce product catalogs (better suited for traditional databases)
- Projects without content management needs

---

## Setup Patterns by Framework

### 1. Next.js (Primary Support)

#### App Router (Recommended)
```bash
npx @tinacms/cli@latest init
```

**Key Files:**
- `tina/config.ts` - Schema configuration
- `app/admin/[[...index]]/page.tsx` - Admin interface
- `.env` - Environment variables (NEXT_PUBLIC_TINA_CLIENT_ID, TINA_TOKEN)

**Package.json Scripts:**
```json
{
  "dev": "tinacms dev -c \"next dev\"",
  "build": "tinacms build && next build",
  "start": "tinacms build && next start"
}
```

#### Pages Router (Legacy)
- Same init command
- Admin interface: `pages/admin/[[...index]].tsx`
- Data fetching: `getStaticProps` + `useTina` hook

---

### 2. Vite + React (Community Support)

**Setup Process:**
1. Initialize TinaCMS: `npx @tinacms/cli@latest init`
2. Install React dependencies: `npm install react@^19 react-dom@^19`
3. Update `vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3000
     }
   })
   ```
4. Update `package.json`:
   ```json
   {
     "dev": "tinacms dev -c \"vite\"",
     "build": "tinacms build && vite build"
   }
   ```

**Admin Interface:**
- Manually create `public/admin/index.html` pointing to Tina admin assets
- Or use framework-agnostic setup

**Visual Editing:**
- Full support via `useTina` hook
- Import: `import { useTina } from 'tinacms/dist/react'`

---

### 3. Astro (Experimental Visual Editing)

**Official Starter:**
```bash
npx create-tina-app@latest --template tina-astro-starter
```

**Manual Setup:**
```bash
npx @tinacms/cli@latest init
```

**Package.json:**
```json
{
  "dev": "tinacms dev -c \"astro dev\"",
  "build": "tinacms build && astro build"
}
```

**Visual Editing Limitations:**
- Requires React components for contextual editing
- Uses `client:tinaDirective` for visual mode
- Experimental feature (as of 2025-10-24)

**Best For:**
- Content-focused static sites
- Documentation sites
- Blogs with Astro's content collections

---

### 4. Framework-Agnostic

**Applies to**: Hugo, Jekyll, Eleventy, Gatsby, Remix, or any framework

**Setup:**
1. Run `npx @tinacms/cli@latest init`
2. Manually configure build scripts:
   ```json
   {
     "dev": "tinacms dev -c \"<your-dev-command>\"",
     "build": "tinacms build && <your-build-command>"
   }
   ```
3. Admin interface: `http://localhost:<port>/admin/index.html`

**Limitations:**
- No visual editing (sidebar only)
- Manual integration required
- Git-based editing only

---

## Schema Modeling Best Practices

### Collections Structure

**Collection** = Content type + directory mapping

```typescript
// tina/config.ts
export default defineConfig({
  schema: {
    collections: [
      {
        name: 'post',           // Singular, internal name
        label: 'Blog Posts',    // Plural, display name
        path: 'content/posts',  // Directory where files live
        format: 'mdx',          // File format
        fields: [/* ... */]     // Field definitions
      }
    ]
  }
})
```

### Field Types

| Type | Use Case | Example |
|------|----------|---------|
| `string` | Short text | Title, slug |
| `rich-text` | Long formatted content | Blog body, page content |
| `number` | Numeric values | Price, quantity |
| `datetime` | Date/time values | Published date, event time |
| `boolean` | True/false | Draft status, featured flag |
| `image` | Image uploads | Hero image, thumbnail |
| `reference` | Link to another document | Author, related posts |
| `object` | Nested fields | SEO metadata, author info |

### Common Patterns

#### 1. Blog Post Collection
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
      isTitle: true,
      required: true
    },
    {
      type: 'string',
      name: 'excerpt',
      label: 'Excerpt',
      ui: { component: 'textarea' }
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
      collections: ['author']
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Body',
      isBody: true
    }
  ]
}
```

#### 2. Documentation Page Collection
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
      label: 'Description'
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Body',
      isBody: true,
      templates: [/* MDX components */]
    }
  ],
  ui: {
    router: ({ document }) => `/docs/${document._sys.breadcrumbs.join('/')}`
  }
}
```

#### 3. Author Collection (Reference)
```typescript
{
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
      required: true
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
      ui: { component: 'textarea' }
    }
  ]
}
```

---

## Common Errors & Solutions

### 1. ❌ ESbuild Compilation Errors

**Error Message:**
```
ERROR: Schema Not Successfully Built
ERROR: Config Not Successfully Executed
```

**Causes:**
- Importing code with custom loaders (webpack, babel plugins)
- Importing frontend-only code (uses `window`, DOM APIs)
- Importing entire component libraries instead of specific modules

**Solution:**
```typescript
// ❌ Bad - Imports entire component library
import { HeroComponent } from '../components/'

// ✅ Good - Import specific file
import { HeroComponent } from '../components/blocks/hero'
```

**Prevention:**
- Keep `tina/config.ts` imports minimal
- Only import necessary code
- Avoid importing UI components into config

---

### 2. ❌ Module Resolution: "Could not resolve 'tinacms'"

**Error Message:**
```
Error: Could not resolve "tinacms"
```

**Causes:**
- Fresh installation without proper dependency installation
- Corrupted node_modules
- Version mismatch between dependencies

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### 3. ❌ Field Naming Constraints

**Error Message:**
```
Field name contains invalid characters
```

**Cause:**
- TinaCMS only allows alphanumeric characters and underscores in field names
- Forestry.io allowed hyphens, but TinaCMS does not

**Solution:**
```typescript
// ❌ Bad - Uses hyphens
{
  name: 'hero-image',
  label: 'Hero Image',
  type: 'image'
}

// ✅ Good - Uses underscores
{
  name: 'hero_image',
  label: 'Hero Image',
  type: 'image'
}
```

---

### 4. ❌ Docker Binding Issues (Localhost vs 0.0.0.0)

**Error:**
- TinaCMS not accessible from outside Docker container

**Cause:**
- TinaCMS binds to `127.0.0.1` (localhost only) by default

**Solution:**
```bash
# Ensure TinaCMS listens on all interfaces
tinacms dev -c "next dev --hostname 0.0.0.0"
```

---

### 5. ❌ Missing `_template` Key Error

**Error Message:**
```
GetCollection failed: template name was not provided
```

**Cause:**
- Collection uses `templates` array but document missing `_template` field
- Migration from `templates` to `fields` incomplete

**Solution:**
```typescript
// Option 1: Use 'fields' instead of 'templates' (recommended)
{
  name: 'post',
  path: 'content/posts',
  fields: [/* ... */]  // No _template needed
}

// Option 2: Ensure _template exists in frontmatter
// In your .md file:
---
_template: article
title: My Post
---
```

---

### 6. ❌ Path Mismatch Issues

**Error:**
- Files not appearing in Tina admin
- "File not found" errors

**Cause:**
- `path` in collection config doesn't match actual file directory

**Solution:**
```typescript
// Ensure collection path matches file structure
// Files: content/posts/hello.md
{
  name: 'post',
  path: 'content/posts',  // ✅ Matches file location
  // NOT: path: 'posts'   // ❌ Would fail
}
```

---

### 7. ❌ Build Script Ordering Problems

**Error:**
- TypeScript errors about missing Tina types
- GraphQL client not found

**Cause:**
- Running framework build before `tinacms build`
- Tina types not generated before TypeScript compilation

**Solution:**
```json
{
  "scripts": {
    "build": "tinacms build && next build"  // ✅ Tina FIRST
    // NOT: "build": "next build && tinacms build"  // ❌ Wrong order
  }
}
```

---

### 8. ❌ Failed Loading TinaCMS Assets

**Error Message:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED (http://localhost:4001)
```

**Causes:**
- Pushed development `admin/index.html` to production (loads from localhost)
- Site served on different base path than configured

**Solution:**
```typescript
// tina/config.ts
export default defineConfig({
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
    basePath: 'your-sub-directory'  // Set if site in subdirectory
  }
})
```

**CI/CD Fix:**
```yaml
# Always build in production, never dev
- run: npx @tinacms/cli@latest build  # ✅
# NOT: npx @tinacms/cli@latest dev    # ❌
```

---

### 9. ❌ 503 Service Unavailable on Reference Fields

**Error:**
- Reference field dropdown times out
- 503 errors loading referenced collections

**Cause:**
- Too many items in referenced collection (no pagination)

**Solution:**
- Implement custom field component with pagination
- Use custom GraphQL queries to fetch paginated results
- Limit collection size or split into multiple collections

**Workaround:**
```typescript
// Use string field with validation instead of reference
{
  type: 'string',
  name: 'authorId',
  label: 'Author ID',
  ui: {
    component: 'select',
    options: [/* manually curated list */]
  }
}
```

---

## Deployment Patterns

### 1. TinaCloud (Managed) - Easiest

**Steps:**
1. Sign up at https://app.tina.io
2. Create project, get Client ID and Read Only Token
3. Set environment variables:
   ```
   NEXT_PUBLIC_TINA_CLIENT_ID=your_client_id
   TINA_TOKEN=your_read_only_token
   ```
4. Run `npx @tinacms/cli@latest init backend`
5. Deploy to hosting provider (Vercel, Netlify, etc.)

**Pros:**
- Zero backend configuration
- Automatic GraphQL API
- Built-in authentication
- Git integration handled

**Cons:**
- Paid service (free tier available)
- Vendor lock-in (though content is in Git)

---

### 2. Self-Hosted on Cloudflare Workers

**Setup:**

**1. Install dependencies:**
```bash
npm install @tinacms/datalayer tinacms-authjs
```

**2. Create backend API route:**
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

**3. Update `tina/config.ts`:**
```typescript
export default defineConfig({
  contentApiUrlOverride: '/api/tina/gql',  // Your Workers endpoint
  // ... rest of config
})
```

**Pros:**
- Full control over backend
- Free tier generous
- Cloudflare's global edge network
- No vendor lock-in

**Cons:**
- More setup complexity
- Requires Cloudflare Workers knowledge
- Authentication setup needed

---

### 3. Self-Hosted on Vercel Functions

**Setup:**

**1. Create API route:**
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

**2. Create `vercel.json` rewrites:**
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

**3. Update dev script:**
```json
{
  "scripts": {
    "dev": "TINA_PUBLIC_IS_LOCAL=true tinacms dev -c \"next dev --port $PORT\""
  }
}
```

---

### 4. Self-Hosted on Netlify Functions

**Setup:**

**1. Create function:**
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

**2. Create `netlify.toml`:**
```toml
[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/tina/*"
  to = "/.netlify/functions/tina"
  status = 200
  force = true
```

---

## Authentication Options

### 1. Local Development (Default)
```typescript
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

// No auth in local mode
authProvider: isLocal ? LocalBackendAuthProvider() : /* ... */
```

### 2. Auth.js (Recommended for Self-Hosted)
```typescript
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'

authProvider: AuthJsBackendAuthProvider({
  authOptions: TinaAuthJSOptions({
    databaseClient,
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      }),
      // GitHub, Google, etc.
    ],
  }),
})
```

### 3. TinaCloud Auth (Managed Service)
```typescript
import { TinaCloudBackendAuthProvider } from '@tinacms/auth'

authProvider: TinaCloudBackendAuthProvider()
```

### 4. Custom Auth Provider
```typescript
const CustomBackendAuth = () => {
  return {
    isAuthorized: async (req, res) => {
      const token = req.headers.authorization
      // Your validation logic
      return { isAuthorized: true }
    },
  }
}

authProvider: CustomBackendAuth()
```

---

## GraphQL API

### Auto-Generated Client

TinaCMS automatically generates a type-safe GraphQL client:

```typescript
// Generated: tina/__generated__/client.ts (TinaCloud)
// Generated: tina/__generated__/databaseClient.ts (Self-hosted)

import client from '../tina/__generated__/client'

// Query a single document
const post = await client.queries.post({
  relativePath: 'hello-world.md'
})

// Query multiple documents
const posts = await client.queries.postConnection()

// Use in Next.js
export async function getStaticProps() {
  const response = await client.queries.post({
    relativePath: 'hello-world.md'
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

### Visual Editing with useTina Hook

```tsx
import { useTina } from 'tinacms/dist/react'

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
      <div>{/* render body */}</div>
    </article>
  )
}
```

---

## Context7 Documentation Coverage

### Library IDs
- `/tinacms/tina.io` - **1,729 code snippets** (Trust Score: 9.7/10)
- `/tinacms/tinacms` - **246 code snippets** (Trust Score: 9.7/10)

### Documentation Quality: **Excellent ✅**

**Strengths:**
- Comprehensive setup guides for multiple frameworks
- Schema modeling patterns well-documented
- Self-hosting guides for all major platforms
- Authentication patterns covered
- Error troubleshooting pages

**Coverage Areas:**
- ✅ Framework integration (Next.js, Astro, framework-agnostic)
- ✅ Schema modeling and collections
- ✅ Field types and validation
- ✅ GraphQL API usage
- ✅ Visual editing setup
- ✅ Deployment patterns
- ✅ Authentication providers
- ✅ Common errors and solutions

---

## Production Examples

### Official Examples
- **TinaCMS Website**: https://tina.io (dogfooding their own product)
- **Tina Astro Starter**: https://github.com/tinacms/tina-astro-starter
- **Tina Next.js Starter**: https://github.com/tinacms/tina-starter-alpaca

### Community Examples
- React Router + Vite + TinaCMS: https://github.com/completejavascript/tina-react-router-starter
- Simple Markdown Blog: Multiple tutorials on tina.io/blog

---

## Skill Scope Decision

### ✅ Include in Skill

**Core Features:**
1. TinaCMS initialization and setup
2. Schema modeling patterns (collections, fields, templates)
3. Framework-specific configs (Next.js, Vite+React, Astro, Framework-agnostic)
4. Common errors and solutions (all 8+)
5. Deployment patterns (TinaCloud, Cloudflare Workers, Vercel, Netlify)
6. Authentication setup (Auth.js, local dev, custom)
7. GraphQL API usage and visual editing setup
8. Collection templates (blog, docs, pages, author)

**Templates to Create:**
1. Next.js App Router config
2. Next.js Pages Router config
3. Vite + React config
4. Astro config
5. Framework-agnostic setup
6. Collection schemas (blog post, doc page, landing page, author)
7. Cloudflare Workers backend
8. Vercel Functions backend
9. Environment variable examples

**References to Write:**
1. Schema modeling patterns
2. Field types reference
3. Deployment guide (all platforms)
4. Self-hosting on Cloudflare Workers
5. Common errors and solutions
6. Migration from Forestry.io
7. Visual editing setup guide

---

### ❌ Exclude from Skill (Out of Scope)

1. **Custom field components** - Too advanced, framework-specific
2. **MDX component development** - Not TinaCMS-specific
3. **Media storage integrations** (Cloudinary, S3) - Separate concern
4. **Editorial workflow** - Advanced feature, optional
5. **Internationalization (i18n)** - Complex, separate guide
6. **Draft/preview modes** - Advanced feature
7. **User management** - Self-hosted only, complex

---

## Token Efficiency Analysis

### Without Skill (Estimated)
1. Initial research: 3,000 tokens
2. Framework setup trial & error: 2,500 tokens
3. Schema modeling exploration: 2,000 tokens
4. Error troubleshooting: 4,000 tokens
5. Deployment setup: 2,500 tokens
6. Authentication config: 2,000 tokens

**Total Without Skill**: ~16,000 tokens

### With Skill (Estimated)
1. Skill discovery: 100 tokens
2. Skill loading: 3,000 tokens (SKILL.md)
3. Template selection: 500 tokens
4. Minor adjustments: 1,500 tokens

**Total With Skill**: ~5,100 tokens

**Token Savings**: ~68% (10,900 tokens saved)

---

## Errors Prevention Analysis

| Error | Frequency | Severity | Prevented by Skill? |
|-------|-----------|----------|---------------------|
| ESbuild compilation | High | High | ✅ Yes |
| Module resolution | Medium | High | ✅ Yes |
| Field naming constraints | Low | Low | ✅ Yes |
| Docker binding issues | Low | Medium | ✅ Yes |
| Missing _template key | Medium | Medium | ✅ Yes |
| Path mismatches | High | High | ✅ Yes |
| Build script ordering | High | High | ✅ Yes |
| Asset loading errors | High | High | ✅ Yes |
| Reference field 503 | Low | Medium | ✅ Yes |

**Total Errors Prevented**: 9/9 (100%)

---

## Risk Assessment

### Low Risk ✅
- **Stable API**: TinaCMS 2.x has been stable since 2023
- **Active Development**: Regular updates, last release September 2025
- **Good Documentation**: Official docs comprehensive
- **Context7 Coverage**: Excellent (1,729 snippets)
- **Community Support**: Active Discord, GitHub issues
- **Production Tested**: Used by TinaCMS team for their own site

### Potential Challenges ⚠️
1. **Vite + React**: No official guide (community support only)
2. **Astro Visual Editing**: Experimental feature
3. **Self-Hosting Complexity**: More setup than TinaCloud
4. **Reference Field Pagination**: Known limitation
5. **Breaking Changes**: Possible in future major versions

### Mitigation Strategies
1. Document Vite + React from first principles using framework-agnostic guide
2. Clearly mark Astro visual editing as experimental
3. Provide multiple self-hosting templates (Cloudflare, Vercel, Netlify)
4. Document reference field limitation and workarounds
5. Pin package versions, test regularly

---

## Skill Justification

### Why This Skill is Valuable

**1. Fills Critical Gap**
- Repository has infrastructure (Cloudflare), UI (Tailwind/shadcn), AI (Workers AI)
- **Missing**: CMS for content-heavy sites
- TinaCMS fills this gap perfectly

**2. Significant Complexity**
- 8+ setup steps across multiple frameworks
- Schema modeling non-trivial
- Self-hosting requires backend setup
- Authentication configuration complex

**3. High Error Rate Without Guidance**
- 9 documented common errors
- ESbuild issues particularly tricky
- Build script ordering critical
- Path configuration error-prone

**4. Multiple Valid Approaches**
- TinaCloud vs self-hosted decision
- Framework choice (Next.js, Vite, Astro, etc.)
- Authentication provider selection
- Deployment target selection

**5. Excellent Documentation to Leverage**
- Context7 has 1,729 snippets (Trust Score 9.7)
- Official docs comprehensive
- Common errors well-documented
- Multiple deployment guides

**6. Token Efficiency Potential**
- Estimated 68% token savings
- 100% error prevention rate
- Framework-specific patterns save trial & error
- Templates provide copy-paste solutions

---

## Recommendations for Skill Development

### Priority Order

**Phase 1: Core Content (Day 1)**
1. SKILL.md with frontmatter and core sections
2. Next.js templates (App Router + Pages Router)
3. Common errors documentation
4. Basic collection schemas (blog, docs)

**Phase 2: Framework Expansion (Day 1-2)**
1. Vite + React templates and guide
2. Astro templates and guide
3. Framework-agnostic patterns
4. Additional collection schemas (pages, author)

**Phase 3: Self-Hosting (Day 2)**
1. Cloudflare Workers backend template
2. Vercel Functions backend template
3. Authentication setup guide
4. Deployment references

**Phase 4: Polish & Testing (Day 2-3)**
1. Complete all references/
2. Create automation scripts
3. Test all templates
4. Build example project

---

## Key Takeaways

### ✅ Proceed with Skill Creation

**Justification:**
1. Fills critical CMS gap in skill library
2. High complexity warrants skill (not simple tool)
3. 9 documented errors to prevent (100% prevention rate)
4. 68% token savings estimated
5. Excellent documentation foundation (Context7 + official)
6. Multiple frameworks to support (broad applicability)
7. Production-tested and actively maintained
8. User specifically requested for content-heavy site use cases

### Success Criteria
- [ ] All 9 common errors documented with solutions
- [ ] Templates for 4 frameworks (Next.js, Vite+React, Astro, Framework-agnostic)
- [ ] Self-hosting guides for 3 platforms (Cloudflare, Vercel, Netlify)
- [ ] 4+ collection schema templates
- [ ] Auto-discovery via keywords works
- [ ] All templates tested and working
- [ ] Token savings ≥60%
- [ ] 100% standards compliant

---

## Next Steps

1. ✅ Research complete → Mark todo as done
2. ⏭️ Create skill directory structure
3. ⏭️ Write SKILL.md (5-8k words)
4. ⏭️ Create all templates (10+ files)
5. ⏭️ Write references/ documentation
6. ⏭️ Create automation scripts
7. ⏭️ Test thoroughly
8. ⏭️ Commit and document

---

**Research Status**: ✅ **COMPLETE**

**Ready to Proceed**: YES

**Estimated Development Time**: 11-16 hours (11-16 minutes human time with Claude Code)

---

**Last Updated**: 2025-10-24
**Next Review**: After skill completion
