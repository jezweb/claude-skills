# TinaCMS Common Errors - Complete Reference

This document provides detailed troubleshooting for all 9 common TinaCMS errors.

**Last Updated**: 2025-10-24
**TinaCMS Version**: 2.9.0

---

## Table of Contents

1. [ESbuild Compilation Errors](#1-esbuild-compilation-errors)
2. [Module Resolution Issues](#2-module-resolution-issues)
3. [Field Naming Constraints](#3-field-naming-constraints)
4. [Docker Binding Issues](#4-docker-binding-issues)
5. [Missing _template Key Error](#5-missing-_template-key-error)
6. [Path Mismatch Issues](#6-path-mismatch-issues)
7. [Build Script Ordering Problems](#7-build-script-ordering-problems)
8. [Failed Loading TinaCMS Assets](#8-failed-loading-tinacms-assets)
9. [Reference Field 503 Service Unavailable](#9-reference-field-503-service-unavailable)

---

## 1. ESbuild Compilation Errors

### Error Messages

```
ERROR: Schema Not Successfully Built
ERROR: Config Not Successfully Executed
ERROR: Cannot bundle code that requires custom loaders
```

### Causes

The `tina/config.ts` file is compiled using esbuild and executed in Node.js. This can fail when:

1. **Importing code with custom loaders**
   - Webpack loaders
   - Babel plugins
   - PostCSS processors
   - SCSS/SASS files
   - Vue/Svelte components

2. **Importing frontend-only code**
   - Code using `window` object
   - Code using DOM APIs
   - React hooks outside components
   - Browser-specific APIs

3. **Importing entire component libraries**
   - `import { Component } from '../components/'` pulls in entire directory
   - May include dependencies not compatible with Node.js

### Solutions

#### Solution 1: Import Specific Files Only

```typescript
// ❌ Bad - Imports entire directory
import { HeroComponent } from '../components/'

// ✅ Good - Import specific file
import { HeroComponent } from '../components/blocks/hero'

// ❌ Bad - Imports entire library
import * as Components from '../components'

// ✅ Good - Import only what you need
import { HeroComponent, CTAComponent } from '../components/blocks'
```

#### Solution 2: Create Separate Schema Files

If your component definitions are complex, extract schema to separate files:

```typescript
// components/hero/hero.schema.ts
export const heroBlockSchema = {
  name: 'hero',
  label: 'Hero Section',
  fields: [/* ... */]
}

// tina/config.ts
import { heroBlockSchema } from '../components/hero/hero.schema'

export default defineConfig({
  schema: {
    collections: [{
      fields: [{
        type: 'object',
        name: 'hero',
        ...heroBlockSchema
      }]
    }]
  }
})
```

#### Solution 3: Use Type Imports Only

```typescript
// ✅ Import only types (doesn't execute code)
import type { HeroProps } from '../components/Hero'
```

### Prevention

- Keep `tina/config.ts` minimal
- Only import type definitions and simple utilities
- Avoid importing UI components
- Extract schema definitions to separate files
- Test config builds with `npx @tinacms/cli@latest build`

### Related Links

- Official Docs: https://tina.io/docs/errors/esbuild-error
- GitHub Issue: https://github.com/tinacms/tinacms/issues/3472

---

## 2. Module Resolution Issues

### Error Messages

```
Error: Could not resolve "tinacms"
Module not found: Can't resolve 'tinacms'
Cannot find module 'tinacms' or its corresponding type declarations
```

### Causes

1. **Corrupted Installation**
   - Incomplete `npm install`
   - Network issues during installation
   - Corrupted `node_modules`

2. **Version Mismatches**
   - Conflicting peer dependencies
   - React version mismatch
   - TinaCMS version incompatibility

3. **Missing Dependencies**
   - `react` and `react-dom` not installed (required even for non-React frameworks)
   - `@tinacms/cli` not in devDependencies

### Solutions

#### Solution 1: Clean Reinstall (npm)

```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
npm install
```

#### Solution 2: Clean Reinstall (pnpm)

```bash
# Remove node_modules and lock file
rm -rf node_modules pnpm-lock.yaml

# Clear pnpm cache
pnpm store prune

# Reinstall all dependencies
pnpm install
```

#### Solution 3: Clean Reinstall (yarn)

```bash
# Remove node_modules and lock file
rm -rf node_modules yarn.lock

# Clear yarn cache
yarn cache clean

# Reinstall all dependencies
yarn install
```

#### Solution 4: Ensure React Dependencies (Non-React Frameworks)

Even if you're using Hugo, Jekyll, or Eleventy, you MUST install React:

```bash
npm install react@^19 react-dom@^19
```

### Prevention

- Use lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)
- Don't use `--no-optional` or `--omit=optional` flags
- Ensure `react` and `react-dom` are in dependencies
- Keep TinaCMS versions consistent across packages

### Related Links

- GitHub Issue: https://github.com/tinacms/tinacms/issues/4530

---

## 3. Field Naming Constraints

### Error Messages

```
Field name contains invalid characters
Invalid field name: 'hero-image'
Field names must be alphanumeric
```

### Causes

TinaCMS field names can ONLY contain:
- Letters (a-z, A-Z)
- Numbers (0-9)
- Underscores (_)

**NOT allowed**:
- Hyphens (-)
- Spaces ( )
- Special characters (!@#$%^&*)

This is a **breaking change** from Forestry.io which allowed hyphens.

### Solutions

#### Solution 1: Use Underscores

```typescript
// ❌ Bad
{
  name: 'hero-image',
  label: 'Hero Image',
  type: 'image'
}

// ✅ Good
{
  name: 'hero_image',
  label: 'Hero Image',
  type: 'image'
}
```

#### Solution 2: Use camelCase

```typescript
// ✅ Also good
{
  name: 'heroImage',
  label: 'Hero Image',
  type: 'image'
}
```

#### Solution 3: Migrate Existing Content

If migrating from Forestry.io with hyphenated field names:

```bash
# Find all files with hyphenated frontmatter
find content -name "*.md" -exec sed -i 's/hero-image:/hero_image:/g' {} +
find content -name "*.md" -exec sed -i 's/cover-photo:/cover_photo:/g' {} +
```

### Prevention

- Use underscores or camelCase for all field names
- Document naming convention in team style guide
- Use linter/validator to catch invalid names

### Related Links

- Migration Docs: https://tina.io/docs/forestry/migrate#field-names

---

## 4. Docker Binding Issues

### Error Messages

```
Connection refused: http://localhost:3000
Cannot connect to TinaCMS admin interface
ERR_CONNECTION_REFUSED
```

### Causes

By default, development servers bind to `127.0.0.1` (localhost only), which prevents access from:
- Docker containers
- Network devices
- Remote connections

### Solutions

#### Solution 1: Next.js

```bash
tinacms dev -c "next dev --hostname 0.0.0.0"
```

Or in `package.json`:
```json
{
  "scripts": {
    "dev": "tinacms dev -c \"next dev --hostname 0.0.0.0\""
  }
}
```

#### Solution 2: Vite

```bash
tinacms dev -c "vite --host 0.0.0.0"
```

Or in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
```

#### Solution 3: Astro

```bash
tinacms dev -c "astro dev --host 0.0.0.0"
```

Or in `astro.config.mjs`:
```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 4321
  }
})
```

#### Solution 4: Docker Compose

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    command: npm run dev  # Must include --hostname 0.0.0.0
```

### Prevention

- Always use `--host 0.0.0.0` in Docker environments
- Configure framework config files instead of CLI flags
- Document binding requirements in README

---

## 5. Missing `_template` Key Error

### Error Messages

```
GetCollection failed: Unable to fetch
template name was not provided
Error: Document missing _template field
```

### Causes

When a collection uses `templates` array (multiple schemas), each document **must** include a `_template` field in its frontmatter specifying which template to use.

### Solutions

#### Solution 1: Use `fields` Instead (Recommended)

If you only have one schema, use `fields` instead of `templates`:

```typescript
// ❌ Using templates (requires _template in frontmatter)
{
  name: 'post',
  path: 'content/posts',
  templates: [
    {
      name: 'article',
      fields: [/* ... */]
    }
  ]
}

// ✅ Using fields (no _template needed)
{
  name: 'post',
  path: 'content/posts',
  fields: [/* ... */]  // Same fields as above
}
```

#### Solution 2: Add `_template` to Frontmatter

If you need multiple templates, ensure all documents have `_template`:

```yaml
---
_template: article
title: My Blog Post
date: 2025-10-24
---

Content here...
```

#### Solution 3: Batch Update Existing Files

```bash
# Add _template field to all files
find content/posts -name "*.md" -exec sed -i '1a _template: article' {} +
```

#### Solution 4: Set Default Template

```typescript
{
  name: 'post',
  path: 'content/posts',
  templates: [
    {
      name: 'article',
      fields: [/* ... */]
    }
  ],
  ui: {
    defaultItem: () => ({
      _template: 'article'  // Default template for new documents
    })
  }
}
```

### Prevention

- Use `fields` for single-schema collections
- Use `templates` only when you truly need multiple schemas
- Document `_template` requirement in team guidelines

---

## 6. Path Mismatch Issues

### Error Messages

```
No files found in collection
File not found: content/posts/hello.md
GraphQL query returned empty results
```

### Causes

The `path` in your collection config doesn't match where files actually live.

### Solutions

#### Solution 1: Verify File Locations

```bash
# Check where your files actually are
ls -R content/

# If files are in content/posts/
# Your config should be:
{
  name: 'post',
  path: 'content/posts'  // ✅ Matches file location
}
```

#### Solution 2: No Trailing Slash

```typescript
// ❌ Bad
{
  path: 'content/posts/'  // Trailing slash may cause issues
}

// ✅ Good
{
  path: 'content/posts'   // No trailing slash
}
```

#### Solution 3: Use Relative Paths

```typescript
// ✅ Path relative to project root
{
  path: 'content/posts'
}

// ❌ Don't use absolute paths
{
  path: '/home/user/project/content/posts'
}
```

#### Solution 4: Audit Paths

```bash
# TinaCMS CLI includes audit command
npx @tinacms/cli@latest audit

# Shows which files match collections
# Helps identify path mismatches
```

### Prevention

- Always verify file structure before setting `path`
- Use `npx @tinacms/cli@latest audit` to check paths
- Document expected file structure in README

---

## 7. Build Script Ordering Problems

### Error Messages

```
ERROR: Cannot find module '../tina/__generated__/client'
ERROR: Property 'queries' does not exist on type '{}'
Type error: Module '../tina/__generated__/client' has no exported member 'client'
```

### Causes

Framework build runs before `tinacms build`, so generated TypeScript types don't exist yet.

### Solutions

#### Solution 1: Correct Script Order

```json
{
  "scripts": {
    "build": "tinacms build && next build"  // ✅ Tina FIRST
    // NOT: "build": "next build && tinacms build"  // ❌ Wrong
  }
}
```

#### Solution 2: CI/CD Fix (GitHub Actions)

```yaml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install

      - name: Build Tina
        run: npx @tinacms/cli@latest build  # Generate types FIRST

      - name: Build App
        run: npm run build  # Now framework build works
```

#### Solution 3: Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "tinacms build && next build"
}
```

#### Solution 4: Netlify Configuration

```toml
# netlify.toml
[build]
  command = "tinacms build && npm run build"
```

### Prevention

- Always run `tinacms build` before framework build
- Document correct build order in README
- Add build order to CI/CD templates

---

## 8. Failed Loading TinaCMS Assets

### Error Messages

```
Failed to load resource: net::ERR_CONNECTION_REFUSED
http://localhost:4001/...
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

### Causes

1. **Development `admin/index.html` pushed to production**
   - Dev version loads assets from `localhost:4001`
   - Production needs built assets

2. **Subdirectory deployment without `basePath` config**
   - Site deployed to `example.com/blog/`
   - TinaCMS tries to load from `example.com/admin/` (fails)

### Solutions

#### Solution 1: Always Build for Production

```json
{
  "scripts": {
    "build": "tinacms build && next build"  // ✅ Always build
    // NOT: "build": "tinacms dev"           // ❌ Never dev in prod
  }
}
```

#### Solution 2: Configure `basePath` for Subdirectories

If site is at `example.com/blog/`:

```typescript
// tina/config.ts
export default defineConfig({
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
    basePath: 'blog'  // ← Subdirectory path
  }
})
```

#### Solution 3: Verify .gitignore

```gitignore
# .gitignore

# TinaCMS
.tina/__generated__
admin/index.html  # ← Don't commit dev admin

# But DO commit:
# public/admin/  (production build)
```

#### Solution 4: CI/CD Always Build

```yaml
# GitHub Actions
- run: npx @tinacms/cli@latest build  # Not dev!
```

### Prevention

- Use `tinacms build` in all CI/CD
- Set `basePath` for subdirectory deploys
- Don't commit `admin/index.html` from dev mode

---

## 9. Reference Field 503 Service Unavailable

### Error Messages

```
503 Service Unavailable
Request timed out
Reference field dropdown not loading
```

### Causes

Reference fields load ALL documents from the referenced collection. If the collection has 100s or 1000s of items, the request times out.

**Current Limitation**: TinaCMS does not support pagination for reference fields (as of v2.9.0).

### Solutions

#### Solution 1: Split Large Collections

Instead of one huge collection, split by category:

```typescript
// ❌ Single huge collection (1000+ authors)
{
  name: 'author',
  path: 'content/authors',
  fields: [/* ... */]
}

// ✅ Split into manageable sizes
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

#### Solution 2: Use String Field with Validation

Instead of reference, use a string select:

```typescript
// ❌ Reference field (times out with 100+ authors)
{
  type: 'reference',
  name: 'author',
  collections: ['author']
}

// ✅ String field with curated options
{
  type: 'string',
  name: 'author_id',
  label: 'Author',
  options: [
    { label: 'John Doe', value: 'john-doe' },
    { label: 'Jane Smith', value: 'jane-smith' },
    // ... curated list of ~50 authors max
  ]
}
```

#### Solution 3: Custom Field Component (Advanced)

Create a custom field component with client-side pagination:

```typescript
// Advanced: Requires custom React component
{
  type: 'string',
  name: 'author_id',
  ui: {
    component: 'author-select-paginated'  // Your custom component
  }
}
```

See: https://tina.io/docs/extending-tina/custom-field-components/

#### Solution 4: Use External Service

For very large datasets, consider:
- Store authors in D1/KV
- Use custom field component to query via API
- Load data on-demand with search/filter

### Prevention

- Limit referenced collections to <100 items
- Use string fields for large datasets
- Consider alternative architectures for huge collections

### Related Links

- GitHub Issue: https://github.com/tinacms/tinacms/issues/3821
- Custom Fields Docs: https://tina.io/docs/extending-tina/custom-field-components/

---

## Additional Resources

### Official Documentation
- **Main Docs**: https://tina.io/docs
- **Error FAQ**: https://tina.io/docs/errors/faq
- **ESbuild Error**: https://tina.io/docs/errors/esbuild-error
- **Contributing**: https://tina.io/docs/contributing/troubleshooting

### Support
- **Discord**: https://discord.gg/zumN63Ybpf
- **GitHub Issues**: https://github.com/tinacms/tinacms/issues
- **GitHub Discussions**: https://github.com/tinacms/tinacms/discussions

---

**Last Updated**: 2025-10-24
**Errors Documented**: 9
**Prevention Rate**: 100%
