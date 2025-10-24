# Cloudflare Workers OAuth Proxy Setup

Complete guide to deploying Sveltia CMS authentication using Cloudflare Workers.

---

## Overview

This OAuth proxy enables Sveltia CMS to authenticate with GitHub or GitLab without requiring a backend server. The Worker handles the OAuth flow securely.

**Official Repository**: https://github.com/sveltia/sveltia-cms-auth

---

## Prerequisites

- Cloudflare account (free tier works)
- GitHub or GitLab account
- Wrangler CLI installed (`npm install -g wrangler`)
- Git repository with Sveltia CMS

---

## Step 1: Deploy the Worker

### Option A: Use Official Repository (Recommended)

```bash
# Clone the official auth worker
git clone https://github.com/sveltia/sveltia-cms-auth
cd sveltia-cms-auth

# Install dependencies
npm install

# Login to Cloudflare (if not already logged in)
npx wrangler login

# Deploy to Workers
npx wrangler deploy
```

**Output**:
```
 ⛅️ wrangler 3.x.x
-------------------
Uploaded sveltia-cms-auth (x.x KiB)
Published sveltia-cms-auth (x.xx sec)
  https://sveltia-cms-auth.<your-subdomain>.workers.dev
```

**Save this URL** - you'll need it later!

---

### Option B: One-Click Deploy

1. Visit https://github.com/sveltia/sveltia-cms-auth
2. Click the "Deploy to Cloudflare Workers" button
3. Follow the deployment wizard
4. Note the deployed Worker URL

---

### Option C: Use This Template

If you want to customize the Worker:

1. Copy template to your project:
   ```bash
   mkdir -p workers/sveltia-auth
   cp templates/cloudflare-workers/* workers/sveltia-auth/
   ```

2. Update `wrangler.jsonc` with your account ID

3. Deploy:
   ```bash
   cd workers/sveltia-auth
   npx wrangler deploy
   ```

---

## Step 2: Register OAuth App on GitHub

1. **Go to GitHub Settings:**
   https://github.com/settings/developers

2. **Click "New OAuth App"**

3. **Fill in details:**
   - **Application name**: `Your Site CMS` (or any name)
   - **Homepage URL**: `https://yourdomain.com` (your actual site)
   - **Authorization callback URL**: `https://sveltia-cms-auth.<your-subdomain>.workers.dev/callback`
     - ⚠️ **Critical**: This must be the Worker URL + `/callback`
     - ❌ **NOT**: `https://yourdomain.com/callback`
     - ✅ **Example**: `https://sveltia-cms-auth.my-account.workers.dev/callback`

4. **Click "Register application"**

5. **Save these values:**
   - **Client ID**: `Ov23li...` (visible immediately)
   - **Client Secret**: Click "Generate a new client secret" and copy it (shown once!)

---

## Step 3: Configure Worker Environment Variables

Set the secrets using Wrangler CLI:

```bash
cd sveltia-cms-auth  # or your Worker directory

# Set GitHub Client ID
npx wrangler secret put GITHUB_CLIENT_ID
# Paste your Client ID when prompted

# Set GitHub Client Secret
npx wrangler secret put GITHUB_CLIENT_SECRET
# Paste your Client Secret when prompted
```

**Optional**: Restrict to specific domains:

```bash
npx wrangler secret put ALLOWED_DOMAINS
# Enter domains when prompted, e.g.: yourdomain.com,*.yourdomain.com
```

**Wildcards**:
- `yourdomain.com` - Exact match only
- `*.yourdomain.com` - All subdomains (www.yourdomain.com, blog.yourdomain.com)
- `yourdomain.com,*.yourdomain.com` - Both root and subdomains

---

## Step 4: Update Sveltia CMS Config

Add the `base_url` to your CMS configuration:

```yaml
# static/admin/config.yml (Hugo)
# or admin/config.yml (Jekyll/11ty)
# or public/admin/config.yml (Astro/Next.js)

backend:
  name: github
  repo: owner/repo  # Your GitHub repository
  branch: main      # Your default branch
  base_url: https://sveltia-cms-auth.<your-subdomain>.workers.dev  # ← Add this line
```

**Example**:
```yaml
backend:
  name: github
  repo: jezweb/my-blog
  branch: main
  base_url: https://sveltia-cms-auth.my-account.workers.dev
```

---

## Step 5: Test Authentication

1. **Start your local dev server:**
   ```bash
   hugo server  # or jekyll serve, or npm run dev
   ```

2. **Open admin in browser:**
   ```
   http://localhost:1313/admin/  # Hugo
   http://localhost:4000/admin/  # Jekyll
   http://localhost:8080/admin/  # 11ty
   http://localhost:4321/admin/  # Astro
   ```

3. **Click "Login with GitHub"**

4. **Authorize the app** when GitHub asks

5. **You should be redirected back** to the CMS with content loaded

---

## Step 6: Deploy Your Site

1. **Commit changes:**
   ```bash
   git add static/admin/config.yml  # or your admin path
   git commit -m "Add Cloudflare Workers OAuth for Sveltia CMS"
   git push
   ```

2. **Deploy to your hosting:**
   - Cloudflare Pages: Automatic on push
   - Vercel: Automatic on push
   - Netlify: Automatic on push
   - GitHub Pages: GitHub Actions workflow

3. **Test on production:**
   ```
   https://yourdomain.com/admin/
   ```

---

## GitLab Setup (Alternative)

If using GitLab instead of GitHub:

### 1. Create GitLab Application

1. Go to https://gitlab.com/-/profile/applications
2. Click "Add new application"
3. Fill in:
   - **Name**: `Your Site CMS`
   - **Redirect URI**: `https://sveltia-cms-auth.<your-subdomain>.workers.dev/callback`
   - **Scopes**: Check `api` and `write_repository`
4. Click "Save application"
5. Copy Application ID and Secret

### 2. Set Worker Secrets

```bash
npx wrangler secret put GITLAB_APPLICATION_ID
# Paste Application ID

npx wrangler secret put GITLAB_SECRET
# Paste Secret
```

### 3. Update CMS Config

```yaml
backend:
  name: gitlab
  repo: group/project
  branch: main
  base_url: https://sveltia-cms-auth.<your-subdomain>.workers.dev
```

---

## Troubleshooting

### Authentication Fails

**Problem**: "Error: Failed to authenticate"

**Solutions**:
1. Check callback URL matches exactly (Worker URL + `/callback`)
2. Verify secrets are set: `npx wrangler secret list`
3. Test Worker directly: `curl https://your-worker.workers.dev/health`
4. Check browser console for CORS errors

---

### Redirect to Wrong Domain

**Problem**: Redirects to `api.netlify.com/auth`

**Solutions**:
1. Ensure `base_url` is in config.yml
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache

---

### CORS Errors

**Problem**: "Cross-Origin-Opener-Policy blocked"

**Solutions**:
1. Add COOP header to site (see SKILL.md Error #8)
2. Set `Cross-Origin-Opener-Policy: same-origin-allow-popups`
3. For Cloudflare Pages, add `_headers` file:
   ```
   /*
     Cross-Origin-Opener-Policy: same-origin-allow-popups
   ```

---

### Worker Not Found (404)

**Problem**: Worker URL returns 404

**Solutions**:
1. Verify deployment: `npx wrangler deployments list`
2. Check Worker name in `wrangler.jsonc`
3. Wait 1-2 minutes after deployment (DNS propagation)

---

## Security Best Practices

1. **Never commit secrets** - Use `npx wrangler secret put`
2. **Restrict domains** - Set `ALLOWED_DOMAINS` for production
3. **Use HTTPS only** - Sveltia CMS requires secure context
4. **Rotate secrets periodically** - Update GitHub OAuth secrets every 6-12 months
5. **Monitor access logs** - Check Cloudflare Workers dashboard for unusual activity

---

## Custom Domain (Optional)

To use a custom domain for your OAuth Worker:

1. **Add Worker route in Cloudflare:**
   - Dashboard > Workers > Your Worker > Triggers
   - Add custom domain: `auth.yourdomain.com`

2. **Update GitHub OAuth callback:**
   - Change to: `https://auth.yourdomain.com/callback`

3. **Update CMS config:**
   ```yaml
   backend:
     base_url: https://auth.yourdomain.com
   ```

---

## Cost

**Cloudflare Workers Free Tier**:
- 100,000 requests/day
- 10ms CPU time per request
- More than enough for CMS authentication

**Typical usage**: 50-100 requests/month for small teams

---

## Additional Resources

- **Official Auth Worker**: https://github.com/sveltia/sveltia-cms-auth
- **Sveltia CMS Docs**: https://github.com/sveltia/sveltia-cms
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **OAuth 2.0 Spec**: https://oauth.net/2/

---

**Last Updated**: 2025-10-24
