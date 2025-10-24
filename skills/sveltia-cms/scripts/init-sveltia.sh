#!/usr/bin/env bash

# Sveltia CMS Initialization Script
# Automates setup for Hugo, Jekyll, or 11ty projects

set -e

echo "🚀 Sveltia CMS Setup"
echo "===================="
echo ""

# Detect framework
detect_framework() {
  if [ -f "config.toml" ] || [ -f "config.yaml" ] || [ -f "hugo.toml" ]; then
    echo "hugo"
  elif [ -f "_config.yml" ] || [ -f "Gemfile" ]; then
    echo "jekyll"
  elif [ -f ".eleventy.js" ] || [ -f "eleventy.config.js" ]; then
    echo "11ty"
  elif [ -f "astro.config.mjs" ]; then
    echo "astro"
  else
    echo "unknown"
  fi
}

FRAMEWORK=$(detect_framework)

echo "📦 Detected framework: $FRAMEWORK"
echo ""

# Set admin directory based on framework
case $FRAMEWORK in
  hugo)
    ADMIN_DIR="static/admin"
    ;;
  jekyll)
    ADMIN_DIR="admin"
    ;;
  11ty)
    ADMIN_DIR="admin"
    ;;
  astro)
    ADMIN_DIR="public/admin"
    ;;
  *)
    read -p "❓ Admin directory path (e.g., static/admin): " ADMIN_DIR
    ;;
esac

echo "📁 Creating admin directory: $ADMIN_DIR"
mkdir -p "$ADMIN_DIR"

# Create index.html
echo "📄 Creating index.html..."
cat > "$ADMIN_DIR/index.html" << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Content Manager</title>
  </head>
  <body>
    <!-- Sveltia CMS -->
    <script src="https://unpkg.com/@sveltia/cms@0.113.3/dist/sveltia-cms.js" type="module"></script>
  </body>
</html>
EOF

# Get repository info
echo ""
read -p "📝 GitHub repository (e.g., owner/repo): " REPO
read -p "🌿 Default branch (default: main): " BRANCH
BRANCH=${BRANCH:-main}

# Create config.yml
echo "⚙️  Creating config.yml..."
cat > "$ADMIN_DIR/config.yml" << EOF
backend:
  name: github
  repo: $REPO
  branch: $BRANCH
  # base_url: https://your-worker.workers.dev  # Add your OAuth proxy URL

# Media storage
media_folder: static/images/uploads  # Adjust for your framework
public_folder: /images/uploads

# Optional: Image optimization
media_libraries:
  default:
    config:
      max_file_size: 5242880  # 5 MB
      slugify_filename: true
      transformations:
        raster_image:
          format: webp
          quality: 85
          width: 2048
          height: 2048

# Collections
collections:
  - name: posts
    label: Blog Posts
    folder: content/posts  # Adjust for your framework
    create: true
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
    format: yaml
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Date, name: date, widget: datetime }
      - { label: Draft, name: draft, widget: boolean, default: true }
      - { label: Body, name: body, widget: markdown }
EOF

echo ""
echo "✅ Sveltia CMS setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review and customize: $ADMIN_DIR/config.yml"
echo "   2. Set up OAuth (see: templates/cloudflare-workers/setup-guide.md)"
echo "   3. Start your dev server and visit /admin/"
echo ""

if [ "$FRAMEWORK" = "jekyll" ]; then
  echo "⚠️  Jekyll users: Add to _config.yml:"
  echo "   include:"
  echo "     - admin"
  echo ""
fi

if [ "$FRAMEWORK" = "11ty" ]; then
  echo "⚠️  11ty users: Add to .eleventy.js:"
  echo "   eleventyConfig.addPassthroughCopy('admin');"
  echo ""
fi
