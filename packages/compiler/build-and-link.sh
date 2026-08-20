#!/bin/bash
set -e

if [ ! -f "package.json" ] || ! grep -q '"name": "@xmcp-dev/compiler"' package.json; then
  echo "Run this script from packages/compiler."
  exit 1
fi

rm -rf dist
pnpm build
pnpm link --global
