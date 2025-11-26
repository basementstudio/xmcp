#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔨 Building and linking @xmcp-dev/cli for local testing...${NC}\n"

# Ensure script runs from packages/cli
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo -e "${RED}❌ Error: Run this script from packages/cli${NC}"
  exit 1
fi

# Validate package name
if ! grep -q '"name": "@xmcp-dev/cli"' package.json; then
  echo -e "${RED}❌ Error: This does not look like the @xmcp-dev/cli package${NC}"
  exit 1
fi

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  pnpm install || {
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
  }
  echo -e "${GREEN}✅ Dependencies installed${NC}\n"
fi

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf dist/
echo -e "${GREEN}✅ Cleaned${NC}\n"

# Build CLI
echo -e "${YELLOW}🔨 Building CLI...${NC}"
pnpm build || {
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
}
echo -e "${GREEN}✅ Build successful${NC}\n"

# Link globally
echo -e "${YELLOW}🔗 Linking CLI globally with pnpm...${NC}"
pnpm link --global || {
  echo -e "${RED}❌ Failed to link CLI${NC}"
  exit 1
}
echo -e "${GREEN}✅ CLI linked globally${NC}\n"

# Test command
echo -e "${BLUE}🧪 Testing CLI command...${NC}"
if command -v xmcp-dev-cli >/dev/null 2>&1; then
  xmcp-dev-cli --help >/dev/null 2>&1 && echo -e "${GREEN}✅ CLI is accessible!${NC}\n"
else
  echo -e "${YELLOW}⚠️  CLI command not found. Restart your terminal or ensure pnpm global bin dir is on PATH.${NC}\n"
fi

# Instructions
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Success! @xmcp-dev/cli is now linked globally.${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📋 To use it in another project:${NC}"
echo -e "${YELLOW}   1. Navigate to the project directory${NC}"
echo -e "      cd /path/to/project"
echo -e ""
echo -e "${YELLOW}   2. Link the CLI into that project${NC}"
echo -e "      pnpm link --global @xmcp-dev/cli"
echo -e ""
echo -e "${YELLOW}   3. Run the command${NC}"
echo -e "      npx xmcp-dev-cli generate --help"
echo -e ""
echo -e "${BLUE}🔄 After changes:${NC}"
echo -e "      Re-run this script to rebuild/link the CLI"
echo -e ""
echo -e "${BLUE}🧹 To unlink when finished:${NC}"
echo -e "${YELLOW}   pnpm unlink --global @xmcp-dev/cli${NC}"
echo -e ""

