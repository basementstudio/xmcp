#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building and linking xmcp package for local testing...${NC}\n"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Error: This script must be run from the xmcp package directory${NC}"
    echo -e "${YELLOW}Please navigate to packages/xmcp and run this script${NC}"
    exit 1
fi

# Check if package.json has the right package name
if ! grep -q '"name": "xmcp"' package.json; then
    echo -e "${RED}❌ Error: This doesn't appear to be the xmcp package${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}\n"
fi

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf dist/
echo -e "${GREEN}✅ Cleaned${NC}\n"

# Build the package
echo -e "${YELLOW}🔨 Building xmcp package...${NC}"
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}\n"

# Link the package globally
echo -e "${YELLOW}🔗 Linking package globally with pnpm...${NC}"
pnpm link --global
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to link package${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Package linked successfully!${NC}\n"

# Test the CLI
echo -e "${BLUE}🧪 Testing the CLI...${NC}"
if command -v xmcp > /dev/null 2>&1; then
    xmcp --help > /dev/null 2>&1
    echo -e "${GREEN}✅ CLI is accessible!${NC}\n"
else
    echo -e "${YELLOW}⚠️  CLI not found in PATH. You may need to restart your terminal.${NC}\n"
fi

# Instructions
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Success! The xmcp package is now linked globally${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📋 To test in a different folder:${NC}"
echo -e "${YELLOW}   1. Create or navigate to a test directory:${NC}"
echo -e "      cd /path/to/test/folder"
echo -e ""
echo -e "${YELLOW}   2. Link xmcp in that project:${NC}"
echo -e "      pnpm link --global xmcp"
echo -e ""
echo -e "${YELLOW}   3. Test your changes:${NC}"
echo -e "      xmcp dev"
echo -e "      xmcp build"
echo -e ""
echo -e "${BLUE}📋 Alternative: Test with pnpm directly (no linking in test folder):${NC}"
echo -e "${YELLOW}   Since xmcp is already globally linked, you can just use it:${NC}"
echo -e "      cd /path/to/test/folder"
echo -e "      xmcp dev"
echo -e ""
echo -e "${BLUE}🔄 After making changes to xmcp:${NC}"
echo -e "   Run this script again to rebuild and update the link"
echo -e ""
echo -e "${BLUE}🧹 To unlink when done testing:${NC}"
echo -e "   ${YELLOW}# In the test folder (if you linked it there):${NC}"
echo -e "   pnpm unlink xmcp"
echo -e ""
echo -e "   ${YELLOW}# To remove the global link:${NC}"
echo -e "   cd $(pwd)"
echo -e "   pnpm unlink --global"
echo -e ""
