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
  {
    projectType,
    platforms = {},
  }: {
    projectType?: "module" | "commonjs";
    platforms?: { vercel?: boolean; cloudflare?: boolean };
  } = {}
) {
  process.chdir(projectFolder(projectType));
  return compilerContext.provider(
    {
      mode: "production",
      platforms,
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

describe("vercel function output", () => {
  // Vercel serves the build as a function, so the entry is the runtime that
  // exports a handler. A server entry would leave the platform nothing to
  // call, and its listening socket would hold the invocation open until the
  // function's maximum duration killed it.
  it("builds the handler runtime instead of the server one", () => {
    for (const projectType of ["module", "commonjs", undefined] as const) {
      const config = buildConfig(httpConfig, {
        projectType,
        platforms: { vercel: true },
      });

      assert.deepStrictEqual(
        Object.keys(config.entry as Record<string, string>),
        ["vercel"],
        `vercel build should use the handler entry for a "${projectType}" project`
      );
      assert.match(
        (config.entry as Record<string, string>).vercel,
        /vercel\.js$/
      );
    }
  });

  // The handler is the entry's default export; CommonJS output has to unwrap
  // it so `module.exports` is the function the platform calls.
  it("exports the handler itself from a CommonJS build", () => {
    const cjs = buildConfig(httpConfig, {
      projectType: "commonjs",
      platforms: { vercel: true },
    });

    assert.deepStrictEqual(cjs.output?.library, {
      type: "commonjs2",
      export: "default",
    });
  });

  // An ESM bundle already exports its default; only the entry changes.
  it("keeps ESM output as it is while still building the handler entry", () => {
    const esm = buildConfig(httpConfig, {
      projectType: "module",
      platforms: { vercel: true },
    });

    assert.deepStrictEqual(esm.output?.library, { type: "module" });
    assert.deepStrictEqual(Object.keys(esm.entry as Record<string, string>), [
      "vercel",
    ]);
  });

  // Vercel sets VERCEL=1 for every build it runs, adapter projects included,
  // but an adapter build is not the function: the host framework serves the
  // endpoint and re-bundles this output. Unwrapping a default export it does
  // not have would leave the adapter bundle with no exports at all.
  it("leaves an adapter build alone even when the platform is vercel", () => {
    for (const projectType of ["module", "commonjs", undefined] as const) {
      const config = buildConfig(adapterConfig, {
        projectType,
        platforms: { vercel: true },
      });

      assert.strictEqual(
        config.output?.libraryTarget,
        "commonjs2",
        `adapter output should stay CommonJS for a "${projectType}" project`
      );
      assert.strictEqual(
        config.output?.library,
        undefined,
        `adapter output should not unwrap a default export for a "${projectType}" project`
      );
      assert.deepStrictEqual(
        Object.keys(config.entry as Record<string, string>),
        ["adapter"],
        `adapter build should keep its own entry for a "${projectType}" project`
      );
    }
  });
});
