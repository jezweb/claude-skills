#!/bin/bash

# Check Latest Versions of React Hook Form + Zod Packages
# Usage: ./check-versions.sh

echo "Checking latest package versions..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check react-hook-form
echo -e "${GREEN}react-hook-form:${NC}"
npm view react-hook-form version
echo ""

# Check zod
echo -e "${GREEN}zod:${NC}"
npm view zod version
echo ""

# Check @hookform/resolvers
echo -e "${GREEN}@hookform/resolvers:${NC}"
npm view @hookform/resolvers version
echo ""

# Check last 5 versions of each
echo "---"
echo ""
echo -e "${YELLOW}Last 5 versions of react-hook-form:${NC}"
npm view react-hook-form versions --json | tail -7 | head -6
echo ""

echo -e "${YELLOW}Last 5 versions of zod:${NC}"
npm view zod versions --json | tail -7 | head -6
echo ""

echo -e "${YELLOW}Last 5 versions of @hookform/resolvers:${NC}"
npm view @hookform/resolvers versions --json | tail -7 | head -6
echo ""

echo "---"
echo ""
echo "Documentation Tested Versions (as of 2025-10-23):"
echo "  react-hook-form: 7.65.0"
echo "  zod: 4.1.12"
echo "  @hookform/resolvers: 5.2.2"
echo ""
echo "Run 'npm view <package> version' to check latest"
