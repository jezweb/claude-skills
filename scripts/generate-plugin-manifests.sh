#!/bin/bash
# Generate plugin.json for all skills
# Extracts metadata from SKILL.md frontmatter

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$(cd "$SCRIPT_DIR/../skills" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load author config from .env if it exists
if [ -f "$ROOT_DIR/.env" ]; then
  source "$ROOT_DIR/.env"
fi

# Original upstream author (preserved for skills not owned by fork)
UPSTREAM_AUTHOR_NAME="Jeremy Dawes"
UPSTREAM_AUTHOR_EMAIL="jeremy@jezweb.net"
UPSTREAM_REPOSITORY="https://github.com/jezweb/claude-skills"

# Fork author (used only for skills listed in SKILL_PATHS)
FORK_AUTHOR_NAME="${PLUGIN_AUTHOR_NAME:-$UPSTREAM_AUTHOR_NAME}"
FORK_AUTHOR_EMAIL="${PLUGIN_AUTHOR_EMAIL:-$UPSTREAM_AUTHOR_EMAIL}"
FORK_REPOSITORY="${PLUGIN_REPOSITORY:-$UPSTREAM_REPOSITORY}"

# Skills owned by this fork (comma-separated in .env)
# Only these skills will use FORK_AUTHOR_* values
FORK_SKILL_PATHS="${SKILL_PATHS:-}"

# Helper function to check if skill is owned by fork
is_fork_skill() {
  local skill="$1"
  if [ -z "$FORK_SKILL_PATHS" ]; then
    return 1  # No fork skills defined, all use upstream
  fi
  echo ",$FORK_SKILL_PATHS," | grep -q ",$skill,"
}

echo "Generating plugin.json files for all skills..."
if [ -n "$FORK_SKILL_PATHS" ]; then
  echo "Fork skills (custom author): $FORK_SKILL_PATHS"
fi
echo "Skills directory: $SKILLS_DIR"
echo ""

# Counter for tracking progress
count=0
total=$(ls -1 "$SKILLS_DIR" | wc -l)

# Iterate through all skill directories
for skill_dir in "$SKILLS_DIR"/*; do
  if [ ! -d "$skill_dir" ]; then
    continue
  fi

  skill_name=$(basename "$skill_dir")
  skill_md="$skill_dir/SKILL.md"
  plugin_dir="$skill_dir/.claude-plugin"
  plugin_json="$plugin_dir/plugin.json"

  count=$((count + 1))
  echo "[$count/$total] Processing: $skill_name"

  # Check if SKILL.md exists
  if [ ! -f "$skill_md" ]; then
    echo "  ⚠️  Warning: SKILL.md not found, skipping"
    continue
  fi

  # Create .claude-plugin directory
  mkdir -p "$plugin_dir"

  # Extract metadata from SKILL.md frontmatter
  # Look for YAML frontmatter between --- markers
  description=""
  keywords=""

  # Extract description (handle single-line, multi-line with |, and multi-line with >)
  # First try single-line format
  description=$(awk '/^description:/{if($0 !~ /[\|>]$/){gsub(/^description: */, ""); print; exit}}' "$skill_md")

  # If not found or empty, try multi-line format with | or >
  if [ -z "$description" ]; then
    description=$(awk '
      /^description: [\|>]/{flag=1; next}
      /^[a-z-]+:/{flag=0}
      flag && /^  /{gsub(/^  /, ""); line=line $0 " "}
      END{gsub(/ $/, "", line); print line}
    ' "$skill_md")
  fi

  # If description is still empty or problematic, use a default
  if [ -z "$description" ] || [ "$description" = "|" ] || [ "$description" = ">" ]; then
    description="Production-ready skill for $skill_name"
  fi

  # Extract keywords BEFORE truncating description
  # Keywords are in the format "Keywords: keyword1, keyword2, ..."
  keywords_raw=$(echo "$description" | grep -oP 'Keywords:\s*\K[^$]*' | tr -d '"' | tr -d "'")

  # If no keywords found in description, try YAML format
  if [ -z "$keywords_raw" ]; then
    keywords_raw=$(awk '/^keywords:/{flag=1; next} /^[a-z-]+:/{flag=0} flag && /^  - /{gsub(/^  - /, ""); print}' "$skill_md" | tr '\n' ',' | sed 's/,$//')
  fi

  # Clean up and convert keywords to JSON array
  keywords_json="[]"
  if [ -n "$keywords_raw" ]; then
    # Split by comma, trim whitespace, limit to first 15 keywords
    keywords_json=$(echo "$keywords_raw" | sed 's/,/\n/g' | sed 's/^ *//;s/ *$//' | grep -v '^$' | head -15 | awk '
      BEGIN { printf "[" }
      {
        gsub(/\\/, "\\\\")
        gsub(/"/, "")
        if (NR > 1) printf ","
        printf "\"%s\"", $0
      }
      END { printf "]" }
    ')
  fi

  # Now clean up description (remove Keywords line, trim, limit to 500 chars)
  description=$(echo "$description" | sed 's/Keywords:.*$//' | tr -d '"' | tr -d "'" | sed 's/  */ /g' | sed 's/^ *//;s/ *$//' | head -c 500)

  # Detect agents in skill's agents/ directory
  # Claude Code expects agents as an array of objects with name, description, and source
  agents_json=""
  agents_dir="$skill_dir/agents"
  if [ -d "$agents_dir" ]; then
    agent_files=$(find "$agents_dir" -maxdepth 1 -name "*.md" -type f 2>/dev/null | sort)
    agent_count=$(echo "$agent_files" | grep -c . 2>/dev/null || echo 0)
    if [ "$agent_count" -gt 0 ]; then
      agents_json="["
      first_agent=true
      for agent_file in $agent_files; do
        agent_basename=$(basename "$agent_file" .md)
        # Extract agent name and description from frontmatter
        agent_name=$(awk '/^---$/,/^---$/{if(/^name:/) {gsub(/^name: */, ""); print; exit}}' "$agent_file")
        if [ -z "$agent_name" ]; then
          agent_name="$agent_basename"
        fi
        agent_desc=$(awk '/^---$/,/^---$/{if(/^description:/ && $0 !~ /[\|>]$/){gsub(/^description: */, ""); print; exit}}' "$agent_file")
        if [ -z "$agent_desc" ]; then
          # Try multi-line description
          agent_desc=$(awk '
            /^description: [\|>]/{flag=1; next}
            /^[a-z-]+:/{flag=0}
            flag && /^  /{gsub(/^  /, ""); line=line $0 " "}
            END{gsub(/ $/, "", line); print line}
          ' "$agent_file" | head -c 300)
        fi
        if [ -z "$agent_desc" ]; then
          agent_desc="Agent for $agent_name"
        fi
        # Clean description (remove quotes, limit length)
        agent_desc=$(echo "$agent_desc" | tr -d '"' | tr -d "'" | sed 's/  */ /g' | sed 's/^ *//;s/ *$//' | head -c 300)

        if [ "$first_agent" = true ]; then
          first_agent=false
        else
          agents_json="$agents_json,"
        fi
        agents_json="$agents_json
    {
      \"name\": \"$agent_name\",
      \"description\": \"$agent_desc\",
      \"source\": \"./agents/$agent_basename.md\"
    }"
      done
      agents_json="$agents_json
  ]"
      echo "  📦 Found $agent_count agent(s): $(echo "$agent_files" | xargs -I {} basename {} .md | tr '\n' ' ')"
    fi
  fi

  # Detect commands in skill's commands/ directory
  # Claude Code expects commands as an array of objects with name, description, and source
  commands_json=""
  commands_dir="$skill_dir/commands"
  if [ -d "$commands_dir" ]; then
    command_files=$(find "$commands_dir" -maxdepth 1 -name "*.md" -type f 2>/dev/null | sort)
    command_count=$(echo "$command_files" | grep -c . 2>/dev/null || echo 0)
    if [ "$command_count" -gt 0 ]; then
      commands_json="["
      first_command=true
      for command_file in $command_files; do
        command_basename=$(basename "$command_file" .md)
        # Extract command name and description from frontmatter
        command_name=$(awk '/^---$/,/^---$/{if(/^name:/) {gsub(/^name: */, ""); print; exit}}' "$command_file")
        if [ -z "$command_name" ]; then
          command_name="$command_basename"
        fi
        command_desc=$(awk '/^---$/,/^---$/{if(/^description:/ && $0 !~ /[\|>]$/){gsub(/^description: */, ""); print; exit}}' "$command_file")
        if [ -z "$command_desc" ]; then
          # Try multi-line description
          command_desc=$(awk '
            /^description: [\|>]/{flag=1; next}
            /^[a-z-]+:/{flag=0}
            flag && /^  /{gsub(/^  /, ""); line=line $0 " "}
            END{gsub(/ $/, "", line); print line}
          ' "$command_file" | head -c 300)
        fi
        if [ -z "$command_desc" ]; then
          command_desc="Command for $command_name"
        fi
        # Clean description (remove quotes, limit length)
        command_desc=$(echo "$command_desc" | tr -d '"' | tr -d "'" | sed 's/  */ /g' | sed 's/^ *//;s/ *$//' | head -c 300)

        if [ "$first_command" = true ]; then
          first_command=false
        else
          commands_json="$commands_json,"
        fi
        commands_json="$commands_json
    {
      \"name\": \"$command_name\",
      \"description\": \"$command_desc\",
      \"source\": \"./commands/$command_basename.md\"
    }"
      done
      commands_json="$commands_json
  ]"
      echo "  📜 Found $command_count command(s): $(echo "$command_files" | xargs -I {} basename {} .md | tr '\n' ' ')"
    fi
  fi

  # Generate plugin.json
  # Note: commands/ and agents/ directories are auto-discovered by Claude Code
  # Do NOT add explicit commands or agents fields - they cause validation errors

  # Read version from VERSION file if it exists, otherwise default to 1.0.0
  version_file="$skill_dir/VERSION"
  if [ -f "$version_file" ]; then
    skill_version=$(cat "$version_file" | tr -d '[:space:]')
  else
    skill_version="1.0.0"
  fi

  # Determine author info based on whether this is a fork skill
  if is_fork_skill "$skill_name"; then
    # Fork skill - use custom author info
    author_name="$FORK_AUTHOR_NAME"
    author_email="$FORK_AUTHOR_EMAIL"
    repository="$FORK_REPOSITORY"
    echo "  👤 Using fork author: $author_name"
  else
    # Upstream skill - always use upstream author
    author_name="$UPSTREAM_AUTHOR_NAME"
    author_email="$UPSTREAM_AUTHOR_EMAIL"
    repository="$UPSTREAM_REPOSITORY"
  fi

  cat > "$plugin_json" << EOF
{
  "name": "$skill_name",
  "description": "$description",
  "version": "$skill_version",
  "author": {
    "name": "$author_name",
    "email": "$author_email"
  },
  "license": "MIT",
  "repository": "$repository",
  "keywords": $keywords_json
}
EOF

  echo "  ✅ Created: $plugin_json"
done

echo ""
echo "✅ Done! Generated plugin.json for $count skills"
echo ""

# Extract marketplace name from resolved repository URL (uses FORK_REPOSITORY which falls back to UPSTREAM_REPOSITORY)
MARKETPLACE_NAME=$(echo "$FORK_REPOSITORY" | sed 's|.*/||' | sed 's|\.git$||')
MARKETPLACE_ORG=$(echo "$FORK_REPOSITORY" | sed 's|https://github.com/||' | sed 's|/.*||')

echo "Next steps:"
echo "1. Review generated files: find skills/ -name plugin.json"
echo "2. Test marketplace: /plugin marketplace add $FORK_REPOSITORY"
echo "3. Install a skill: /plugin install cloudflare-worker-base@${MARKETPLACE_ORG}-${MARKETPLACE_NAME}"
