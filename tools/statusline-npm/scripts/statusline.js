#!/usr/bin/env node

// Claude Code Custom Status Line — Context Bricks
// v4.1.1 - Rate limits, git caching, context awareness hook
//
// Line 1: [Model:style] repo:branch status | @agent | wt
// Line 2: [commit] message | +lines/-lines
// Line 3: [■■■■□□□□] 73%! | 52k free | 2h15m | $12.50 | 5h:23% 7d:41%

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read JSON from stdin
const chunks = [];
const stdin = process.stdin;
stdin.setEncoding('utf8');

if (stdin.isTTY) {
  process.exit(0);
}

stdin.on('data', (chunk) => chunks.push(chunk));
stdin.on('end', () => {
  try {
    main(JSON.parse(chunks.join('') || '{}'));
  } catch {
    main({});
  }
});

// ANSI helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2;37m',
  cyan: '\x1b[1;36m',
  green: '\x1b[1;32m',
  blue: '\x1b[1;34m',
  yellow: '\x1b[1;33m',
  red: '\x1b[1;31m',
  magenta: '\x1b[1;35m',
  greenDim: '\x1b[0;32m',
  redDim: '\x1b[0;31m',
  yellowDim: '\x1b[0;33m',
  cyanDim: '\x1b[0;36m',
};

// ── Git caching (5-second stale pattern from Claude Code docs) ──

const GIT_CACHE_FILE = '/tmp/contextbricks-git-cache.json';
const GIT_CACHE_MAX_AGE = 5; // seconds

function gitCacheIsStale() {
  try {
    if (!fs.existsSync(GIT_CACHE_FILE)) return true;
    const age = (Date.now() / 1000) - fs.statSync(GIT_CACHE_FILE).mtimeMs / 1000;
    return age > GIT_CACHE_MAX_AGE;
  } catch {
    return true;
  }
}

// Safe git command execution
function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getGitInfo(currentDir) {
  // Check cache first
  if (!gitCacheIsStale()) {
    try {
      const cached = JSON.parse(fs.readFileSync(GIT_CACHE_FILE, 'utf8'));
      // Only use cache if same directory
      if (cached.dir === currentDir) return cached;
    } catch { /* cache corrupt, refresh */ }
  }

  // Fresh git data
  const isGit = git('rev-parse', '--git-dir') !== '';
  const info = { dir: currentDir, isGit, repoName: '', branch: '', commitShort: '', commitMsg: '', gitStatus: '', inWorktree: false };

  if (!isGit) {
    try { fs.writeFileSync(GIT_CACHE_FILE, JSON.stringify(info)); } catch {}
    return info;
  }

  const toplevel = git('rev-parse', '--show-toplevel');
  info.repoName = toplevel ? toplevel.split('/').pop().split('\\').pop() : '';
  info.branch = git('branch', '--show-current') || 'detached';
  info.commitShort = git('rev-parse', '--short', 'HEAD');
  info.commitMsg = git('log', '-1', '--pretty=%s').slice(0, 50);

  // Worktree detection
  const gitDir = git('rev-parse', '--git-dir');
  info.inWorktree = gitDir.includes('/worktrees/') || gitDir.includes('\\worktrees\\');

  // Status
  const porcelain = git('status', '--porcelain');
  if (porcelain) info.gitStatus = '*';

  // Ahead/behind
  const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
  if (upstream) {
    const ahead = parseInt(git('rev-list', '--count', `${upstream}..HEAD`)) || 0;
    const behind = parseInt(git('rev-list', '--count', `HEAD..${upstream}`)) || 0;
    if (ahead > 0) info.gitStatus += `\u2191${ahead}`;
    if (behind > 0) info.gitStatus += `\u2193${behind}`;
  }

  // Cache it
  try { fs.writeFileSync(GIT_CACHE_FILE, JSON.stringify(info)); } catch {}

  return info;
}

function main(data) {
  // Parse Claude data
  const model = (data.model?.display_name || 'Claude').replace('Claude ', '');
  // Prefer project_dir (launch dir) over cwd (which can change)
  const projectDir = data.workspace?.project_dir || data.workspace?.current_dir || process.env.PWD || process.cwd();
  const currentDir = data.workspace?.current_dir || process.env.PWD || process.cwd();
  const linesAdded = data.cost?.total_lines_added || 0;
  const linesRemoved = data.cost?.total_lines_removed || 0;
  const agentName = data.agent?.name || '';
  const outputStyle = data.output_style?.name || '';
  const exceeds200k = data.exceeds_200k_tokens || false;

  // Style abbreviation
  let styleAbbrev = '';
  if (outputStyle && outputStyle !== 'default') {
    const map = { explanatory: 'expl', concise: 'conc', verbose: 'verb' };
    styleAbbrev = map[outputStyle] || outputStyle.slice(0, 4);
  }

  // Change to workspace directory for git commands
  try { process.chdir(currentDir); } catch { /* stay where we are */ }

  // Git info (cached)
  const gi = getGitInfo(currentDir);

  // ── Line 1: Session identity ──────────────────────────────
  let line1 = '';
  line1 += styleAbbrev
    ? `${c.cyan}[${model}:${styleAbbrev}]${c.reset}`
    : `${c.cyan}[${model}]${c.reset}`;

  if (gi.repoName) {
    line1 += ` ${c.green}${gi.repoName}${c.reset}`;
    if (gi.branch) line1 += `:${c.blue}${gi.branch}${c.reset}`;
  }

  if (gi.gitStatus) line1 += ` ${c.red}${gi.gitStatus}${c.reset}`;
  if (agentName) line1 += ` | ${c.magenta}@${agentName}${c.reset}`;
  if (gi.inWorktree) line1 += ` | ${c.yellow}wt${c.reset}`;

  // ── Line 2: Git state ─────────────────────────────────────
  let line2 = '';
  if (gi.commitShort) {
    line2 += `${c.dim}[${c.reset}${c.yellowDim}${gi.commitShort}${c.reset}${c.dim}]${c.reset}`;
    if (gi.commitMsg) line2 += ` ${gi.commitMsg}`;
  }

  if (linesAdded > 0 || linesRemoved > 0) {
    if (line2) line2 += ' | ';
    line2 += `${c.greenDim}+${linesAdded}${c.reset}/${c.redDim}-${linesRemoved}${c.reset}`;
  }

  // ── Line 3: Context bricks + metrics ──────────────────────
  const durationMs = data.cost?.total_duration_ms || 0;
  const durationH = Math.floor(durationMs / 3600000);
  const durationM = Math.floor((durationMs % 3600000) / 60000);
  const costUsd = data.cost?.total_cost_usd || 0;
  const totalTokens = data.context_window?.context_window_size || 200000;

  let usagePct, freeTokens;
  const usedPctRaw = data.context_window?.used_percentage;
  const remainingPctRaw = data.context_window?.remaining_percentage;

  if (usedPctRaw != null) {
    usagePct = Math.floor(usedPctRaw);
    // remaining_percentage can be absent while used_percentage is set; derive it rather than showing 0k free
    const remainingPct = Math.floor(remainingPctRaw != null ? remainingPctRaw : 100 - usedPctRaw);
    freeTokens = Math.floor((totalTokens * remainingPct) / 100);
  } else {
    const cu = data.context_window?.current_usage;
    let usedTokens = 0;
    if (cu) {
      usedTokens = (cu.input_tokens || 0) + (cu.cache_creation_input_tokens || 0) + (cu.cache_read_input_tokens || 0);
    }
    freeTokens = totalTokens - usedTokens;
    usagePct = totalTokens > 0 ? Math.floor((usedTokens * 100) / totalTokens) : 0;
  }

  const freeK = Math.floor(freeTokens / 1000);

  // Brick bar (40 bricks)
  const totalBricks = 40;
  const usedBricks = totalTokens > 0 ? Math.floor((usagePct * totalBricks) / 100) : 0;
  const freeBricks = totalBricks - usedBricks;

  let line3 = '[';
  for (let i = 0; i < usedBricks; i++) line3 += `${c.cyanDim}\u25a0${c.reset}`;
  for (let i = 0; i < freeBricks; i++) line3 += `${c.dim}\u25a1${c.reset}`;
  line3 += ']';

  // Percentage — yellow with ! when exceeding 200k
  if (exceeds200k) {
    line3 += ` ${c.yellow}${usagePct}%!${c.reset}`;
  } else {
    line3 += ` ${c.bold}${usagePct}%${c.reset}`;
  }

  line3 += ` | ${c.green}${freeK}k free${c.reset}`;
  line3 += ` | ${durationH}h ${durationM}m`;

  if (costUsd > 0) {
    line3 += ` | ${c.yellowDim}$${costUsd.toFixed(2)}${c.reset}`;
  }

  // Rate limits (Pro/Max subscribers)
  const rl5h = data.rate_limits?.five_hour?.used_percentage;
  const rl7d = data.rate_limits?.seven_day?.used_percentage;
  if (rl5h != null || rl7d != null) {
    let rlParts = [];
    if (rl5h != null) {
      const rlColor = rl5h >= 80 ? c.red : rl5h >= 50 ? c.yellowDim : c.dim;
      rlParts.push(`${rlColor}5h:${Math.round(rl5h)}%${c.reset}`);
    }
    if (rl7d != null) {
      const rlColor = rl7d >= 80 ? c.red : rl7d >= 50 ? c.yellowDim : c.dim;
      rlParts.push(`${rlColor}7d:${Math.round(rl7d)}%${c.reset}`);
    }
    line3 += ` | ${rlParts.join(' ')}`;
  }

  // Persist context level for hooks (rounded to nearest 100k)
  try {
    const contextFile = path.join(process.env.HOME || '', '.claude', 'context-level.json');
    const free100k = Math.floor(freeTokens / 100000) * 100;  // e.g. 700 for 760k
    fs.writeFileSync(contextFile, JSON.stringify({
      freeK: freeK,
      free100k: free100k,
      usagePct: usagePct,
      totalK: Math.floor(totalTokens / 1000),
      ts: Date.now()
    }));
  } catch { /* non-critical — don't break the statusline */ }

  // Output
  console.log(line1);
  console.log(line2);
  console.log(line3);
}
