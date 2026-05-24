---
name: wordpress-elementor
description: "Edit Elementor pages and manage templates on WordPress sites via browser automation (for visual / structural changes) or WP-CLI (for safe text replacements). Use whenever the user wants to edit an Elementor page, update text in Elementor widgets, apply or manage Elementor templates, or make content changes to pages built with the Elementor page builder."
compatibility: claude-code-only
---

# WordPress Elementor

Edit Elementor pages and manage templates on existing WordPress sites. Produces updated page content via browser automation (for visual/structural changes) or WP-CLI (for safe text replacements).

## Prerequisites

- Working WP-CLI connection or admin access (use **wordpress-setup** skill)
- Elementor installed and active: `wp @site plugin status elementor`

## Workflow

### Step 1: Identify the Page

```bash
# List Elementor pages
wp @site post list --post_type=page --meta_key=_elementor_edit_mode --meta_value=builder \
  --fields=ID,post_title,post_name,post_status

# Editor URL format: https://example.com/wp-admin/post.php?post={ID}&action=elementor
```

### Step 2: Choose Editing Method

| Change Type | Method | Risk |
|-------------|--------|------|
| Text content updates | WP-CLI search-replace | Low (with backup) |
| Image URL swaps | WP-CLI meta update | Low (with backup) |
| Widget styling | Browser automation | None |
| Add/remove sections | Browser automation | None |
| Layout changes | Browser automation | None |
| Template application | Browser automation | None |

**Rule of thumb**: If you're only changing text or URLs within existing widgets, WP-CLI is faster. For anything structural, use the visual editor via browser.

### Step 3a: Text Updates via WP-CLI

**Always back up first**:

```bash
wp @site post meta get {post_id} _elementor_data > /tmp/elementor-backup-{post_id}.json
```

**Pre-flight checklist**:

1. Back up the postmeta (above)
2. Dry run the replacement
3. Verify the dry run matches expectations (correct number of replacements)
4. Execute
5. Flush CSS cache
6. Verify visually

**Simple text replacement**:

```bash
# Dry run
wp @site search-replace "Old Heading Text" "New Heading Text" wp_postmeta \
  --include-columns=meta_value --dry-run --precise

# Execute (after confirming dry run looks correct)
wp @site search-replace "Old Heading Text" "New Heading Text" wp_postmeta \
  --include-columns=meta_value --precise
```

**After updating**, clear Elementor's CSS cache:

```bash
wp @site elementor flush-css
```

If the `elementor` WP-CLI command isn't available:

```bash
wp @site option delete _elementor_global_css
wp @site post meta delete-all _elementor_css
```

**What's safe to replace**:

| Safe | Risky |
|------|-------|
| Headings text | HTML structure |
| Paragraph text | Widget IDs |
| Button text and URLs | Section/column settings |
| Image URLs (same dimensions) | Layout properties |
| Phone numbers, emails | CSS classes |
| Addresses | Element ordering |

### Step 3b: Visual Editing via Browser Automation

For structural changes, use browser automation to interact with Elementor's visual editor.

**Login flow** (skip if already logged in via Chrome MCP):

1. Navigate to `https://example.com/wp-admin/`
2. Enter username and password
3. Click "Log In"
4. Wait for dashboard to load

**Open the editor**:

1. Navigate to `https://example.com/wp-admin/post.php?post={ID}&action=elementor`
2. Wait for Elementor loading overlay to disappear (can take 5-10 seconds)
3. Editor is ready when the left sidebar shows widget panels

**Edit text content**:

1. Click on the text element in the page preview (right panel)
2. The element becomes selected (blue border)
3. The left sidebar shows the element's settings
4. Under "Content" tab, edit the text in the editor field
5. Changes appear live in the preview
6. Click "Update" (green button, bottom left) or Ctrl+S

**Edit heading**:

1. Click the heading in the preview
2. Left sidebar > Content tab > "Title" field
3. Edit the text
4. Optionally adjust: HTML tag (H1-H6), alignment, link
5. Save

**Change image**:

1. Click the image widget in the preview
2. Left sidebar > Content tab > click the image thumbnail
3. Media Library opens
4. Select new image or upload
5. Click "Insert Media"
6. Save

**Edit button**:

1. Click the button in the preview
2. Left sidebar > Content tab: Text (label), Link (URL), Icon (optional)
3. Style tab: colours, typography, border, padding
4. Save

**Using playwright-cli**:

```bash
playwright-cli -s=wp-editor open "https://example.com/wp-admin/"
# Login first, then navigate to Elementor editor
playwright-cli -s=wp-editor navigate "https://example.com/wp-admin/post.php?post={ID}&action=elementor"
```

Or Chrome MCP if using the user's logged-in session.

### Step 4: Manage Templates

**List saved templates**:

```bash
wp @site post list --post_type=elementor_library --fields=ID,post_title,post_status
```

**Export a template** (browser):

1. Navigate to: `https://example.com/wp-admin/edit.php?post_type=elementor_library`
2. Hover over the template > "Export Template"
3. Downloads as .json file

**Import a template** (browser):

1. Navigate to: `https://example.com/wp-admin/edit.php?post_type=elementor_library`
2. Click "Import Templates" at the top
3. Choose file > upload .json
4. Template appears in the library

**Apply a template to a new page**:

1. Create the page: `wp @site post create --post_type=page --post_title="New Page" --post_status=draft`
2. Open in Elementor via browser
3. Click the folder icon (Add Template)
4. Select from "My Templates" tab
5. Click "Insert"
6. Customise and save

**Duplicate an existing page via WP-CLI**:

```bash
# Get source page's Elementor data
SOURCE_DATA=$(wp @site post meta get {source_id} _elementor_data)
SOURCE_CSS=$(wp @site post meta get {source_id} _elementor_page_settings)

# Create new page
NEW_ID=$(wp @site post create --post_type=page --post_title="Duplicated Page" --post_status=draft --porcelain)

# Copy Elementor data
wp @site post meta update $NEW_ID _elementor_data "$SOURCE_DATA"
wp @site post meta update $NEW_ID _elementor_edit_mode "builder"
wp @site post meta update $NEW_ID _elementor_page_settings "$SOURCE_CSS"

# Regenerate CSS
wp @site elementor flush-css
```

**Apply template between pages via WP-CLI**:

```bash
# Get source data
SOURCE=$(wp @site post meta get {source_id} _elementor_data)
SETTINGS=$(wp @site post meta get {source_id} _elementor_page_settings)

# Apply to target
wp @site post meta update {target_id} _elementor_data "$SOURCE"
wp @site post meta update {target_id} _elementor_edit_mode "builder"
wp @site post meta update {target_id} _elementor_page_settings "$SETTINGS"

# Clear cache
wp @site elementor flush-css
```

### Step 5: Verify

```bash
# Check the page status
wp @site post get {post_id} --fields=ID,post_title,post_status,guid

# Get live URL
wp @site post get {post_id} --field=guid
```

Take a screenshot to confirm visual changes:

```bash
playwright-cli -s=verify open "https://example.com/{page-slug}/"
playwright-cli -s=verify screenshot --filename=page-verify.png
playwright-cli -s=verify close
```

---

## REST API gotchas (when WP-CLI isn't an option)

When the editing target is REST-only (Application Password auth without SSH), three quirks consistently bite — discovered while building `elementor-mcp-agent`:

### 1. REST silently drops writes to unregistered postmeta keys

`PUT /wp-json/wp/v2/pages/{id}` with `{meta: {_my_custom_key: "value"}}` returns 200 OK, but **the value is never persisted** unless `register_meta()` declared the key with `show_in_rest: true`. Plugins register their own canonical keys (`_elementor_data`, `_elementor_page_settings`) but nothing custom (like `_elementor_data_backup_2026-…`).

**Implication for automated backups**: never trust REST for custom backup keys. Either:
- Use `wp post meta update` over SSH (always works), or
- Dump the value to a local JSON file.

### 2. Default Kit shows up under `template_type=widget` filters

`/wp-json/wp/v2/elementor_library?meta_key=_elementor_template_type&meta_value=widget` returns the **Default Kit** (a `kit` template) along with real widgets. Reason: REST `meta_value` filtering is unreliable for unregistered meta keys — it tends to fall back to `meta_key` presence check only.

**Implication**: filter **client-side** after fetching, by checking `meta._elementor_template_type === 'widget'` on each result.

### 3. `_elementor_page_settings` is an OBJECT via REST, a STRING via WP-CLI

`GET /wp-json/wp/v2/pages/{id}?context=edit` returns `meta._elementor_page_settings` as a **parsed object**. `wp post meta get` returns it as a **serialised JSON string**. If you read with one and write with the other, types will mismatch and REST will reject the PUT with *"Le paramètre meta._elementor_page_settings n'est pas de type object"*.

**Implication**: normalise on read. If you got a string, `JSON.parse()` it before writing back via REST. If you got an object, `JSON.stringify()` it before piping through WP-CLI.

---

## Critical Patterns

### Elementor Data Format

Elementor stores page content as JSON in `_elementor_data` postmeta. The structure is:

```
Section > Column > Widget
```

Each element has an `id`, `elType`, `widgetType`, and `settings` object. Direct manipulation of this JSON is possible but fragile -- always back up first and prefer `search-replace` over manual JSON editing.

### CSS Cache

After any WP-CLI change to Elementor data, you must flush the CSS cache. Elementor pre-generates CSS from widget settings. Stale cache = visual changes don't appear.

```bash
wp @site elementor flush-css
# OR if elementor CLI not available:
wp @site option delete _elementor_global_css
wp @site post meta delete-all _elementor_css
```

### Global Widgets

Global widgets are shared across pages. Editing one updates all instances.

```bash
# List global widgets
wp @site post list --post_type=elementor_library --meta_key=_elementor_template_type \
  --meta_value=widget --fields=ID,post_title
```

**Caution**: Replacing text in a global widget's data affects every page that uses it.

### Elementor Pro vs Free

| Feature | Free | Pro |
|---------|------|-----|
| Basic widgets | Yes | Yes |
| Theme Builder | No | Yes |
| Custom fonts | No | Yes |
| Form widget | No | Yes |
| WooCommerce widgets | No | Yes |
| Dynamic content | No | Yes |

Theme Builder templates (header, footer, archive) are stored as `elementor_library` post type with specific meta indicating their display conditions.

### Common Elementor WP-CLI Commands

If the Elementor CLI extension is available:

```bash
wp @site elementor flush-css          # Clear CSS cache
wp @site elementor library sync       # Sync with template library
wp @site elementor update db          # Update database after version change
```
