#!/usr/bin/env bash
# Verifies build outputs for xmcp, @xmcp-dev/compiler, create-xmcp-app, and
# init-xmcp. Mirrors the inline "Verify ... build" steps and the compiler
# typecheck step in .github/workflows/ci.yml's build-and-test job.
#
# Run from the repo root: bash scripts/test-build.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Building xmcp, @xmcp-dev/compiler, create-xmcp-app, init-xmcp..."
pnpm turbo build \
  --filter=xmcp \
  --filter=@xmcp-dev/compiler \
  --filter=create-xmcp-app \
  --filter=init-xmcp

echo "Type-checking @xmcp-dev/compiler..."
pnpm --filter @xmcp-dev/compiler typecheck

check_file() {
  local path="$1" label="$2"
  if [ ! -f "$REPO_ROOT/$path" ]; then
    echo "FAIL: $label build output missing: $path" >&2
    exit 1
  fi
  echo "PASS: $label -> $path"
}

check_file "packages/xmcp/dist/index.js" "xmcp"
check_file "packages/xmcp/dist/index.d.ts" "xmcp types"
check_file "packages/xmcp/dist/cli.js" "xmcp CLI"
check_file "packages/create-xmcp-app/index.js" "create-xmcp-app"
check_file "packages/init-xmcp/dist/index.js" "init-xmcp"
check_file "packages/compiler/dist/cli.js" "@xmcp-dev/compiler CLI"

echo "All build checks passed."