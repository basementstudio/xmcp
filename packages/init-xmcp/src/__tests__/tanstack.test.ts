import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detectFramework } from "../helpers/detect-framework.js";
import {
  createTanstackRoute,
  detectTanstackCloudflare,
  getTanstackRoute,
} from "../helpers/create-tanstack-route.js";
import { updatePackageJson } from "../helpers/update-package.js";
import { generateConfig } from "../helpers/generate-config.js";

describe("TanStack initialization", () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-tanstack-"));
  });
  afterEach(() => fs.removeSync(root));

  it("detects React Start in either dependency section before Fastify", () => {
    for (const section of ["dependencies", "devDependencies"]) {
      fs.writeJsonSync(path.join(root, "package.json"), {
        [section]: { "@tanstack/react-start": "1", fastify: "5" },
      });
      assert.equal(detectFramework(root), "tanstack");
      assert.equal(detectTanstackCloudflare(root), false);
    }
    fs.writeJsonSync(path.join(root, "package.json"), {
      devDependencies: { "@cloudflare/vite-plugin": "1" },
    });
    assert.equal(detectTanstackCloudflare(root), true);
  });

  it("generates default and nested routes with resolvable relative imports", () => {
    for (const [directory, endpoint] of [
      ["src/routes", "/mcp"],
      ["src/routes/api", "/api/mcp"],
      ["app/routes", "/mcp"],
    ]) {
      createTanstackRoute(root, directory);
      const route = getTanstackRoute(root, directory);
      assert.equal(route.endpoint, endpoint);
      assert.equal(
        path.resolve(path.dirname(route.file), route.adapterImport),
        path.join(root, ".xmcp/adapter/index.js")
      );
      const content = fs.readFileSync(route.file, "utf8");
      assert.ok(content.includes(`createFileRoute("${endpoint}")`));
      for (const method of ["GET", "POST", "DELETE"])
        assert.ok(content.includes(`${method}: ({ request })`));
    }
  });

  it("preserves an existing route", () => {
    const file = path.join(root, "src/routes/mcp.ts");
    fs.outputFileSync(file, "existing route");
    assert.throws(
      () => createTanstackRoute(root, "src/routes"),
      /--skip-route/
    );
    assert.equal(fs.readFileSync(file, "utf8"), "existing route");
  });

  it("builds the adapter before Vite and retains host commands for both platforms", () => {
    for (const cloudflare of [false, true]) {
      fs.writeJsonSync(path.join(root, "package.json"), {
        scripts: {
          dev: "vite dev --port 4321",
          build: "vite build",
          deploy: "wrangler deploy",
        },
      });
      updatePackageJson(root, { framework: "tanstack", cloudflare });
      const { scripts } = fs.readJsonSync(path.join(root, "package.json"));
      const flag = cloudflare ? " --cf" : "";
      assert.equal(
        scripts.dev,
        `xmcp build${flag} && (xmcp dev${flag} & vite dev --port 4321)`
      );
      assert.equal(scripts.build, `xmcp build${flag} && vite build`);
      assert.equal(scripts.deploy, "wrangler deploy");
    }
  });

  it("runs noninteractively with skip flags and an explicit Workers target", () => {
    fs.writeJsonSync(path.join(root, "package.json"), {
      dependencies: { "@tanstack/react-start": "1" },
      devDependencies: { typescript: "5" },
      scripts: { dev: "vite dev", build: "vite build" },
    });
    fs.writeJsonSync(path.join(root, "tsconfig.json"), { include: ["src"] });
    // Stub dependency installation; this test exercises the real CLI's scaffolding.
    const bin = path.join(root, "bin");
    fs.ensureDirSync(bin);
    fs.writeFileSync(path.join(bin, "npm"), "#!/bin/sh\nexit 0\n", {
      mode: 0o755,
    });
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL("../index.js", import.meta.url)),
        "--yes",
        "--package-manager",
        "npm",
        "--cf",
        "--skip-route",
        "--skip-tools",
        "--skip-prompts",
        "--skip-resources",
      ],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        },
      }
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(fs.existsSync(path.join(root, "src/routes/mcp.ts")), false);
    assert.match(
      fs.readFileSync(path.join(root, "xmcp.config.ts"), "utf8"),
      /adapter: "tanstack"/
    );
    assert.equal(
      fs.readJsonSync(path.join(root, "package.json")).scripts.build,
      "xmcp build --cf && vite build"
    );
  });

  it("configures TanStack with a custom endpoint and deferred host typechecking", () => {
    generateConfig(
      root,
      "tanstack",
      "src/tools",
      undefined,
      undefined,
      "/api/mcp"
    );
    const config = fs.readFileSync(path.join(root, "xmcp.config.ts"), "utf8");
    assert.match(config, /adapter: "tanstack"/);
    assert.match(config, /endpoint: "\/api\/mcp"/);
    assert.match(config, /skipTypeCheck: true/);
    assert.match(config, /prompts: false/);
  });
});
