import assert from "node:assert/strict";
import { test } from "node:test";

import { REQUEST_OPTIONS } from "../harness/client-options.js";
import { FIXTURE_TIMEOUT_MS } from "../harness/constants.js";
import { createFixture } from "../harness/fixture.js";
import { DEFAULT_FILES } from "../harness/project-files.js";
import type { Target } from "../harness/target.js";
import { startHttpTarget } from "../harness/targets/http.js";
import { startStdioTarget } from "../harness/targets/stdio.js";

for (const kind of ["http", "stdio", "nextjs"] as const) {
  test(
    `inferred tools advertise and validate inputs over ${kind}`,
    { timeout: FIXTURE_TIMEOUT_MS },
    async (context) => {
      const fixture = await createFixture({
        kind,
        moduleType: "commonjs",
        configFragment: `experimental: { ${kind === "nextjs" ? 'adapter: "nextjs",' : ""} inferToolSchemas: true }, typescript: { skipTypeCheck: true },`,
        files: {
          ...Object.fromEntries(
            Object.entries(DEFAULT_FILES)
              .filter(
                ([file, contents]) =>
                  file.startsWith("src/tools/") &&
                  !contents.includes("export const schema")
              )
              .map(([file, contents]) => [
                file,
                `export const schema = {};\n${contents}`,
              ])
          ),
          "src/tools/inferred.ts":
            'export { greet as default } from "../lib/greet";',
          "src/lib/greet.ts": `import type { Input } from "./input";
/** Greet from an existing function */
export function greet({ name, count = 1 }: Input) { return name.repeat(count); }`,
          "src/lib/input.ts": `export interface Input {
/** The name to greet
 * @minLength 2
 * @maxLength 8
 * @pattern ^[A-Z][a-z]+$
 */
name: string;
/** Repetitions
 * @minimum 1
 * @maximum 3
 */
count?: number;
language?: "en" | "es";
active?: boolean;
/** @format email */
email?: string;
/** @format uri */
website?: string;
/** @format uuid */
id?: string;
}`,
          "src/tools/overridden.ts": `import { z } from "zod";
export const schema = { name: z.string().min(3) };
export const metadata = { description: "Explicit description" };
/** Ignored description */
export default function tool(input: { name: string }) { return input.name; }`,
        },
      });
      let target: Target | undefined;
      let passed = false;
      context.after(async () => {
        await target?.close();
        if (passed) await fixture.dispose();
        else
          context.diagnostic(`Retained failed fixture: ${fixture.directory}`);
      });
      target =
        kind === "stdio"
          ? await startStdioTarget(fixture, "auto")
          : await startHttpTarget(fixture, "auto");
      const { tools } = await target.client.listTools({}, REQUEST_OPTIONS);
      const inferred = tools.find((tool) => tool.name === "inferred");
      assert.ok(inferred);
      assert.equal(inferred.description, "Greet from an existing function");
      assert.deepEqual(inferred.inputSchema.required, ["name"]);
      assert.equal(
        (inferred.inputSchema.properties?.name as { description: string })
          .description,
        "The name to greet"
      );
      const properties = inferred.inputSchema.properties as Record<
        string,
        Record<string, unknown>
      >;
      assert.equal(properties.name.minLength, 2);
      assert.equal(properties.name.maxLength, 8);
      assert.equal(properties.name.pattern, "^[A-Z][a-z]+$");
      assert.equal(properties.count.minimum, 1);
      assert.equal(properties.count.maximum, 3);
      assert.deepEqual(properties.language.enum, ["en", "es"]);
      assert.equal(properties.active.type, "boolean");
      assert.equal(properties.email.format, "email");
      assert.equal(properties.website.format, "uri");
      assert.equal(properties.id.format, "uuid");
      const result = await target.client.callTool(
        { name: "inferred", arguments: { name: "Ada", count: 2 } },
        REQUEST_OPTIONS
      );
      assert.deepEqual(result.content, [{ type: "text", text: "AdaAda" }]);
      for (const args of [
        {},
        { name: 123 },
        { name: "Ada", count: "2" },
        { name: "Ada", count: 99 },
        { name: "Ada", count: 0 },
        { name: "A" },
        { name: "Adalovelace" },
        { name: "ada" },
        { name: "Ada", active: "yes" },
        { name: "Ada", email: "invalid" },
        { name: "Ada", website: "invalid" },
        { name: "Ada", id: "invalid" },
      ]) {
        const invalid = await target.client.callTool(
          { name: "inferred", arguments: args },
          REQUEST_OPTIONS
        );
        assert.equal(invalid.isError, true);
        assert.match(JSON.stringify(invalid.content), /validation|invalid/i);
      }
      const invalidLanguage = await target.client.callTool(
        { name: "inferred", arguments: { name: "Ada", language: "fr" } },
        REQUEST_OPTIONS
      );
      assert.equal(invalidLanguage.isError, true);
      assert.match(JSON.stringify(invalidLanguage.content), /en[\s\S]*es/);
      const explicit = tools.find((tool) => tool.name === "overridden");
      assert.equal(explicit?.description, "Explicit description");
      const invalid = await target.client.callTool(
        { name: "overridden", arguments: { name: "A" } },
        REQUEST_OPTIONS
      );
      assert.equal(invalid.isError, true);
      assert.match(JSON.stringify(invalid.content), /validation|invalid/i);
      passed = true;
    }
  );
}

test(
  "schema inference stays disabled by default",
  { timeout: FIXTURE_TIMEOUT_MS },
  async (context) => {
    const fixture = await createFixture({
      kind: "stdio",
      moduleType: "commonjs",
      files: {
        "src/tools/unchanged.ts":
          "export default (input: { value?: string }) => JSON.stringify(input);",
      },
    });
    const target = await startStdioTarget(fixture, "auto");
    context.after(async () => {
      await target.close();
      await fixture.dispose();
    });
    const { tools } = await target.client.listTools({}, REQUEST_OPTIONS);
    assert.deepEqual(
      tools.find((tool) => tool.name === "unchanged")?.inputSchema.properties,
      {}
    );
    const result = await target.client.callTool(
      { name: "unchanged", arguments: { value: "ignored" } },
      REQUEST_OPTIONS
    );
    assert.deepEqual(result.content, [{ type: "text", text: "{}" }]);
  }
);

test(
  "unsupported inferred inputs fail production builds with a nonzero exit",
  { timeout: FIXTURE_TIMEOUT_MS },
  async () => {
    await assert.rejects(
      createFixture({
        kind: "stdio",
        moduleType: "commonjs",
        configFragment:
          "experimental: { inferToolSchemas: true }, typescript: { skipTypeCheck: true },",
        files: {
          "src/tools/aaa-invalid.ts":
            "export default (input: { callback: () => void }) => input;",
        },
      }),
      /failed \(1\)[\s\S]*Cannot infer tool[\s\S]*input.callback/
    );
  }
);
