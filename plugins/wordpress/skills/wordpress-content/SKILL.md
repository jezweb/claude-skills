---
name: wordpress-content
description: >
  Create and manage WordPress posts, pages, media, categories, and menus.
  Workflow: determine content type, choose method (WP-CLI or REST API), execute, verify.
  Use when creating blog posts, updating pages, uploading media, managing categories
  and tags, updating menus, or doing bulk content operations on WordPress sites.
compatibility: Designed for Claude Code (or similar products)
---

# WordPress Content

Create, update, and manage WordPress content — posts, pages, media, categories, tags, and menus. Produces live content on the site via WP-CLI or the REST API.

## Prerequisites

- Working WP-CLI SSH connection or REST API credentials (use **wordpress-setup** skill)
- Site config from `wordpress.config.json` or `wp-cli.yml`

## Workflow

### Step 1: Determine the Operation

| Task | Best Method |
|------|-------------|
| Create/edit single post or page | WP-CLI `wp post create/update` |
| Bulk create posts | WP-CLI loop or REST API batch |
| Upload images/media | WP-CLI `wp media import` |
| Manage categories/tags | WP-CLI `wp term` |
| Update navigation menus | WP-CLI `wp menu` |
| Scheduled posts | WP-CLI with `--post_date` |
| Complex HTML content | Write to temp file, pass to WP-CLI |
| No SSH access available | REST API with Application Password |

### Step 2: Create Content

#### Blog Posts

```bash
# Simple post
wp @site post create \
  --post_type=post \
  --post_title="My New Blog Post" \
  --post_content="<p>Post content here.</p>" \
  --post_status=draft \
  --post_category=3,5

# Post from HTML file (better for long content)
wp @site post create ./post-content.html \
  --post_type=post \
  --post_title="My New Blog Post" \
  --post_status=draft \
  --post_excerpt="A brief summary of the post." \
  --post_category=3,5 \
  --tags_input="tag1,tag2"
```

**Post statuses**: `draft`, `publish`, `pending`, `future` (use with `--post_date`)

#### Pages

```bash
wp @site post create \
  --post_type=page \
  --post_title="About Us" \
  --post_content="<h2>Our Story</h2><p>Content here...</p>" \
  --post_status=publish \
  --post_parent=0 \
  --menu_order=10
```

#### Scheduled Posts

```bash
wp @site post create \
  --post_type=post \
  --post_title="Scheduled Post" \
  --post_content="<p>This goes live tomorrow.</p>" \
  --post_status=future \
  --post_date="2026-02-23 09:00:00"
```

### Step 3: Upload Media

```bash
# Upload from URL
wp @site media import "https://example.com/image.jpg" \
  --title="Product Photo" \
  --alt="Product front view" \
  --caption="Our latest product"

# Upload from local file (requires SCP first for remote sites)
scp ./image.jpg user@host:/tmp/image.jpg
wp @site media import /tmp/image.jpg --title="Local Upload"

# Import and set as featured image in one step
wp @site media import "https://example.com/hero.jpg" \
  --title="Hero" --featured_image --post_id={id}

# List media
wp @site post list --post_type=attachment --fields=ID,post_title,guid

# Regenerate thumbnails
wp @site media regenerate --yes
```

**Set featured image on a post**:

```bash
# Get the attachment ID from the import output, then:
wp @site post meta update {post_id} _thumbnail_id {attachment_id}
```

### Step 4: Manage Taxonomy

#### Categories

```bash
# List categories
wp @site term list category --fields=term_id,name,slug,count

# Create category
wp @site term create category "News" --slug=news --description="Company news and updates"

# Create child category
wp @site term create category "Product News" --slug=product-news --parent=5

# Update category
wp @site term update category {term_id} --name="Updated Name"

# Assign category to post
wp @site post term add {post_id} category news
```

#### Tags

```bash
# List tags
wp @site term list post_tag --fields=term_id,name,slug,count

# Create tag
wp @site term create post_tag "new-tag"

# Add tags during post creation
wp @site post create --post_title="..." --tags_input="seo,marketing,tips"

# Add tags to existing post
wp @site post term add {post_id} post_tag seo marketing tips
```

### Step 5: Manage Menus

```bash
# List menus
wp @site menu list --fields=term_id,name,slug,count

# List items in a menu
wp @site menu item list main-menu --fields=db_id,type,title,link,position

# Add page to menu
wp @site menu item add-post main-menu {page_id} --title="About Us"

# Add custom link
wp @site menu item add-custom main-menu "Contact" "https://example.com/contact/"

# Add category archive to menu
wp @site menu item add-term main-menu category {term_id}

# Reorder (set position)
wp @site menu item update {item_id} --position=3

# Delete menu item
wp @site menu item delete {item_id}
```

### Step 6: Update Existing Content

```bash
# Update post title and content
wp @site post update {post_id} \
  --post_title="Updated Title" \
  --post_content="<p>New content.</p>"

# Update from file
wp @site post update {post_id} ./updated-content.html

# Search posts
wp @site post list --s="search term" --fields=ID,post_title

# Bulk update status
wp @site post list --post_type=post --post_status=draft --field=ID | \
  xargs -I {} wp @site post update {} --post_status=publish

# Delete (trash)
wp @site post delete {post_id}

# Delete permanently
wp @site post delete {post_id} --force
```

### Step 7: Post Meta and Custom Fields

```bash
# Get all meta for a post
wp @site post meta list {post_id} --fields=meta_key,meta_value

# Get specific meta
wp @site post meta get {post_id} meta_key

# Set meta
wp @site post meta update {post_id} meta_key "meta_value"

# Add meta (allows duplicates)
wp @site post meta add {post_id} meta_key "meta_value"

# Delete meta
wp @site post meta delete {post_id} meta_key
```

ACF stores fields with both the field value and a reference key (`_field_name` -> `field_abc123`).

### Step 8: Search and Replace

```bash
# Dry run first — always
wp @site search-replace "old text" "new text" --dry-run

# Execute
wp @site search-replace "old text" "new text" --precise

# Limit to specific table
wp @site search-replace "old" "new" wp_posts --precise

# Limit to specific column
wp @site search-replace "old" "new" wp_posts post_content --precise
```

### Step 9: Export and Import

```bash
# Export all content
wp @site export --dir=/tmp/

# Export specific post type
wp @site export --post_type=post --dir=/tmp/

# Import
wp @site import /path/to/file.xml --authors=mapping.csv
```

### Step 10: Verify

```bash
# Check the post
wp @site post get {post_id} --fields=ID,post_title,post_status,guid

# Get the live URL
wp @site post get {post_id} --field=guid

# List recent posts
wp @site post list --post_type=post --posts_per_page=5 --fields=ID,post_title,post_status,post_date
```

Provide the admin URL and live URL:
- Admin: `https://example.com/wp-admin/post.php?post={id}&action=edit`
- Live: `https://example.com/{slug}/`

---

## REST API Reference

When WP-CLI is not available, use the WordPress REST API with Application Password auth.

### Authentication

```bash
# Base64 encode credentials
AUTH=$(echo -n "username:xxxx xxxx xxxx xxxx xxxx xxxx" | base64)

# Use in requests
curl -s https://example.com/wp-json/wp/v2/posts \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json"
```

### Endpoints

| Resource | Endpoint |
|----------|----------|
| Posts | `/wp-json/wp/v2/posts` |
| Pages | `/wp-json/wp/v2/pages` |
| Media | `/wp-json/wp/v2/media` |
| Categories | `/wp-json/wp/v2/categories` |
| Tags | `/wp-json/wp/v2/tags` |

All support GET (list/single), POST (create), PUT (update), DELETE.

### Create Post via REST

```bash
curl -s https://example.com/wp-json/wp/v2/posts \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Post",
    "content": "<p>Post content here.</p>",
    "status": "draft",
    "categories": [3, 5],
    "tags": [10, 12],
    "excerpt": "Brief summary",
    "featured_media": 456
  }' | jq '{id, link, status}'
```

### Create Page via REST

```bash
curl -s https://example.com/wp-json/wp/v2/pages \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "About Us",
    "content": "<h2>Our Story</h2><p>Content...</p>",
    "status": "publish",
    "parent": 0
  }'
```

### Upload Media via REST

```bash
curl -s https://example.com/wp-json/wp/v2/media \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Disposition: attachment; filename=photo.jpg" \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg | jq '{id, source_url}'
```

### Create Category via REST

```bash
curl -s https://example.com/wp-json/wp/v2/categories \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{"name": "News", "slug": "news", "description": "Company updates"}'
```

### Query Parameters

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `per_page` | Results per page (max 100) | `?per_page=50` |
| `page` | Pagination | `?page=2` |
| `search` | Search term | `?search=keyword` |
| `status` | Filter by status | `?status=draft` |
| `categories` | Filter by category ID | `?categories=3` |
| `orderby` | Sort field | `?orderby=date` |
| `order` | Sort direction | `?order=desc` |
| `_fields` | Limit response fields | `?_fields=id,title,link` |

**Menus**: Navigation menus have limited REST API support. The `/wp-json/wp/v2/navigation` endpoint exists for block-based navigation in FSE themes. For classic menus, use WP-CLI.

---

## Critical Patterns

### HTML Content in WP-CLI

For anything beyond a sentence, write HTML to a temp file and pass it:

```bash
cat > /tmp/post-content.html << 'EOF'
<h2>Section Heading</h2>
<p>Paragraph content with <strong>bold</strong> and <a href="/link">links</a>.</p>
<ul>
  <li>List item one</li>
  <li>List item two</li>
</ul>
EOF

wp @site post create /tmp/post-content.html --post_title="My Post" --post_status=draft
```

Shell quoting in `--post_content` is fragile for complex HTML.

### Bulk Operations

For creating many posts, use a loop with verification:

```bash
while IFS=, read -r title slug content_file category; do
  wp @site post create "$content_file" \
    --post_type=post \
    --post_title="$title" \
    --post_name="$slug" \
    --post_category="$category" \
    --post_status=draft
  sleep 0.5
done < posts.csv
```

Always create as `draft` first, review, then bulk-publish.
