---
name: gws-setup
description: >
  Set up the Google Workspace CLI (gws) from scratch. Guides through GCP project creation,
  OAuth credentials, authentication, and installing 90+ agent skills for Claude Code.
  Use when setting up gws for the first time, configuring Google Workspace API access,
  or troubleshooting gws auth issues. Triggers: "set up gws", "google workspace cli",
  "gws setup", "install gws".
compatibility: Designed for Claude Code (or similar products)
---

# Google Workspace CLI — First-Time Setup

Set up the `gws` CLI (@googleworkspace/cli) with OAuth credentials and 90+ agent skills for Claude Code. Produces a fully authenticated CLI with skills for Gmail, Drive, Calendar, Sheets, Docs, Chat, Tasks, and more.

## Prerequisites

- Node.js 18+
- A Google account (personal or Workspace)
- Access to Google Cloud Console (console.cloud.google.com)

## Workflow

### Step 1: Pre-flight Checks

Check what's already done and skip completed steps:

```bash
# Check if gws is installed
which gws && gws --version

# Check if client_secret.json exists
ls ~/.config/gws/client_secret.json

# Check if already authenticated
gws auth status
```

If `gws auth status` shows `"status": "success"` with scopes, skip to Step 6 (Install Skills).

### Step 2: Install the CLI

```bash
npm install -g @googleworkspace/cli
gws --version
```

### Step 3: Create a GCP Project and OAuth Credentials

The user needs to create OAuth Desktop App credentials in Google Cloud Console. Walk them through each step.

**3a. Create or select a GCP project:**

Direct the user to: `https://console.cloud.google.com/projectcreate`

Or use an existing project. Ask the user which they prefer.

**3b. Enable Google Workspace APIs:**

Direct the user to the API Library for their project: `https://console.cloud.google.com/apis/library?project=PROJECT_ID`

Enable these APIs (search for each):
- Gmail API
- Google Drive API
- Google Calendar API
- Google Sheets API
- Google Docs API
- Google Chat API (requires extra Chat App config — see below)
- Tasks API
- People API
- Google Slides API
- Google Forms API
- Admin SDK API (optional — for Workspace admin features)

**3c. Configure Google Chat App (required for Chat API):**

Enabling the Chat API alone isn't enough — Google requires a Chat App configuration even for user-context OAuth access. Without this, all Chat API calls return errors.

Direct the user to: `https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=PROJECT_ID`

1. Click the **Configuration** tab
2. Fill in app details (name, avatar, description — values don't matter for CLI use)
3. Under "Functionality", check **Spaces and group conversations**
4. Under "Connection settings", select **Apps Script** or **HTTP endpoint** (pick any — we just need the config to exist)
5. Save

This creates the app identity that the Chat API requires. Messages sent via `gws` still appear as coming from the authenticated user (OAuth user context), not from a bot.

**3e. Configure OAuth consent screen:**

Direct the user to: `https://console.cloud.google.com/apis/credentials/consent?project=PROJECT_ID`

Settings:
- User Type: **External** (works for any Google account)
- App name: `gws CLI` (or any name)
- User support email: their email
- Developer contact: their email
- Leave scopes blank (gws requests scopes at login time)
- Add their Google account as a test user (required while app is in "Testing" status)
- Save and continue through all screens

**3f. Create OAuth client ID:**

Direct the user to: `https://console.cloud.google.com/apis/credentials?project=PROJECT_ID`

1. Click **Create Credentials** → **OAuth client ID**
2. Application type: **Desktop app**
3. Name: `gws CLI`
4. Click **Create**
5. Copy the JSON or download the `client_secret_*.json` file

**3g. Save the credentials:**

Ask the user to provide the client_secret.json content (paste the JSON or provide the downloaded file path).

```bash
mkdir -p ~/.config/gws
```

Write the JSON to `~/.config/gws/client_secret.json`. The expected format:

```json
{
  "installed": {
    "client_id": "...",
    "project_id": "...",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "client_secret": "...",
    "redirect_uris": ["http://localhost"]
  }
}
```

### Step 4: Choose Scopes

Ask the user what level of access they want:

| Option | Command | What it grants |
|--------|---------|----------------|
| **Full access** (recommended) | `gws auth login --full` | All Workspace scopes including admin, pubsub, cloud-platform |
| **Core services** | `gws auth login -s gmail,drive,calendar,sheets,docs,chat,tasks` | Most-used services only |
| **Minimal** | `gws auth login -s gmail,calendar` | Just email and calendar |

Recommend **full access** for power users. The OAuth consent screen shows all requested scopes so the user can review before granting.

> **Note**: If the GCP app is in "Testing" status, scope selection is limited to ~25 scopes. Use `-s service1,service2` to request targeted scopes, or publish the app (Publish → In Production) for broader scope access.

### Step 5: Authenticate

**IMPORTANT**: This step prints a very long OAuth URL (30+ scopes) that the user must open in their browser. The URL is too long to copy from terminal output — it wraps across lines and breaks. Always extract it to a file and open it programmatically.

1. Run the login command and capture the output:

```bash
gws auth login --full 2>&1 | tee /tmp/gws-auth-output.txt
# Or with specific services:
# gws auth login -s gmail,drive,calendar,sheets,docs,chat,tasks 2>&1 | tee /tmp/gws-auth-output.txt
```

Running as a background task is fine — it will complete once the user approves in browser.

2. Extract and open the URL (run separately after output appears):

```bash
grep -o 'https://accounts.google.com[^ ]*' /tmp/gws-auth-output.txt > /tmp/gws-auth-url.txt
cat /tmp/gws-auth-url.txt | xargs open
```

If `open` doesn't work, tell the user: "The auth URL is saved at `/tmp/gws-auth-url.txt` — open that file and copy the URL."

3. Wait for the user to approve in their browser.

After browser approval, gws stores encrypted credentials at `~/.config/gws/credentials.enc`.

Verify:

```bash
gws auth status
```

Should show `"status": "success"` with the authenticated account and granted scopes.

### Step 6: Install Agent Skills

Install the 90+ gws agent skills globally for Claude Code:

```bash
npx skills add googleworkspace/cli -g --agent claude-code --all
```

Verify skills are installed:

```bash
ls ~/.claude/skills/gws-* | wc -l
```

Should show 30+ gws skill directories.

### Step 7: Save Credentials for Other Machines

If the user has other machines to set up, suggest exporting the client credentials:

```bash
gws auth export
```

This prints decrypted credentials (including refresh token) to stdout. The `client_secret.json` file is the portable part — the same OAuth client can be used on any machine, with `gws auth login` generating fresh user tokens per machine.

Tell the user to save the `client_secret.json` content somewhere secure (password manager, encrypted note) for use with the `gws-install` skill on other machines.

### Step 8: Verify Everything Works

Run a few commands to confirm:

```bash
# Check auth
gws auth status

# Check calendar
gws calendar +agenda --today

# Check email
gws gmail +triage
```

If any command fails with auth errors, re-run `gws auth login` with the needed scopes.

---

## Critical Patterns

### Testing vs Production OAuth Apps

GCP OAuth apps start in "Testing" status with a 7-day token expiry and ~25 scope limit. For long-term use:
- Push the app to **Production** in the OAuth consent screen settings
- Production apps have no token expiry limit
- For personal/internal use, Google does not require verification

### Scope Reference

| Service flag | What it enables |
|-------------|-----------------|
| `gmail` | Send, read, manage email, labels, filters |
| `drive` | Files, folders, shared drives |
| `calendar` | Events, calendars, free/busy |
| `sheets` | Read and write spreadsheets |
| `docs` | Read and write documents |
| `chat` | Spaces, messages |
| `tasks` | Task lists and tasks |
| `slides` | Presentations |
| `forms` | Forms and responses |
| `people` | Contacts and profiles |
| `admin` | Workspace admin (directory, devices, groups) |

### Environment Variable Alternative

Instead of `client_secret.json`, credentials can be provided via environment variables:

```bash
export GOOGLE_WORKSPACE_CLI_CLIENT_ID="your-client-id"
export GOOGLE_WORKSPACE_CLI_CLIENT_SECRET="your-client-secret"
gws auth login
```

### Config Directory

All gws config lives in `~/.config/gws/`:

| File | Purpose |
|------|---------|
| `client_secret.json` | OAuth client credentials (portable) |
| `credentials.enc` | Encrypted user tokens (per-machine) |
| `token_cache.json` | Token refresh cache |
| `cache/` | API discovery schema cache |

## See Also

- [gws-install](../gws-install/SKILL.md) — Quick setup on additional machines with existing credentials
- [gws-shared](~/.claude/skills/gws-shared/SKILL.md) — Auth patterns and global flags for gws commands
