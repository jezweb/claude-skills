#!/bin/bash
#
# Turnstile CSP Checker
#
# Verifies that Content Security Policy headers allow Turnstile to function
#
# Usage:
#   ./check-csp.sh https://example.com
#   ./check-csp.sh https://example.com/contact
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if URL is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Please provide a URL${NC}"
  echo "Usage: $0 <url>"
  echo "Example: $0 https://example.com"
  exit 1
fi

URL="$1"

echo -e "${GREEN}Checking CSP for Turnstile compatibility...${NC}"
echo "URL: $URL"
echo ""

# Fetch headers
HEADERS=$(curl -sI "$URL")

# Extract CSP header
CSP=$(echo "$HEADERS" | grep -i "content-security-policy:" | sed 's/content-security-policy: //I')

if [ -z "$CSP" ]; then
  echo -e "${YELLOW}No Content-Security-Policy header found${NC}"
  echo "✅ Turnstile should work (no CSP restrictions)"
  exit 0
fi

echo "CSP Header found:"
echo "$CSP"
echo ""

# Initialize pass/fail counters
PASS=0
FAIL=0

# Check script-src
echo -e "${GREEN}Checking script-src...${NC}"
if echo "$CSP" | grep -q "script-src"; then
  if echo "$CSP" | grep -E "script-src[^;]*https://challenges.cloudflare.com" > /dev/null; then
    echo "✅ script-src allows https://challenges.cloudflare.com"
    ((PASS++))
  elif echo "$CSP" | grep -E "script-src[^;]*\*" > /dev/null; then
    echo "✅ script-src allows * (wildcard)"
    ((PASS++))
  else
    echo -e "${RED}❌ script-src does NOT allow https://challenges.cloudflare.com${NC}"
    echo "   Add: script-src https://challenges.cloudflare.com;"
    ((FAIL++))
  fi
else
  echo "⚠️  No script-src directive found (defaults may apply)"
fi
echo ""

# Check frame-src
echo -e "${GREEN}Checking frame-src...${NC}"
if echo "$CSP" | grep -q "frame-src"; then
  if echo "$CSP" | grep -E "frame-src[^;]*https://challenges.cloudflare.com" > /dev/null; then
    echo "✅ frame-src allows https://challenges.cloudflare.com"
    ((PASS++))
  elif echo "$CSP" | grep -E "frame-src[^;]*\*" > /dev/null; then
    echo "✅ frame-src allows * (wildcard)"
    ((PASS++))
  else
    echo -e "${RED}❌ frame-src does NOT allow https://challenges.cloudflare.com${NC}"
    echo "   Add: frame-src https://challenges.cloudflare.com;"
    ((FAIL++))
  fi
else
  echo "⚠️  No frame-src directive found (defaults may apply)"
fi
echo ""

# Check connect-src
echo -e "${GREEN}Checking connect-src...${NC}"
if echo "$CSP" | grep -q "connect-src"; then
  if echo "$CSP" | grep -E "connect-src[^;]*https://challenges.cloudflare.com" > /dev/null; then
    echo "✅ connect-src allows https://challenges.cloudflare.com"
    ((PASS++))
  elif echo "$CSP" | grep -E "connect-src[^;]*\*" > /dev/null; then
    echo "✅ connect-src allows * (wildcard)"
    ((PASS++))
  else
    echo -e "${RED}❌ connect-src does NOT allow https://challenges.cloudflare.com${NC}"
    echo "   Add: connect-src https://challenges.cloudflare.com;"
    ((FAIL++))
  fi
else
  echo "⚠️  No connect-src directive found (defaults may apply)"
fi
echo ""

# Final verdict
echo "========================================"
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ CSP is compatible with Turnstile!${NC}"
  exit 0
else
  echo -e "${RED}❌ CSP may block Turnstile${NC}"
  echo ""
  echo "Recommended CSP directives:"
  echo ""
  echo "<meta http-equiv=\"Content-Security-Policy\" content=\""
  echo "  script-src 'self' https://challenges.cloudflare.com;"
  echo "  frame-src 'self' https://challenges.cloudflare.com;"
  echo "  connect-src 'self' https://challenges.cloudflare.com;"
  echo "\">"
  echo ""
  echo "Or in HTTP header:"
  echo ""
  echo "Content-Security-Policy: script-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com"
  echo ""
  exit 1
fi
