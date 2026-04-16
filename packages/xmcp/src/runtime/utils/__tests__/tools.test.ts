import { test } from "node:test";
import assert from "node:assert";
import { shouldRegisterTool, resolveDependencies } from "../tools";
import type { ToolMetadata } from "../../../types/tool";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

const baseMeta = (overrides: Partial<ToolMetadata> = {}): ToolMetadata => ({
  name: overrides.name ?? "tool",
  description: overrides.description ?? "test",
  ...overrides,
});

const auth = (scopes: string[] = []): AuthInfo =>
  ({ token: "t", clientId: "c", scopes }) as AuthInfo;

// --- shouldRegisterTool ---

test("shouldRegisterTool: public tool with no auth is visible", () => {
  assert.strictEqual(shouldRegisterTool(baseMeta()), true);
});

test("shouldRegisterTool: enabled:false hides the tool by default", () => {
  assert.strictEqual(
    shouldRegisterTool(baseMeta({ enabled: false })),
    false
  );
});

test("shouldRegisterTool: enabled:false is overridden by includedInConfig", () => {
  assert.strictEqual(
    shouldRegisterTool(baseMeta({ enabled: false }), undefined, true),
    true
  );
});

test("shouldRegisterTool: requiresAuth without authInfo hides the tool", () => {
  assert.strictEqual(
    shouldRegisterTool(baseMeta({ requiresAuth: true })),
    false
  );
});

test("shouldRegisterTool: requiresAuth with authInfo allows the tool", () => {
  assert.strictEqual(
    shouldRegisterTool(baseMeta({ requiresAuth: true }), auth()),
    true
  );
});

test("shouldRegisterTool: requiredScopes imply auth and hide without authInfo", () => {
  assert.strictEqual(
    shouldRegisterTool(baseMeta({ requiredScopes: ["read"] })),
    false
  );
});

test("shouldRegisterTool: required scope subset of user scopes → visible", () => {
  assert.strictEqual(
    shouldRegisterTool(
      baseMeta({ requiredScopes: ["read"] }),
      auth(["read", "write"])
    ),
    true
  );
});

test("shouldRegisterTool: missing one required scope → hidden", () => {
  assert.strictEqual(
    shouldRegisterTool(
      baseMeta({ requiredScopes: ["read", "admin"] }),
      auth(["read"])
    ),
    false
  );
});

test("shouldRegisterTool: multi-scope all present → visible", () => {
  assert.strictEqual(
    shouldRegisterTool(
      baseMeta({ requiredScopes: ["read:users", "write:reports"] }),
      auth(["read:users", "write:reports", "admin"])
    ),
    true
  );
});

// --- resolveDependencies ---

const buildCandidates = (
  specs: Array<[string, string[]?]>
): Map<string, ToolMetadata> => {
  const m = new Map<string, ToolMetadata>();
  for (const [name, dependsOn] of specs) {
    m.set(name, baseMeta({ name, dependsOn }));
  }
  return m;
};

test("resolveDependencies: no-dep tools all pass through", () => {
  const candidates = buildCandidates([["a"], ["b"], ["c"]]);
  const resolved = resolveDependencies(
    candidates,
    new Set(["a", "b", "c"])
  );
  assert.deepStrictEqual(
    [...resolved].sort(),
    ["a", "b", "c"]
  );
});

test("resolveDependencies: linear chain a→b→c all present → all resolve", () => {
  const candidates = buildCandidates([
    ["a", ["b"]],
    ["b", ["c"]],
    ["c"],
  ]);
  const resolved = resolveDependencies(
    candidates,
    new Set(["a", "b", "c"])
  );
  assert.deepStrictEqual(
    [...resolved].sort(),
    ["a", "b", "c"]
  );
});

test("resolveDependencies: multi-hop fan-out a→{b,c}, b→d", () => {
  const candidates = buildCandidates([
    ["a", ["b", "c"]],
    ["b", ["d"]],
    ["c"],
    ["d"],
  ]);
  const resolved = resolveDependencies(
    candidates,
    new Set(["a", "b", "c", "d"])
  );
  assert.deepStrictEqual(
    [...resolved].sort(),
    ["a", "b", "c", "d"]
  );
});

test("resolveDependencies: missing dep drops dependent but keeps siblings", () => {
  // `a` depends on `missing` which is not in passedFilter; `b` is independent.
  const candidates = buildCandidates([
    ["a", ["missing"]],
    ["b"],
  ]);
  const resolved = resolveDependencies(candidates, new Set(["a", "b"]));
  assert.strictEqual(resolved.has("a"), false);
  assert.strictEqual(resolved.has("b"), true);
});

test("resolveDependencies: dep filtered out by auth drops dependent", () => {
  // `a→b`, both in candidates but `b` didn't pass the filter (e.g., auth-gated).
  const candidates = buildCandidates([
    ["a", ["b"]],
    ["b"],
  ]);
  const resolved = resolveDependencies(candidates, new Set(["a"]));
  assert.strictEqual(resolved.has("a"), false);
  assert.strictEqual(resolved.has("b"), false);
});

test("resolveDependencies: self-dep is dropped", () => {
  const candidates = buildCandidates([["a", ["a"]], ["b"]]);
  const resolved = resolveDependencies(candidates, new Set(["a", "b"]));
  assert.strictEqual(resolved.has("a"), false);
  assert.strictEqual(resolved.has("b"), true);
});

test("resolveDependencies: cycle a↔b drops both, keeps unrelated c", () => {
  const candidates = buildCandidates([
    ["a", ["b"]],
    ["b", ["a"]],
    ["c"],
  ]);
  const resolved = resolveDependencies(
    candidates,
    new Set(["a", "b", "c"])
  );
  assert.strictEqual(resolved.has("a"), false);
  assert.strictEqual(resolved.has("b"), false);
  assert.strictEqual(resolved.has("c"), true);
});

test("resolveDependencies: large cycle terminates (no infinite loop)", () => {
  // 20-node cycle to ensure maxIterations guard holds.
  const specs: Array<[string, string[]?]> = [];
  for (let i = 0; i < 20; i++) {
    specs.push([`t${i}`, [`t${(i + 1) % 20}`]]);
  }
  const candidates = buildCandidates(specs);
  const passed = new Set(specs.map(([n]) => n));
  const start = Date.now();
  const resolved = resolveDependencies(candidates, passed);
  assert.ok(
    Date.now() - start < 1000,
    "should terminate quickly via maxIterations"
  );
  assert.strictEqual(resolved.size, 0);
});

test("resolveDependencies: debug-silent when XMCP_DEBUG is unset", () => {
  const originalDebug = process.env.XMCP_DEBUG;
  delete process.env.XMCP_DEBUG;
  const originalWarn = console.warn;
  const calls: string[] = [];
  console.warn = (msg: string) => calls.push(msg);
  try {
    const candidates = buildCandidates([["a", ["missing"]]]);
    resolveDependencies(candidates, new Set(["a"]));
    assert.strictEqual(
      calls.length,
      0,
      `expected no warnings without XMCP_DEBUG, got: ${calls.join(" | ")}`
    );
  } finally {
    console.warn = originalWarn;
    if (originalDebug !== undefined) process.env.XMCP_DEBUG = originalDebug;
  }
});

test("resolveDependencies: debug-verbose logs names when XMCP_DEBUG=1", () => {
  const originalDebug = process.env.XMCP_DEBUG;
  process.env.XMCP_DEBUG = "1";
  const originalWarn = console.warn;
  const calls: string[] = [];
  console.warn = (msg: string) => calls.push(msg);
  try {
    const candidates = buildCandidates([["a", ["missing"]]]);
    resolveDependencies(candidates, new Set(["a"]));
    assert.ok(
      calls.some((m) => m.includes('"a"') && m.includes("missing")),
      `expected debug warning with names, got: ${calls.join(" | ")}`
    );
  } finally {
    console.warn = originalWarn;
    if (originalDebug === undefined) delete process.env.XMCP_DEBUG;
    else process.env.XMCP_DEBUG = originalDebug;
  }
});
