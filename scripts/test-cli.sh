#!/usr/bin/env bash
# Smoke-tests the three published CLIs: packs each package, installs the
# tarball into a scratch npm prefix (not the real global npm packages), and
# runs it against a temp directory. Mirrors the CLI-functionality steps in
# .github/workflows/ci.yml's build-and-test job (there gated by
# SKIP_CLI_TESTS; here, by manual-ci.yml's skip_cli_tests input when run
# through that workflow).
#
# Requires network access — each generated project step does a real
# package-manager install of the scaffolded project's own dependencies,
# matching what ci.yml does today.
#
# Run from the repo root: bash scripts/test-cli.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d)"
NPM_PREFIX="$WORK_DIR/npm-global"
mkdir -p "$NPM_PREFIX"

cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

export PATH="$NPM_PREFIX/bin:$PATH"
export npm_config_prefix="$NPM_PREFIX"

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1" >&2; exit 1; }

cd "$REPO_ROOT"

# --- xmcp CLI: test from a consumer project that has @xmcp-dev/compiler -------
# The xmcp CLI immediately requires @xmcp-dev/compiler via createRequire on
# the current working directory's package.json, so it cannot run from the repo
# root (where compiler is not a dependency). We create a minimal consumer
# project, install both tarballs, and test from there.
XMCP_CONSUMER="$WORK_DIR/xmcp-consumer"
mkdir -p "$XMCP_CONSUMER"
cat >"$XMCP_CONSUMER/package.json" <<'PKG'
{
  "name": "xmcp-consumer-fixture",
  "version": "0.0.0",
  "private": true
}
PKG

# Pack each package into a subdirectory to avoid filename collisions.
mkdir -p "$WORK_DIR/pkgs/xmcp" "$WORK_DIR/pkgs/compiler"
pnpm --dir packages/xmcp pack --pack-destination "$WORK_DIR/pkgs/xmcp" >/dev/null
pnpm --dir packages/compiler pack --pack-destination "$WORK_DIR/pkgs/compiler" >/dev/null
XMCP_TGZ="$(ls "$WORK_DIR/pkgs/xmcp"/*.tgz)"
COMPILER_TGZ="$(ls "$WORK_DIR/pkgs/compiler"/*.tgz)"

(cd "$XMCP_CONSUMER" && npm install "$XMCP_TGZ" "$COMPILER_TGZ" >/dev/null) \
  || fail "xmcp consumer npm install"

(cd "$XMCP_CONSUMER" && ./node_modules/.bin/xmcp --help >/dev/null) \
  || fail "xmcp CLI --help in consumer project"
pass "xmcp CLI runs with a consumer-installed compiler"

# --- create-xmcp-app: pack, install globally, generate a project -------------
pnpm --dir packages/create-xmcp-app pack --pack-destination "$WORK_DIR/pkgs" >/dev/null
CREATE_TGZ="$(ls "$WORK_DIR/pkgs"/create-xmcp-app-*.tgz)"
npm install -g "$CREATE_TGZ" >/dev/null

(cd "$WORK_DIR" && create-xmcp-app test-project --yes --use-npm) \
  || fail "create-xmcp-app project generation"
[ -d "$WORK_DIR/test-project" ] || fail "create-xmcp-app did not create test-project"
[ -f "$WORK_DIR/test-project/xmcp.config.ts" ] \
  || fail "create-xmcp-app project missing xmcp.config.ts"
pass "create-xmcp-app generated and installed a project"

# --- init-xmcp: pack, install globally, initialize an existing project in place ---
pnpm --dir packages/init-xmcp pack --pack-destination "$WORK_DIR/pkgs" >/dev/null
INIT_TGZ="$(ls "$WORK_DIR/pkgs"/init-xmcp-*.tgz)"
npm install -g "$INIT_TGZ" >/dev/null

INIT_FIXTURE="$WORK_DIR/init-fixture"
mkdir -p "$INIT_FIXTURE/app"
cat >"$INIT_FIXTURE/package.json" <<'PKG'
{
  "name": "init-xmcp-fixture",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "next": "^16.2.11",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": { "typescript": "^5.9.3" }
}
PKG
cat >"$INIT_FIXTURE/tsconfig.json" <<'TSC'
{ "compilerOptions": { "target": "ES2020", "module": "ESNext" } }
TSC
echo "export default function Page() { return null }" >"$INIT_FIXTURE/app/page.tsx"

(cd "$INIT_FIXTURE" && init-xmcp --yes --package-manager npm) \
  || fail "init-xmcp initialization"
[ -f "$INIT_FIXTURE/xmcp.config.ts" ] \
  || fail "init-xmcp did not create xmcp.config.ts"
[ -f "$INIT_FIXTURE/node_modules/xmcp/package.json" ] \
  || fail "init-xmcp did not install xmcp"
[ -f "$INIT_FIXTURE/node_modules/@xmcp-dev/compiler/package.json" ] \
  || fail "init-xmcp did not install @xmcp-dev/compiler"
pass "init-xmcp initialized an existing project in place"

echo "All CLI checks passed."