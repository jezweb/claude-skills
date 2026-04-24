---
name: nemoclaw-setup
description: >
  Install and configure NVIDIA NemoClaw (sandboxed OpenClaw agent platform) on Linux.
  Handles cloudflared tunnels, Docker cgroup fixes, OpenShell, sandbox creation,
  remote access via Cloudflare Tunnel, and known bug workarounds.
  Triggers: "install nemoclaw", "setup nemoclaw", "nvidia nemoclaw", "openclaw setup",
  "nemoclaw on spark", "nemoclaw on dgx".
compatibility: Designed for Claude Code (or similar products)
---

# NemoClaw Setup

Install NVIDIA NemoClaw — a sandboxed AI agent platform built on OpenClaw with Landlock + seccomp + network namespace isolation. Runs inside Docker via k3s (OpenShell).

## What You Get

- Sandboxed AI agent with web UI and terminal CLI
- Powered by NVIDIA Nemotron models (cloud or local)
- Network-policy-controlled access to external services
- Optional remote access via Cloudflare Tunnel

## Prerequisites

| Requirement | Check | Install |
|-------------|-------|---------|
| Linux (Ubuntu 22.04+) | `uname -a` | — |
| Docker | `docker ps` | `sudo apt install docker.io` |
| Node.js 20+ (22 recommended) | `node --version` | `nvm install 22` |
| NVIDIA GPU (optional but recommended) | `nvidia-smi` | — |
| NVIDIA API key | — | https://build.nvidia.com/settings/api-keys |

## Workflow

### Step 1: Pre-flight Checks

```bash
# Check Docker
docker ps 2>/dev/null || echo "Docker not running or no access"

# Check Node.js
node --version

# Check if already installed
which nemoclaw && nemoclaw --version
which openshell && openshell --version
```

If `nemoclaw` is already installed, skip to Step 4.

### Step 2: Install NemoClaw

```bash
curl -fsSL https://nvidia.com/nemoclaw.sh | bash
```

This installs NemoClaw and OpenClaw via npm globally (to `~/.npm-global/bin/`).

**If the installer can't find Node.js**, install it first:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 3: Install OpenShell

```bash
curl -LsSf https://raw.githubusercontent.com/NVIDIA/OpenShell/main/install.sh | sh
```

Installs to `~/.local/bin/openshell`.

### Step 4: Fix Docker Permissions and cgroup

**Docker group** — the user must be in the `docker` group:
```bash
sudo usermod -aG docker $USER
newgrp docker
# or log out and back in
```

**cgroup v2 fix** — required for k3s inside Docker:
```bash
# Check if needed
grep cgroup2 /proc/filesystems && echo "cgroup v2 detected — fix needed"

# Apply fix (needs sudo)
sudo $HOME/.npm-global/bin/nemoclaw setup-spark
```

This adds `"default-cgroupns-mode": "host"` to `/etc/docker/daemon.json` and restarts Docker.

**IMPORTANT**: The `nemoclaw setup-spark` command also asks for an NVIDIA API key. Have it ready (starts with `nvapi-`). Get one at https://build.nvidia.com/settings/api-keys.

### Step 5: Run Onboarding

```bash
PATH=$HOME/.npm-global/bin:$HOME/.local/bin:$PATH nemoclaw onboard
```

The interactive wizard will:
1. Check Docker and OpenShell
2. Start the OpenShell gateway (k3s in Docker)
3. Ask for a sandbox name — use `claw` or any name
4. Configure the NVIDIA API key
5. Set up inference (Nemotron 3 Super 120B via cloud API)
6. Launch OpenClaw inside the sandbox
7. Apply network policy presets — select the ones you need

**Common port conflict**: If port 8080 is in use, find and kill the process:
```bash
fuser -k 8080/tcp
```

### Step 6: Verify

```bash
# Check sandbox is running
PATH=$HOME/.npm-global/bin:$HOME/.local/bin:$PATH nemoclaw claw status

# Connect via terminal
PATH=$HOME/.npm-global/bin:$HOME/.local/bin:$PATH nemoclaw claw connect
```

### Step 7: Set Up Web UI Access

The web UI runs inside the sandbox and needs a port forward:

```bash
PATH=$HOME/.npm-global/bin:$HOME/.local/bin:$PATH openshell forward start 18789 claw
```

Then open: `http://127.0.0.1:18789/`

**Known bug (OpenClaw ≤ v2026.3.11)**: "device identity required" error. Workaround — append the gateway token to the URL:

```bash
# Get the token
ssh -F /tmp/nemoclaw-ssh-config openshell-claw \
  "python3 -c \"import json; print(json.load(open('/sandbox/.openclaw/openclaw.json'))['gateway']['auth']['token'])\""
```

Then visit: `http://127.0.0.1:18789/#token=<gateway-token>`

**Fix**: Update to OpenClaw v2026.3.12+ (see Updating section below).

### Step 8: Make the Port Forward Persistent

Create a health-checked keepalive script:

```bash
cat > ~/.local/bin/nemoclaw-keepalive.sh << 'KEEPALIVE'
#!/bin/bash
export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"
cleanup() { kill %1 2>/dev/null; exit 0; }
trap cleanup SIGTERM SIGINT
while true; do
    fuser -k 18789/tcp 2>/dev/null; sleep 1
    openshell forward start 18789 claw &
    FORWARD_PID=$!; sleep 3
    while kill -0 $FORWARD_PID 2>/dev/null; do
        if ! curl -sf -o /dev/null --connect-timeout 3 http://127.0.0.1:18789/ 2>/dev/null; then
            echo "$(date): Health check failed, restarting..."
            kill $FORWARD_PID 2>/dev/null; wait $FORWARD_PID 2>/dev/null; break
        fi
        sleep 10
    done
    echo "$(date): Forward died, restarting in 3s..."; sleep 3
done
KEEPALIVE
chmod +x ~/.local/bin/nemoclaw-keepalive.sh
```

Create the systemd service:

```bash
sudo tee /etc/systemd/system/nemoclaw-forward.service << 'SERVICE'
[Unit]
Description=NemoClaw Port Forward with Health Check
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
Group=docker
Environment=PATH=/home/$USER/.npm-global/bin:/home/$USER/.local/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/$USER/.local/bin/nemoclaw-keepalive.sh
Restart=always
RestartSec=5
KillMode=control-group

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable nemoclaw-forward
sudo systemctl start nemoclaw-forward
```

### Step 9: Remote Access via Cloudflare Tunnel (Optional)

If you have a Cloudflare Tunnel already running, add NemoClaw to it.

**Add DNS route:**
```bash
cloudflared tunnel route dns <tunnel-name> nemoclaw.<domain>
```

**Update tunnel config** (`/etc/cloudflared/config.yml`):
```yaml
  - hostname: nemoclaw.<domain>
    service: http://localhost:18789
    originRequest:
      httpHostHeader: "127.0.0.1:18789"
```

**Restart tunnel:**
```bash
sudo systemctl restart cloudflared
```

**Update sandbox allowed origins** — SSH into the sandbox and add your domain:

```bash
openshell sandbox ssh-config claw > /tmp/nemoclaw-ssh-config

ssh -F /tmp/nemoclaw-ssh-config openshell-claw 'python3 -c "
import json
with open(\"/sandbox/.openclaw/openclaw.json\") as f:
    config = json.load(f)
config[\"gateway\"][\"controlUi\"][\"allowedOrigins\"].append(\"https://nemoclaw.<domain>\")
config[\"gateway\"][\"trustedProxies\"] = [\"127.0.0.1\", \"::1\", \"172.0.0.0/8\", \"10.0.0.0/8\"]
config[\"gateway\"][\"allowRealIpFallback\"] = True
with open(\"/sandbox/.openclaw/openclaw.json\", \"w\") as f:
    json.dump(config, f, indent=2)
print(\"Done. Token:\", config[\"gateway\"][\"auth\"][\"token\"])
"'
```

**Protect with Cloudflare Access** — add the hostname to your Access application in the Zero Trust dashboard.

**Access URL**: `https://nemoclaw.<domain>/#token=<gateway-token>`

### Step 10: Install Custom Skills

Skills are markdown files in `/sandbox/.openclaw/skills/<name>/SKILL.md`. SSH into the sandbox to create them:

```bash
ssh -F /tmp/nemoclaw-ssh-config openshell-claw
mkdir -p /sandbox/.openclaw/skills/my-skill
cat > /sandbox/.openclaw/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What this skill does.
tools: [exec, read, write]
---
# My Skill
Instructions for the agent...
EOF
```

Verify with: `openclaw skills list`

### Step 11: Configure the Workspace

Update the workspace files so the agent knows who you are:

- `/sandbox/.openclaw/workspace/USER.md` — your profile, preferences
- `/sandbox/.openclaw/workspace/TOOLS.md` — available tools and access
- `/sandbox/.openclaw/workspace/SOUL.md` — agent personality and behaviour

## Updating OpenClaw

The sandbox bundles OpenClaw at install time. To update:

```bash
# 1. Update host-side packages
npm install -g openclaw@latest

# 2. Destroy and recreate sandbox
nemoclaw claw destroy
nemoclaw onboard

# 3. Reconfigure remote access (Step 9) and skills (Step 10)
```

**Note**: Sandbox network policies block npm/PyPI inside the sandbox. Updates must be done by rebuilding.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Docker is not running` | Docker service stopped or user not in docker group | `sudo systemctl start docker` then `newgrp docker` |
| `cgroup v2 detected` | Docker not configured for cgroupns=host | `sudo nemoclaw setup-spark` |
| Port 8080 in use | Another service on that port | `fuser -k 8080/tcp` |
| `nemoclaw: command not found` | Not in PATH | `PATH=$HOME/.npm-global/bin:$HOME/.local/bin:$PATH` |
| `device identity required` | Bug in OpenClaw ≤ v2026.3.11 | Append `#token=<gateway-token>` to URL, or update to v2026.3.12+ |
| `gateway token mismatch` | Token changed after sandbox rebuild | Get new token from sandbox config |
| `too many failed auth attempts` | Rate limited from old token attempts | Restart gateway: `ssh -F /tmp/nemoclaw-ssh-config openshell-claw 'pkill -f "openclaw gateway"; sleep 2; openclaw gateway &'` |
| `origin not allowed` | Domain not in allowedOrigins | Add to `gateway.controlUi.allowedOrigins` in sandbox config |
| Port 18789 not responding | SSH tunnel died | `sudo systemctl restart nemoclaw-forward` (auto-recovers within 13s) |
| npm 403 Forbidden inside sandbox | Network policy blocking TLS | Cannot install packages inside sandbox — rebuild instead |
| `Tunnel not found` on DNS route | Wrong Cloudflare account/cert | Check `cloudflared tunnel list` matches your cert |
| Error 502 on Cloudflare | Tunnel connections dropped | `sudo systemctl restart cloudflared` |
| Assets 404 via Cloudflare | Browser not authenticated for sub-requests | Hard refresh (Ctrl+Shift+R) after Cloudflare Access login |

## Architecture

```
Docker (openshell-cluster-<name>)
  └─ k3s cluster
      ├─ NVIDIA device plugin
      └─ OpenShell sandbox
          ├─ OpenClaw agent
          ├─ NemoClaw plugin
          ├─ Gateway (WebSocket + REST)
          └─ Workspace (SOUL.md, USER.md, TOOLS.md, skills/)

Port forward (systemd): localhost:18789 ←SSH tunnel→ sandbox:18789
Cloudflare Tunnel (optional): nemoclaw.domain → localhost:18789
```

## References

- [NemoClaw GitHub](https://github.com/NVIDIA/NemoClaw)
- [OpenShell GitHub](https://github.com/NVIDIA/OpenShell)
- [OpenClaw docs](https://docs.openclaw.ai)
- [NemoClaw quickstart](https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart.html)
- [awesome-nemoclaw presets](https://github.com/VoltAgent/awesome-nemoclaw)
- [awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills)
- [device auth bug fix](https://github.com/openclaw/openclaw/issues/43909)
