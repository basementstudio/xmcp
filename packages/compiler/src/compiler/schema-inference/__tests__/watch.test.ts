import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { rspack } from "@rspack/core";
import { z } from "zod";

import { SchemaInferencePlugin } from "../../get-bundler-config/plugins/schema-inference";

// Bounds a real filesystem watch cycle, including recovery after an invalid edit.
const WATCH_TEST_TIMEOUT_MS = 30_000;
test(
  "watch rebuilds imported types and recovers after inference errors",
  { timeout: WATCH_TEST_TIMEOUT_MS },
  async (context) => {
    const directory = mkdtempSync(path.join(tmpdir(), "xmcp-inference-watch-"));
    const generated = path.join(directory, ".xmcp");
    mkdirSync(generated);
    const typeFile = path.join(directory, "input.ts");
    writeFileSync(
      path.join(directory, "tsconfig.json"),
      '{"compilerOptions":{"strict":true,"types":[]}}'
    );
    writeFileSync(
      path.join(directory, "tool.ts"),
      'import type { Input } from "./input"; export default (input: Input) => input;'
    );
    writeFileSync(typeFile, "export interface Input { value: string }");
    writeFileSync(
      path.join(directory, "entry.js"),
      'export { withInferredSchema } from "./.xmcp/inferred-tools.js";'
    );
    const compiler = rspack({
      mode: "development",
      context: directory,
      target: "node",
      entry: "./entry.js",
      output: {
        path: path.join(directory, "dist"),
        filename: "index.cjs",
        library: { type: "commonjs2" },
      },
      externals: { zod: "commonjs zod" },
      plugins: [
        new SchemaInferencePlugin(directory, generated, () => ["tool.ts"]),
      ],
    });
    let step = 0;
    let watching: ReturnType<typeof compiler.watch> | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        context.signal.addEventListener(
          "abort",
          () => reject(context.signal.reason),
          { once: true }
        );
        watching = compiler.watch({}, (error, stats) => {
          try {
            assert.ifError(error);
            assert.ok(stats);
            const code = readFileSync(
              path.join(generated, "inferred-tools.js"),
              "utf8"
            );
            if (step === 0) {
              assert.equal(stats.hasErrors(), false, stats.toString());
              assert.match(code, /z.string\(\)/);
              step = 1;
              writeFileSync(
                typeFile,
                "export interface Input { value: () => void }"
              );
            } else if (step === 1 && stats.hasErrors()) {
              assert.match(stats.toString(), /Cannot infer tool/);
              assert.match(code, /throw new Error/);
              step = 2;
              writeFileSync(
                typeFile,
                "export interface Input { value: number }"
              );
            } else if (step === 2 && !stats.hasErrors()) {
              assert.match(code, /z.number\(\)/);
              const bundle = {
                exports: {} as {
                  withInferredSchema: (
                    tool: object,
                    path: string
                  ) => { schema: Record<string, z.ZodType> };
                },
              };
              new Function(
                "require",
                "module",
                "exports",
                readFileSync(path.join(directory, "dist/index.cjs"), "utf8")
              )(
                (name: string) => {
                  assert.equal(name, "zod");
                  return { z };
                },
                bundle,
                bundle.exports
              );
              const schema = z.object(
                bundle.exports.withInferredSchema({}, "tool.ts").schema
              );
              assert.equal(schema.safeParse({ value: 1 }).success, true);
              assert.equal(schema.safeParse({ value: "stale" }).success, false);
              step = 3;
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        });
      });
    } finally {
      await new Promise<void>((resolve) =>
        watching ? watching.close(() => resolve()) : resolve()
      );
      await new Promise<void>((resolve) => compiler.close(() => resolve()));
      rmSync(directory, { recursive: true, force: true });
    }
  }
);
