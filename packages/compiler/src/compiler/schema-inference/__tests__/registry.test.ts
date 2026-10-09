import assert from "node:assert/strict";
import { test } from "node:test";

import { z } from "zod";

import { compilerContext } from "../../compiler-context";
import { generateImportCode } from "../../generate-import-code";
import { generateToolsExportCode } from "../../generate-tools-code";

function generate(enabled: boolean, cloudflare = false) {
  return compilerContext.provider(
    {
      mode: "production",
      platforms: { cloudflare },
      toolPaths: new Set(["src/tools/greet.ts"]),
      promptPaths: new Set(),
      resourcePaths: new Set(),
      hasMiddleware: false,
      xmcpConfig: { experimental: { inferToolSchemas: enabled } },
    },
    () => ({
      registry: generateToolsExportCode(),
      imports: generateImportCode(),
    })
  );
}

test("Next.js's direct registry uses the same inferred fields and descriptions", async () => {
  const { registry } = generate(true);
  const code = registry.replace(/^import .*;$/gm, "").replaceAll("export ", "");
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const tools = await new AsyncFunction(
    "z",
    "withInferredSchema",
    "tool0",
    code + "\nreturn tools;"
  )(
    z,
    (tool: object, path: string) => {
      assert.equal(path, "src/tools/greet.ts");
      return {
        ...tool,
        schema: { name: z.string().describe("Name") },
        metadata: { description: "Greeting" },
      };
    },
    { default: ({ name }: { name: string }) => `Hello ${name}` }
  );
  assert.equal(tools.greet.description, "Greeting");
  assert.equal(tools.greet.inputSchema.safeParse({ name: 123 }).success, false);
  assert.equal(await tools.greet.execute({ name: "Ada" }), "Hello Ada");
});

test("both import map forms apply inference only when enabled", () => {
  for (const cloudflare of [false, true]) {
    assert.match(generate(true, cloudflare).imports, /withInferredSchema/);
    assert.doesNotMatch(
      generate(false, cloudflare).imports,
      /inferred-tools|withInferredSchema/
    );
  }
  assert.doesNotMatch(
    generate(false).registry,
    /inferred-tools|withInferredSchema/
  );
});
