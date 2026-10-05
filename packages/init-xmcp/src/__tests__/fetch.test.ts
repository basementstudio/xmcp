import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detectFramework } from "../helpers/detect-framework.js";
import {
  createFetchRoute,
  detectFetchCloudflare,
  getFetchRoute,
} from "../helpers/create-fetch-route.js";
import { updatePackageJson } from "../helpers/update-package.js";

for (const framework of [
  "hono",
  "sveltekit",
  "nuxt",
  "react-router",
  "astro",
] as const) {
  describe(`${framework} initialization`, () => {
    let root: string;
    const dependency = {
      hono: "hono",
      sveltekit: "@sveltejs/kit",
      nuxt: "nuxt",
      "react-router": "@react-router/dev",
      astro: "astro",
    }[framework];
    const directory = {
      hono: "src/routes",
      sveltekit: "src/routes/mcp",
      nuxt: "server/routes",
      "react-router": "app/routes",
      astro: "src/pages",
    }[framework];
    const customDirectory =
      framework === "astro"
        ? "custom/pages/api"
        : framework === "nuxt"
          ? "custom/routes/api"
          : "custom/routes/api/mcp";
    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), `xmcp-${framework}-`));
    });
    afterEach(() => fs.removeSync(root));

    function fixture(extraDependencies = {}) {
      fs.writeJsonSync(path.join(root, "package.json"), {
        dependencies: { [dependency]: "*", ...extraDependencies },
        devDependencies: { typescript: "*" },
        scripts: {
          dev: "host dev",
          build: "host build",
          deploy: "host deploy",
        },
      });
      fs.writeJsonSync(path.join(root, "tsconfig.json"), {
        extends: "./host-generated/tsconfig.json",
        compilerOptions: { paths: { "$lib/*": ["src/lib/*"] } },
      });
      const bin = path.join(root, "bin");
      fs.ensureDirSync(bin);
      fs.writeFileSync(path.join(bin, "npm"), "#!/bin/sh\nexit 0\n", {
        mode: 0o755,
      });
    }

    function cli(...args: string[]) {
      return spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL("../index.js", import.meta.url)),
          "--yes",
          "--package-manager",
          "npm",
          ...args,
        ],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${path.join(root, "bin")}${path.delimiter}${process.env.PATH}`,
          },
        }
      );
    }

    it("detects dependencies and devDependencies before generic server frameworks", () => {
      for (const section of ["dependencies", "devDependencies"]) {
        fs.writeJsonSync(path.join(root, "package.json"), {
          [section]: {
            [dependency]: "*",
            fastify: "*",
            ...(framework !== "hono" ? { hono: "*" } : {}),
          },
        });
        assert.equal(detectFramework(root), framework);
      }
    });

    it("infers Workers from framework hosting dependencies", () => {
      fixture();
      assert.equal(detectFetchCloudflare(root, framework), false);
      for (const section of ["dependencies", "devDependencies"]) {
        for (const pkg of [
          "@cloudflare/vite-plugin",
          {
            hono: "wrangler",
            sveltekit: "@sveltejs/adapter-cloudflare",
            nuxt: "wrangler",
            "react-router": "@cloudflare/vite-plugin",
            astro: "@astrojs/cloudflare",
          }[framework],
        ]) {
          fs.writeJsonSync(path.join(root, "package.json"), {
            [section]: { [pkg]: "*" },
          });
          assert.equal(detectFetchCloudflare(root, framework), true);
        }
      }
    });

    it("generates default and custom routes with relative imports", () => {
      for (const routeDirectory of [directory, customDirectory]) {
        createFetchRoute(root, framework, routeDirectory);
        const route = getFetchRoute(root, framework, routeDirectory);
        assert.equal(
          path.resolve(path.dirname(route.file), route.adapterImport),
          path.join(root, ".xmcp/adapter/index.js")
        );
        const content = fs.readFileSync(route.file, "utf8");
        if (framework === "hono") {
          assert.match(
            content,
            /mcp.all\("\/", \(c\) => xmcpHandler\(c.req.raw\)\)/
          );
        } else if (framework === "sveltekit") {
          for (const method of ["GET", "POST", "DELETE"])
            assert.ok(
              content.includes(`export const ${method}: RequestHandler`)
            );
          assert.equal(
            route.endpoint,
            routeDirectory === directory ? "/mcp" : "/api/mcp"
          );
        } else if (framework === "nuxt") {
          assert.match(content, /defineEventHandler/);
          assert.match(content, /toWebRequest\(event\)/);
        } else if (framework === "react-router") {
          assert.match(content, /export function loader/);
          assert.match(content, /export function action/);
          assert.doesNotMatch(content, /export default/);
        } else {
          assert.match(content, /export const prerender = false/);
          assert.match(content, /export const ALL: APIRoute/);
        }
      }
    });

    it("preserves existing TypeScript and JavaScript routes", () => {
      const route = getFetchRoute(root, framework, directory);
      for (const file of [route.file, route.file.replace(/\.ts$/, ".js")]) {
        fs.outputFileSync(file, "existing route");
        assert.throws(
          () => createFetchRoute(root, framework, directory),
          /--skip-route/
        );
        assert.equal(fs.readFileSync(file, "utf8"), "existing route");
        fs.removeSync(file);
      }
    });

    it("preserves framework-specific route variants", () => {
      const variants = {
        hono: ".js",
        sveltekit: ".js",
        nuxt: ".post.ts",
        "react-router": ".tsx",
        astro: ".astro",
      };
      const file = getFetchRoute(root, framework, directory).file.replace(
        /\.ts$/,
        variants[framework]
      );
      fs.outputFileSync(file, "existing route");
      assert.throws(
        () => createFetchRoute(root, framework, directory),
        /--skip-route/
      );
      assert.equal(fs.readFileSync(file, "utf8"), "existing route");
    });

    it("prepends adapter builds and preserves host and deployment scripts", () => {
      for (const cloudflare of [false, true]) {
        fixture();
        updatePackageJson(root, { framework, cloudflare });
        const { scripts } = fs.readJsonSync(path.join(root, "package.json"));
        const flag = cloudflare ? " --cf" : "";
        assert.equal(scripts.build, `xmcp build${flag} && host build`);
        assert.equal(
          scripts.dev,
          `xmcp build${flag} && (xmcp dev${flag} & host dev)`
        );
        assert.equal(scripts.deploy, "host deploy");
      }
    });

    it("initializes noninteractively and preserves the host tsconfig", () => {
      fixture();
      const tsconfig = fs.readFileSync(
        path.join(root, "tsconfig.json"),
        "utf8"
      );
      const result = cli();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      if (framework === "nuxt")
        assert.match(result.stdout, /nitro\.externals\.inline/);
      assert.ok(fs.existsSync(getFetchRoute(root, framework, directory).file));
      assert.equal(
        fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"),
        tsconfig
      );
      assert.match(
        fs.readFileSync(path.join(root, "xmcp.config.ts"), "utf8"),
        new RegExp(`adapter: "${framework}"`)
      );
      for (const folder of ["tools", "prompts", "resources"])
        assert.ok(fs.existsSync(path.join(root, folder)));
    });

    it("honors custom route directories", () => {
      fixture();
      const result = cli("--route-path", customDirectory);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.ok(
        fs.existsSync(getFetchRoute(root, framework, customDirectory).file)
      );
      if (["sveltekit", "nuxt", "astro"].includes(framework))
        assert.match(
          fs.readFileSync(path.join(root, "xmcp.config.ts"), "utf8"),
          /endpoint: "\/api\/mcp"/
        );
    });

    it("rejects conflicts before installing or changing configuration", () => {
      fixture();
      fs.outputFileSync(
        getFetchRoute(root, framework, directory).file,
        "keep me"
      );
      const result = cli();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /MCP route already exists/);
      assert.equal(fs.existsSync(path.join(root, "xmcp.config.ts")), false);
      assert.equal(
        fs.readJsonSync(path.join(root, "package.json")).scripts.dev,
        "host dev"
      );
    });

    it("honors skip flags and explicit Workers mode", () => {
      fixture();
      const result = cli(
        "--cf",
        "--skip-route",
        "--skip-tools",
        "--skip-prompts",
        "--skip-resources"
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(
        fs.existsSync(getFetchRoute(root, framework, directory).file),
        false
      );
      for (const folder of ["tools", "prompts", "resources"])
        assert.equal(fs.existsSync(path.join(root, folder)), false);
      assert.equal(
        fs.readJsonSync(path.join(root, "package.json")).scripts.build,
        "xmcp build --cf && host build"
      );
    });
  });
}

it("excludes SvelteKit route groups from endpoint metadata", () => {
  assert.equal(
    getFetchRoute("/app", "sveltekit", "src/routes/(api)/mcp").endpoint,
    "/mcp"
  );
});
