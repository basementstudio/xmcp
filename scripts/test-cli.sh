#!/bin/bash

set -e

# Check for skip flag
if [[ "$1" == "--skip" ]]; then
  echo "🚫 Skipping CLI tests (--skip flag provided)"
  exit 0
fi

echo "🧪 Testing CLI functionality..."

# Test xmcp CLI
echo "Testing xmcp CLI..."
cd packages/xmcp
if ! node dist/cli.js --help > /dev/null 2>&1; then
  echo "❌ xmcp CLI cannot be executed"
  exit 1
fi
echo "✅ xmcp CLI is executable"
cd ../..

# Test create-xmcp-app CLI
echo "Testing create-xmcp-app CLI..."
cd packages/create-xmcp-app
if ! node index.js --help > /dev/null 2>&1; then
  echo "❌ create-xmcp-app CLI cannot be executed"
  exit 1
fi
echo "✅ create-xmcp-app CLI is executable"
cd ../..

# Test create-xmcp-app functionality with a temporary project
echo "Testing create-xmcp-app project creation..."
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Pack and install create-xmcp-app for testing
cd "$OLDPWD"
cd packages/create-xmcp-app
pnpm pack
PACK_FILE=$(ls create-xmcp-app-*.tgz)
npm install -g "$PACK_FILE"

# Create test project using non-interactive flags
cd "$TEST_DIR"
echo "Creating test project..."
create-xmcp-app test-project --yes --use-npm || {
  echo "❌ create-xmcp-app failed to create project"
  npm uninstall -g create-xmcp-app || true
  exit 1
}

if [ ! -d "test-project" ]; then
  echo "❌ Test project directory was not created"
  npm uninstall -g create-xmcp-app || true
  exit 1
fi

echo "✅ create-xmcp-app successfully created test project"

# Clean up
npm uninstall -g create-xmcp-app || true
rm -rf "$TEST_DIR"

echo "✅ All CLI tests passed!" 