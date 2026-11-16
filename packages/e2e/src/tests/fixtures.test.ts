import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runCommand } from "../harness/process.js";
import { test } from "node:test";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import { FIXTURE_TIMEOUT_MS } from "../harness/constants.js";
import { createFixture, REPO_ROOT } from "../harness/fixture.js";
import type { Target } from "../harness/target.js";
import { startHttpTarget } from "../harness/targets/http.js";

test(
  "discovers added fixture tools and applies file/config overrides",
  { timeout: FIXTURE_TIMEOUT_MS },
  async (context) => {
    const fixture = await createFixture({
      kind: "http",
      moduleType: "module",
      capabilities: ["tools"],
      files: {
        "src/tools/features/extra.ts": `export const metadata = { name: "feature-extra", description: "Feature fixture tool" };
export default function extra() { return "extra tool result"; }
`,
        "src/tools/fail.ts": `export const metadata = { name: "fail", description: "Overridden fixture tool" };
export default function overridden() { return "overridden tool result"; }
`,
      },
      configFragment: `template: { ...defaultConfig.template, instructions: "Feature fixture instructions" },`,
    });
    let target: Target | undefined;
    let passed = false;
    context.after(async () => {
      try {
        await target?.close();
      } finally {
        if (passed) await fixture.dispose();
        else
          context.diagnostic(`Retained failed fixture: ${fixture.directory}`);
      }
    });
    target = await startHttpTarget(fixture, "auto");
    assert.deepEqual(target.capabilities, new Set(["tools"]));
    const { tools } = await target.client.listTools({}, REQUEST_OPTIONS);
    assert.ok(tools.some((tool) => tool.name === "feature-extra"));
    assert.ok(tools.some((tool) => tool.name === "add"));
    for (const [name, text] of [
      ["feature-extra", "extra tool result"],
      ["fail", "overridden tool result"],
    ]) {
      const result = await target.client.callTool(
        { name, arguments: {} },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      assert.deepEqual(result.content, [{ type: "text", text }]);
    }
    assert.equal(
      target.client.getInstructions(),
      "Feature fixture instructions"
    );
    passed = true;
  }
);

test(
  "compiles include rules for names and tags without exposing omitted or disabled components",
  { timeout: FIXTURE_TIMEOUT_MS },
  async (context) => {
    const fixture = await createFixture({
      kind: "http",
      moduleType: "module",
      configFragment:
        'components: { include: { names: ["visibility-ui", "disabled-metadata"], tags: ["catalog"] } },',
    });
    let target: Target | undefined;
    let passed = false;
    context.after(async () => {
      try {
        await target?.close();
      } finally {
        if (passed) await fixture.dispose();
        else
          context.diagnostic(`Retained failed fixture: ${fixture.directory}`);
      }
    });
    target = await startHttpTarget(fixture, "auto");
    const { client } = target;
    assert.deepEqual(
      (await client.listTools({}, REQUEST_OPTIONS)).tools
        .map(({ name }) => name)
        .sort(),
      ["metadata-tool", "visibility-ui"]
    );
    assert.deepEqual(
      (await client.listPrompts({}, REQUEST_OPTIONS)).prompts.map(
        ({ name }) => name
      ),
      ["metadata-prompt"]
    );
    assert.deepEqual(
      (await client.listResources({}, REQUEST_OPTIONS)).resources
        .map(({ name }) => name)
        .sort(),
      ["metadata-resource", "visibility-ui"]
    );
    assert.deepEqual(
      (
        await client.listResourceTemplates({}, REQUEST_OPTIONS)
      ).resourceTemplates.map(({ name }) => name),
      ["metadata-template"]
    );
    for (const name of ["add", "disabled-metadata"]) {
      await assert.rejects(
        client.callTool({ name, arguments: {} }, REQUEST_OPTIONS),
        /not found/i
      );
    }
    passed = true;
  }
);

test(
  "production compilation reports a failing exit code for type errors",
  { timeout: FIXTURE_TIMEOUT_MS },
  async (context) => {
    const fixture = await createFixture({ kind: "http", moduleType: "module" });
    context.after(() => fixture.dispose());
    await writeFile(
      join(fixture.directory, "src/tools/broken.ts"),
      "export default function broken(): string { return 123; }\n"
    );
    await assert.rejects(
      runCommand(
        process.execPath,
        [join(REPO_ROOT, "packages/xmcp/dist/cli.js"), "build"],
        fixture.directory,
        join(fixture.directory, "failed-build.log")
      ),
      /failed \(1\).*TS2322/s
    );
  }
);

test(
  "the published root supports native ESM named imports and CommonJS",
  { timeout: FIXTURE_TIMEOUT_MS },
  async (context) => {
    const fixture = await createFixture({ kind: "http", moduleType: "module" });
    context.after(() => fixture.dispose());
    await writeFile(
      join(fixture.directory, "imports.mjs"),
      `
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createContext, getRequestContext } from "xmcp";
const cjs = createRequire(import.meta.url)("xmcp");
assert.equal(typeof createContext, "function");
assert.equal(typeof getRequestContext, "function");
assert.equal(createContext, cjs.createContext);
`
    );
    await runCommand(
      process.execPath,
      ["imports.mjs"],
      fixture.directory,
      join(fixture.directory, "imports.log")
    );
  }
);
