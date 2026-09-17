import assert from "node:assert/strict";
import { test } from "node:test";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import { FIXTURE_TIMEOUT_MS } from "../harness/constants.js";
import { createFixture } from "../harness/fixture.js";
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
