import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { REQUEST_TIMEOUT_MS } from "../constants.js";
import { E2E_ROOT } from "../fixture.js";

async function temporaryProject(context: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), "xmcp-conformance-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({ type: "module" })
  );
  return directory;
}

test("discovers feature modules without editing the conformance index", async (context) => {
  const directory = await temporaryProject(context);
  const entry = join(directory, "index.ts");
  await copyFile(new URL("../../conformance/index.ts", import.meta.url), entry);
  for (const name of ["first-feature.ts", "second-feature.ts"]) {
    await writeFile(
      join(directory, name),
      "export function register(getTarget) { getTarget(); }\n"
    );
  }
  await writeFile(
    join(directory, "types.d.ts"),
    "export type Example = string;\n"
  );
  await mkdir(join(directory, "__tests__"));
  await writeFile(
    join(directory, "__tests__/ignored.ts"),
    'throw new Error("nested tests must not be loaded");\n'
  );
  const { register } = await import(pathToFileURL(entry).href);
  let calls = 0;
  register(() => {
    calls++;
  });
  assert.equal(calls, 2);
});

test("reports feature modules missing their registration function", async (context) => {
  const directory = await temporaryProject(context);
  const entry = join(directory, "index.ts");
  await copyFile(new URL("../../conformance/index.ts", import.meta.url), entry);
  await writeFile(
    join(directory, "broken.ts"),
    "export const unrelated = true;\n"
  );
  await assert.rejects(
    import(pathToFileURL(entry).href),
    /Conformance group broken\.ts must export register\(getTarget\)/
  );
});

async function runProbe(context: TestContext, source: string) {
  const directory = await temporaryProject(context);
  const entry = join(directory, "probe.test.mjs");
  const helper = new URL("../conformance.ts", import.meta.url).href;
  // The probe needs its own runner and TAP output, not the parent's worker mode.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  await writeFile(
    entry,
    `import assert from "node:assert/strict";
import { after } from "node:test";
import { createConformanceChecks } from ${JSON.stringify(helper)};
// Only the fields used by the capability guard are needed for these probes.
const target = {
  fixture: { label: "capability-fixture" },
  capabilities: new Set(["tools"]),
  unsupportedReasons: { "input-required": "Input requests are disabled in this fixture" },
};
${source}
`
  );
  return promisify(execFile)(
    process.execPath,
    ["--import", "tsx", "--test", "--test-reporter=tap", entry],
    {
      cwd: E2E_ROOT,
      env,
      timeout: REQUEST_TIMEOUT_MS,
    }
  );
}

test("prints default and explicit skip reasons without running unsupported checks", async (context) => {
  const { stdout } = await runProbe(
    context,
    `
const whenSupported = createConformanceChecks(() => target);
whenSupported("prompts", "unsupported prompts", async () => assert.fail("must be skipped"));
whenSupported("input-required", "unsupported input", async () => assert.fail("must be skipped"));
whenSupported("tools", "supported tools", async (received) => assert.equal(received, target));
`
  );
  assert.match(stdout, /# SKIP capability-fixture does not support prompts/);
  assert.match(stdout, /# SKIP Input requests are disabled in this fixture/);
  assert.match(stdout, /# pass 1/);
  assert.match(stdout, /# skipped 2/);
});

test("keeps failed checks failing and notifies fixture retention", async (context) => {
  await assert.rejects(
    runProbe(
      context,
      `
let failures = 0;
const whenSupported = createConformanceChecks(() => target, () => { failures++; });
whenSupported("tools", "failing check", async () => { throw new Error("expected probe failure"); });
after(() => assert.equal(failures, 1));
`
    ),
    (error: unknown) => {
      const failure = error as Error & { code: number; stdout: string };
      assert.equal(failure.code, 1);
      assert.match(failure.stdout, /expected probe failure/);
      assert.match(failure.stdout, /# fail 1/);
      assert.doesNotMatch(failure.stdout, /AssertionError/);
      return true;
    }
  );
});
