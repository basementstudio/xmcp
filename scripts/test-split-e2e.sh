#!/usr/bin/env bash
# E2E checks for the xmcp runtime / @xmcp-dev/compiler split.
#
# Verifies, against packed npm tarballs (not workspace links):
#   1. the `xmcp` CLI shim resolves a project-installed @xmcp-dev/compiler
#   2. a built HTTP server runs from dist/ alone (no node_modules) and answers
#      initialize, tools/list, and tools/call
#   3. the same for a built stdio server
#   4. `xmcp build` without @xmcp-dev/compiler fails with the install hint
#   5. the xmcp/config export resolves from the packed runtime
#
# Run from the repo root: bash scripts/test-split-e2e.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURES="$REPO_ROOT/packages/xmcp/bench/fixtures"
WORK_DIR="$(mktemp -d)"
HTTP_PORT=3011 # fixed in bench/fixtures/xmcp-http/xmcp.config.ts
SERVER_PID=""

cleanup() {
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

# --- Stage 1: build and pack both packages -----------------------------------
cd "$REPO_ROOT"
pnpm turbo build --filter=xmcp --filter=@xmcp-dev/compiler >"$WORK_DIR/build.log" 2>&1 \
  || { cat "$WORK_DIR/build.log" >&2; fail "workspace build"; }
pnpm --dir packages/xmcp pack --pack-destination "$WORK_DIR" >/dev/null
pnpm --dir packages/compiler pack --pack-destination "$WORK_DIR" >/dev/null
XMCP_TGZ="$(ls "$WORK_DIR"/xmcp-[0-9]*.tgz)"
COMPILER_TGZ="$(ls "$WORK_DIR"/xmcp-dev-compiler-*.tgz)"
pass "build and pack (runtime + compiler tarballs)"

# Copies a bench fixture and installs the packed tarballs into it.
prepare_consumer() {
  local fixture="$1" target="$2"
  cp -R "$FIXTURES/$fixture" "$target"
  node - "$target/package.json" "$XMCP_TGZ" "$COMPILER_TGZ" <<'EOF'
const fs = require("fs");
const [pkgPath, xmcpTgz, compilerTgz] = process.argv.slice(2);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
pkg.dependencies.xmcp = `file:${xmcpTgz}`;
pkg.devDependencies = { "@xmcp-dev/compiler": `file:${compilerTgz}` };
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
EOF
  (cd "$target" && npm install --legacy-peer-deps --no-fund --no-audit >install.log 2>&1) \
    || { cat "$target/install.log" >&2; fail "npm install in $fixture consumer"; }
}

# --- Stage 2: shim happy path (HTTP consumer builds via project compiler) ----
HTTP_APP="$WORK_DIR/consumer-http"
prepare_consumer "xmcp-http" "$HTTP_APP"
(cd "$HTTP_APP" && npx xmcp build >build.log 2>&1) \
  || { cat "$HTTP_APP/build.log" >&2; fail "xmcp build through the shim (HTTP consumer)"; }
[ -f "$HTTP_APP/dist/http.js" ] || fail "shim build produced no dist/http.js"
# The fixture declares "type": "module", so the build must emit ESM output
# with the dist/package.json marker that keeps the artifact self-contained.
grep -q '"type":"module"' "$HTTP_APP/dist/package.json" 2>/dev/null \
  || fail "ESM build did not emit the dist/package.json module marker"
pass "shim resolves project-installed @xmcp-dev/compiler and builds (ESM)"

# --- Stage 3: HTTP artifact runs without node_modules ------------------------
HTTP_DEPLOY="$WORK_DIR/deploy-http"
mkdir -p "$HTTP_DEPLOY"
cp -R "$HTTP_APP/dist" "$HTTP_DEPLOY/dist"
(cd "$HTTP_DEPLOY" && node dist/http.js >server.log 2>&1) &
SERVER_PID=$!

# Poll until the server accepts connections instead of sleeping a fixed time.
READY_ATTEMPTS=50    # x READY_INTERVAL_S = 10s startup budget
READY_INTERVAL_S=0.2 # poll interval while waiting for the port
REQUEST_TIMEOUT_S=5  # per-request cap so a hung server fails fast
for _ in $(seq "$READY_ATTEMPTS"); do
  if curl -s -o /dev/null --max-time "$REQUEST_TIMEOUT_S" "http://127.0.0.1:$HTTP_PORT/mcp"; then break; fi
  kill -0 "$SERVER_PID" 2>/dev/null || { cat "$HTTP_DEPLOY/server.log" >&2; fail "HTTP server exited early"; }
  sleep "$READY_INTERVAL_S"
done

mcp_post() {
  curl -s --max-time "$REQUEST_TIMEOUT_S" "http://127.0.0.1:$HTTP_PORT/mcp" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d "$1"
}

INIT_RES="$(mcp_post '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"split-e2e","version":"0.0.0"}}}')"
echo "$INIT_RES" | grep -q '"serverInfo"' || { echo "$INIT_RES" >&2; fail "HTTP initialize"; }
LIST_RES="$(mcp_post '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}')"
echo "$LIST_RES" | grep -q '"add"' || { echo "$LIST_RES" >&2; fail "HTTP tools/list"; }
CALL_RES="$(mcp_post '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add","arguments":{"a":2,"b":3}}}')"
echo "$CALL_RES" | grep -q '"5"' || { echo "$CALL_RES" >&2; fail "HTTP tools/call add(2,3)"; }
{ kill "$SERVER_PID" && wait "$SERVER_PID"; } 2>/dev/null || true
SERVER_PID=""
pass "HTTP artifact serves initialize/tools/list/tools/call without node_modules"

# --- Stage 4: stdio artifact runs without node_modules -----------------------
STDIO_APP="$WORK_DIR/consumer-stdio"
prepare_consumer "xmcp-stdio" "$STDIO_APP"
(cd "$STDIO_APP" && npx xmcp build >build.log 2>&1) \
  || { cat "$STDIO_APP/build.log" >&2; fail "xmcp build through the shim (stdio consumer)"; }
[ -f "$STDIO_APP/dist/stdio.js" ] || fail "shim build produced no dist/stdio.js"

STDIO_DEPLOY="$WORK_DIR/deploy-stdio"
mkdir -p "$STDIO_DEPLOY"
cp -R "$STDIO_APP/dist" "$STDIO_DEPLOY/dist"
STDIO_RES="$(cd "$STDIO_DEPLOY" && printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"split-e2e","version":"0.0.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add","arguments":{"a":2,"b":3}}}' \
  | node dist/stdio.js 2>/dev/null)"
echo "$STDIO_RES" | grep -q '"serverInfo"' || { echo "$STDIO_RES" >&2; fail "stdio initialize"; }
echo "$STDIO_RES" | grep -q '"add"' || { echo "$STDIO_RES" >&2; fail "stdio tools/list"; }
echo "$STDIO_RES" | grep -q '"5"' || { echo "$STDIO_RES" >&2; fail "stdio tools/call add(2,3)"; }
pass "stdio artifact answers initialize/tools/list/tools/call without node_modules"

# --- Stage 5: missing compiler fails with the install hint -------------------
BARE_APP="$WORK_DIR/consumer-bare"
mkdir -p "$BARE_APP"
cat >"$BARE_APP/package.json" <<EOF
{
  "private": true,
  "dependencies": { "xmcp": "file:$XMCP_TGZ" }
}
EOF
(cd "$BARE_APP" && npm install --legacy-peer-deps --no-fund --no-audit >install.log 2>&1) \
  || { cat "$BARE_APP/install.log" >&2; fail "npm install in bare consumer"; }
set +e
BARE_OUT="$(cd "$BARE_APP" && npx xmcp build 2>&1)"
BARE_EXIT=$?
set -e
[ "$BARE_EXIT" -ne 0 ] || fail "xmcp build without compiler should exit non-zero"
echo "$BARE_OUT" | grep -q "requires the dev-only compiler" \
  || { echo "$BARE_OUT" >&2; fail "missing-compiler error message"; }
pass "missing @xmcp-dev/compiler exits non-zero with the install hint"

# --- Stage 6: xmcp/config export resolves from the packed runtime ------------
# Runs in the HTTP consumer: xmcp/config needs the consumer's zod peer install.
(cd "$HTTP_APP" && node -e 'require("xmcp/config")') || fail "require(\"xmcp/config\")"
(cd "$HTTP_APP" && node --input-type=module -e 'await import("xmcp/config")') \
  || fail "import(\"xmcp/config\")"
pass "xmcp/config resolves via require and import"

# --- Stage 7: CommonJS projects still get CommonJS output --------------------
# Strip "type": "module" from the HTTP consumer and rebuild.
node -e '
const fs = require("fs");
const pkgPath = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
delete pkg.type;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
' "$HTTP_APP/package.json"
(cd "$HTTP_APP" && rm -rf dist .xmcp && npx xmcp build >build-cjs.log 2>&1) \
  || { cat "$HTTP_APP/build-cjs.log" >&2; fail "xmcp build in CommonJS mode"; }
[ ! -f "$HTTP_APP/dist/package.json" ] \
  || fail "CommonJS build unexpectedly emitted a dist/package.json marker"

CJS_DEPLOY="$WORK_DIR/deploy-http-cjs"
mkdir -p "$CJS_DEPLOY"
cp -R "$HTTP_APP/dist" "$CJS_DEPLOY/dist"
(cd "$CJS_DEPLOY" && node dist/http.js >server.log 2>&1) &
SERVER_PID=$!
for _ in $(seq "$READY_ATTEMPTS"); do
  if curl -s -o /dev/null --max-time "$REQUEST_TIMEOUT_S" "http://127.0.0.1:$HTTP_PORT/mcp"; then break; fi
  kill -0 "$SERVER_PID" 2>/dev/null || { cat "$CJS_DEPLOY/server.log" >&2; fail "CommonJS HTTP server exited early"; }
  sleep "$READY_INTERVAL_S"
done
CJS_RES="$(mcp_post '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"add","arguments":{"a":2,"b":3}}}')"
echo "$CJS_RES" | grep -q '"5"' || { echo "$CJS_RES" >&2; fail "CommonJS HTTP tools/call add(2,3)"; }
{ kill "$SERVER_PID" && wait "$SERVER_PID"; } 2>/dev/null || true
SERVER_PID=""
pass "CommonJS project still builds and serves CommonJS output"

echo "All split E2E checks passed."
