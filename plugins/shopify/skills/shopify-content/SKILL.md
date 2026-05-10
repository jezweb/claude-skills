---
name: shopify-content
description: >
  Create and manage Shopify pages, blog posts, navigation, and SEO metadata.
  Workflow: determine content type, generate content, create via API or browser, verify.
  Use when creating pages, writing blog posts, updating navigation menus,
  managing redirects, or updating SEO metadata on a Shopify store.
compatibility: Designed for Claude Code (or similar products)
---

# Shopify Content

Create and manage Shopify store content — pages, blog posts, navigation menus, and SEO metadata. Produces live content in the store via the Admin API or browser automation.

## Prerequisites

- Admin API access token with `read_content`, `write_content` scopes (use **shopify-setup** skill)
- For navigation: `read_online_store_navigation`, `write_online_store_navigation` scopes

## Workflow

### Step 1: Determine Content Type

| Content Type | API Support | Method |
|-------------|-------------|--------|
| Pages | Full | GraphQL Admin API |
| Blog posts | Full | GraphQL Admin API |
| Navigation menus | Limited | Browser automation preferred |
| Redirects | Full | REST Admin API |
| SEO metadata | Per-resource | GraphQL on the resource |
| Metaobjects | Full | GraphQL Admin API |

### Step 2a: Create Pages

```bash
curl -s https://{store}/admin/api/2025-01/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: {token}" \
  -d '{
    "query": "mutation pageCreate($page: PageCreateInput!) { pageCreate(page: $page) { page { id title handle } userErrors { field message } } }",
    "variables": {
      "page": {
        "title": "About Us",
        "handle": "about",
        "body": "<h2>Our Story</h2><p>Content here...</p>",
        "isPublished": true,
        "seo": {
          "title": "About Us | Store Name",
          "description": "Learn about our story and mission."
        }
      }
    }
  }'
```

**Page body** accepts HTML. Keep it semantic:
- Use `<h2>` through `<h6>` for headings (the page title is `<h1>`)
- Use `<p>`, `<ul>`, `<ol>` for body text
- Use `<a href="...">` for links
- Avoid inline styles — the theme handles styling

### Step 2b: Create Blog Posts

Shopify blogs have a two-level structure: **Blog** (container) > **Article** (post).

**Find or create a blog**:

```graphql
{
  blogs(first: 10) {
    edges {
      node { id title handle }
    }
  }
}
```

Most stores have a default blog called "News". Create articles in it:

```graphql
mutation {
  articleCreate(article: {
    blogId: "gid://shopify/Blog/123"
    title: "New Product Launch"
    handle: "new-product-launch"
    contentHtml: "<p>We're excited to announce...</p>"
    author: { name: "Store Team" }
    tags: ["news", "products"]
    isPublished: true
    publishDate: "2026-02-22T00:00:00Z"
    seo: {
      title: "New Product Launch | Store Name"
      description: "Announcing our latest product range."
    }
    image: {
      src: "https://example.com/blog-image.jpg"
      altText: "New product collection"
    }
  }) {
    article { id title handle }
    userErrors { field message }
  }
}
```

### Step 2c: Update Navigation Menus

Navigation menus have limited API support. Use browser automation:

1. Navigate to `https://{store}.myshopify.com/admin/menus`
2. Select the menu to edit (typically "Main menu" or "Footer menu")
3. Add, reorder, or remove menu items
4. Save changes

Alternatively, use the GraphQL `menuUpdate` mutation if the API version supports it:

```graphql
mutation menuUpdate($id: ID!, $items: [MenuItemInput!]!) {
  menuUpdate(id: $id, items: $items) {
    menu { id title }
    userErrors { field message }
  }
}
```

### Step 2d: Create Redirects

URL redirects use the REST API:

```bash
curl -s https://{store}/admin/api/2025-01/redirects.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: {token}" \
  -d '{
    "redirect": {
      "path": "/old-page",
      "target": "/new-page"
    }
  }'
```

### Step 2e: Update SEO Metadata

SEO fields are on each resource (product, page, article). Update via the resource's mutation:

```graphql
mutation {
  pageUpdate(page: {
    id: "gid://shopify/Page/123"
    seo: {
      title: "Updated SEO Title"
      description: "Updated meta description under 160 chars."
    }
  }) {
    page { id title }
    userErrors { field message }
  }
}
```

### Step 3: Verify

Query back the content to confirm:

```graphql
{
  pages(first: 10, reverse: true) {
    edges {
      node { id title handle isPublished createdAt }
    }
  }
}
```

Provide the admin URL and the live URL for the user to review:
- Admin: `https://{store}.myshopify.com/admin/pages`
- Live: `https://{store}.myshopify.com/pages/{handle}`

---

## Critical Patterns

### Page vs Metaobject

For simple content (About, Contact, FAQ), use **pages**. For structured, repeatable content (team members, testimonials, locations), use **metaobjects** — they have typed fields and can be queried programmatically.

### Blog SEO

Every blog post should have:
- **SEO title**: under 60 characters, includes primary keyword
- **Meta description**: under 160 characters, compelling summary
- **Handle**: clean URL slug with keywords
- **Image with alt text**: for social sharing and accessibility

### Content Scheduling

Use `publishDate` on articles for scheduled publishing. Pages publish immediately when `isPublished: true`.

### Bulk Content

For many pages (e.g. location pages, service pages), use a loop with rate limiting:

```bash
for page in pages_data:
    create_page(page)
    sleep(0.5)  # Respect rate limits
```

---

## Reference Files

- `references/content-types.md` — API endpoints, metaobject patterns, and browser-only operations
