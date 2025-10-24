# Migrating from Decap CMS to Sveltia CMS

**TL;DR**: Change 1 line in `admin/index.html`. Your config.yml works as-is.

---

## Why Migrate?

**Sveltia CMS** is the modern successor to Decap CMS (formerly Netlify CMS) with:

- ✅ **5x smaller bundle** (300 KB vs 1.5 MB)
- ✅ **Faster performance** (GraphQL, instant loading)
- ✅ **260+ issues solved** from Decap CMS
- ✅ **Better mobile support**
- ✅ **Dark mode** built-in
- ✅ **Active maintenance** (frequent releases)
- ✅ **100% config compatible**

---

## Migration Steps

### Step 1: Update Script Tag

**Location**: `static/admin/index.html` (Hugo) or `admin/index.html` (Jekyll/11ty)

**OLD (Decap CMS)**:
```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
```

**NEW (Sveltia CMS)**:
```html
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
```

**Important**: Add `type="module"` attribute!

---

### Step 2: Keep Existing Config

```yaml
# admin/config.yml - NO CHANGES NEEDED!
backend:
  name: github
  repo: owner/repo
  branch: main
  # base_url: ... (keep if using OAuth proxy)

media_folder: static/images
public_folder: /images

collections:
  # ... all your existing collections work as-is
```

**Your entire config.yml is 100% compatible!**

---

### Step 3: Test Locally

```bash
# Start your site's dev server
hugo server  # or jekyll serve, or npm run dev

# Visit admin
open http://localhost:1313/admin/  # (or your port)
```

**Test these workflows**:
- ✅ Login (should work with existing OAuth)
- ✅ View content list
- ✅ Edit existing entry
- ✅ Create new entry
- ✅ Upload image
- ✅ Save and publish

---

### Step 4: Deploy

```bash
git add static/admin/index.html  # or your admin path
git commit -m "Migrate to Sveltia CMS from Decap CMS"
git push
```

**That's it!** Your site rebuilds with Sveltia CMS.

---

## What Changes?

### UI Changes (Better UX)

- **Performance**: Instant content loading (GraphQL)
- **Search**: Full-text search across all content
- **Mobile**: Better mobile and tablet experience
- **Dark Mode**: Automatic dark mode support
- **Image Optimization**: Built-in WebP conversion

### What Stays the Same

- **Content**: All your Markdown/JSON/YAML files unchanged
- **Collections**: Same collection definitions
- **Fields**: Same field widgets and validation
- **Workflows**: Same editorial workflow
- **Media**: Same media folder and uploads

---

## What's Not Supported?

Sveltia CMS deliberately omits these Decap features for performance:

- ❌ **Git Gateway backend** (use OAuth proxy instead)
- ❌ **Azure backend** (may be added later)
- ❌ **Bitbucket backend** (may be added later)

**If you use Git Gateway**, switch to **Cloudflare Workers OAuth** (faster, more reliable):
- See: `templates/cloudflare-workers/setup-guide.md`
- Takes 10 minutes to set up
- Free tier: 100k requests/day

---

## Testing Checklist

Before fully migrating, verify these work:

- [ ] Login with OAuth
- [ ] View all collections
- [ ] Edit existing content
- [ ] Create new content
- [ ] Upload images
- [ ] Publish/unpublish works
- [ ] Search functionality
- [ ] Mobile editing (if applicable)
- [ ] i18n switching (if applicable)

---

## Rollback Plan

If you need to rollback:

1. **Revert script tag** to Decap CMS:
   ```html
   <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
   ```

2. **Commit and push**:
   ```bash
   git add static/admin/index.html
   git commit -m "Rollback to Decap CMS"
   git push
   ```

**Your content and config are unchanged** - you can switch back and forth freely!

---

## Common Migration Issues

### Issue: "SVELTIA is not defined"

**Cause**: Missing `type="module"` attribute

**Fix**:
```html
<!-- Correct -->
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>

<!-- Wrong - missing type="module" -->
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
```

---

### Issue: OAuth Not Working

**Cause**: Using Git Gateway (not supported)

**Fix**: Switch to Cloudflare Workers OAuth:
1. Deploy OAuth Worker (5 min)
2. Update config.yml with `base_url`
3. Test authentication

See: `templates/cloudflare-workers/setup-guide.md`

---

### Issue: TOML Files Not Loading

**Cause**: Sveltia's TOML support is buggy in beta

**Fix**: Use YAML instead:
```yaml
collections:
  - name: posts
    folder: content/posts
    format: yaml  # Change from: toml
```

Or wait for TOML fixes in future releases.

---

## Performance Comparison

| Metric | Decap CMS | Sveltia CMS | Improvement |
|--------|-----------|-------------|-------------|
| **Bundle Size** | 1.5 MB | 300 KB | **5x smaller** |
| **Initial Load** | 2-3 sec | 0.5-1 sec | **3x faster** |
| **Content Listing** | Sequential API calls | Single GraphQL query | **10x faster** |
| **Search** | Client-side only | Full-text | **Much better** |
| **Mobile UX** | Poor | Good | **Significantly improved** |

---

## Support & Help

**Issues after migration?**
- GitHub: https://github.com/sveltia/sveltia-cms/issues
- Discussions: https://github.com/sveltia/sveltia-cms/discussions

**Questions about Decap compatibility?**
- Sveltia maintainer is very responsive
- Most Decap configs work without changes

---

**Migration Time**: 5-10 minutes
**Risk Level**: Very Low (config unchanged, easy rollback)
**Recommended**: Yes (significant improvements)

---

**Last Updated**: 2025-10-24
