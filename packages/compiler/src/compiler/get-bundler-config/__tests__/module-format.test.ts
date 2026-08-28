import { describe, it, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { RuleSetRule } from "@rspack/core";
import { getRspackConfig } from "..";
import { EmitPackageJsonTypePlugin } from "../plugins";
import { compilerContext } from "@/compiler/compiler-context";
import { runtimeFolderPath } from "@/utils/constants";
import { configSchema, XmcpConfigOutputSchema } from "@/runtime-config";

const originalCwd = process.cwd();
const tempDirs: string[] = [];

/** A project folder whose package.json declares (or omits) "type": "module" */
function projectFolder(type?: "module" | "commonjs"): string {
  const folder = mkdtempSync(join(tmpdir(), "xmcp-module-format-"));
  tempDirs.push(folder);
  writeFileSync(
    join(folder, "package.json"),
    JSON.stringify({ name: "app", ...(type ? { type } : {}) })
  );
  return folder;
}

function buildConfig(
  xmcpConfig: XmcpConfigOutputSchema,
  { projectType }: { projectType?: "module" | "commonjs" } = {}
) {
  process.chdir(projectFolder(projectType));
  return compilerContext.provider(
    {
      mode: "production",
      platforms: {},
      toolPaths: new Set(),
      promptPaths: new Set(),
      resourcePaths: new Set(),
      hasMiddleware: false,
      xmcpConfig,
    },
    () => getRspackConfig(xmcpConfig)
  );
}

const adapterConfig = configSchema.parse({
  http: true,
  experimental: { adapter: "nextjs" },
});
const httpConfig = configSchema.parse({ http: true });

/** Does the compilation parse .xmcp with CommonJS-compatible semantics? */
function relaxesXmcpModuleType(rules: RuleSetRule[]): boolean {
  return rules.some(
    (rule) =>
      rule.type === "javascript/auto" && rule.include === runtimeFolderPath
  );
}

function emittedPackageJsonTypes(plugins: unknown[]): string[] {
  return plugins
    .filter((plugin) => plugin instanceof EmitPackageJsonTypePlugin)
    .map((plugin) => (plugin as EmitPackageJsonTypePlugin).moduleType);
}

afterEach(() => {
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("adapter output module format", () => {
  it("stays CommonJS and pins the output folder to it", () => {
    for (const projectType of ["module", "commonjs", undefined] as const) {
      const config = buildConfig(adapterConfig, { projectType });

      assert.strictEqual(
        config.output?.libraryTarget,
        "commonjs2",
        `adapter output should be CommonJS for a "${projectType}" project`
      );
      assert.deepStrictEqual(
        emittedPackageJsonTypes(config.plugins as unknown[]),
        ["commonjs"],
        `adapter output folder should be pinned to CommonJS for a "${projectType}" project`
      );
    }
  });

  // The bug: under "type": "module" the .xmcp folder was parsed as strict ESM,
  // so the prebuilt runtime's module.exports assignment went dead and the
  // adapter bundle came out with no exports at all.
  it("keeps .xmcp on CommonJS semantics when the project is ESM", () => {
    const esm = buildConfig(adapterConfig, { projectType: "module" });
    assert.ok(relaxesXmcpModuleType(esm.module?.rules as RuleSetRule[]));

    const cjs = buildConfig(adapterConfig, { projectType: "commonjs" });
    assert.ok(!relaxesXmcpModuleType(cjs.module?.rules as RuleSetRule[]));
  });
});

describe("plain server output module format", () => {
  it("follows the project and marks the output folder to match", () => {
    const esm = buildConfig(httpConfig, { projectType: "module" });
    assert.deepStrictEqual(esm.output?.library, { type: "module" });
    assert.deepStrictEqual(emittedPackageJsonTypes(esm.plugins as unknown[]), [
      "module",
    ]);

    const cjs = buildConfig(httpConfig, { projectType: "commonjs" });
    assert.strictEqual(cjs.output?.libraryTarget, "commonjs2");
    assert.deepStrictEqual(
      emittedPackageJsonTypes(cjs.plugins as unknown[]),
      []
    );
  });
});
