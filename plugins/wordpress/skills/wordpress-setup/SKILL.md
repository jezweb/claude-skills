---
name: wordpress-setup
description: >
  Connect to a WordPress site via WP-CLI over SSH or REST API.
  Workflow: check CLI, test SSH connection, set up auth, verify access, save config.
  Use when connecting to a WordPress site, setting up WP-CLI access, creating
  application passwords, or troubleshooting WordPress connection issues.
compatibility: Designed for Claude Code (or similar products)
---

# WordPress Setup

Connect to a WordPress site and verify working access via WP-CLI or REST API. Produces a verified connection config ready for content management and Elementor editing.

## Workflow

### Step 1: Check WP-CLI

```bash
wp --version
```

If not installed, guide the user:

```bash
# macOS/Linux
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp
```

Also ensure the SSH extension is available (needed for remote sites):

```bash
wp package install wp-cli/ssh-command
```

### Step 2: Connect to the Site

**Option A: WP-CLI over SSH (preferred)**

```bash
wp --ssh=user@hostname/path/to/wordpress option get siteurl
```

Common patterns:
- Rocket.net: `wp --ssh=user@hostname/www/sitename/public option get siteurl`
- cPanel: `wp --ssh=user@hostname/public_html option get siteurl`
- Custom: Ask user for SSH user, host, and WordPress path

Test with a simple command first:

```bash
wp --ssh=user@host/path core version
```

**Option B: REST API with Application Password**

If SSH isn't available:

1. Navigate to `https://example.com/wp-admin/profile.php` (or use browser automation)
2. Scroll to "Application Passwords" section
3. Enter a name (e.g. "Claude Code") and click "Add New Application Password"
4. Copy the generated password (spaces are part of it but optional in auth)

Test the connection:

```bash
curl -s https://example.com/wp-json/wp/v2/posts?per_page=1 \
  -u "username:xxxx xxxx xxxx xxxx xxxx xxxx" | jq '.[0].title'
```

### Step 3: Store Credentials

**For WP-CLI SSH** — create a `wp-cli.yml` in the project root:

```yaml
ssh:
  sitename:
    cmd: ssh -o StrictHostKeyChecking=no %pseudotty% user@hostname %cmd%
    url: /path/to/wordpress
```

Then use: `wp @sitename option get siteurl`

**For REST API** — store in `.dev.vars`:

```
WP_SITE_URL=https://example.com
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

Ensure `.dev.vars` is in `.gitignore`. For cross-project use, store in your preferred secrets manager (environment variable, 1Password CLI, etc.).

### Step 4: Verify Full Access

Run a comprehensive check:

```bash
# Site info
wp @sitename option get siteurl
wp @sitename option get blogname

# Content access
wp @sitename post list --post_type=page --posts_per_page=5 --fields=ID,post_title,post_status

# Plugin status (check for Elementor)
wp @sitename plugin status elementor

# Theme info
wp @sitename theme status
```

### Step 5: Save Site Config

Create `wordpress.config.json` for other skills to reference:

```json
{
  "site": "example.com",
  "siteUrl": "https://example.com",
  "accessMethod": "ssh",
  "sshAlias": "sitename",
  "wpPath": "/path/to/wordpress",
  "hasElementor": true,
  "elementorVersion": "3.x.x"
}
```

---

## Critical Patterns

### SSH Connection Issues

| Symptom | Fix |
|---------|-----|
| `Permission denied (publickey)` | Check SSH key: `ssh -v user@host` |
| `wp: command not found` via SSH | WP-CLI not in remote PATH — use full path: `/usr/local/bin/wp` |
| `Error: This does not appear to be a WordPress installation` | Wrong path — check `wp-path` argument |
| Timeout on large operations | Add `--ssh=user@host/path --allow-root` or increase SSH timeout |

### WP-CLI Aliases

Define aliases in `~/.wp-cli/config.yml` for frequently-accessed sites:

```yaml
@client1:
  ssh: user@client1.example.com/www/public
@client2:
  ssh: user@client2.rocketcdn.me/www/client2/public
```

Then: `wp @client1 post list`

### REST API Gotchas

- Application passwords require HTTPS (won't work on HTTP)
- Some security plugins block REST API — check for 401/403 responses
- Caching plugins may serve stale REST responses — use `?_=${timestamp}` cache buster
- Custom post types need `show_in_rest: true` to appear in API

---

## Reference Files

- `references/wp-cli-essentials.md` — SSH alias patterns, common flags, and troubleshooting
