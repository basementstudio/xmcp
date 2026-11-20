import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  detectPackageManager,
  planUpgrade,
  runUpgrade,
  scanProject,
} from "../upgrade";

function createProject(files: Record<string, string>): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-upgrade-"));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(directory, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return directory;
}

function silenced<T>(run: () => T): T {
  const { log, error } = console;
  console.log = () => {};
  console.error = () => {};
  try {
    return run();
  } finally {
    console.log = log;
    console.error = error;
  }
}

test("upgrades a 0.2.1 create-xmcp-app project", () => {
  const { packageJson, changes } = planUpgrade(
    {
      dependencies: { xmcp: "^0.2.1", zod: "3.24.4" },
      devDependencies: { "swc-loader": "^0.2.6" },
      engines: { node: ">=20.0.0" },
    },
    "1.12.1"
  );

  assert.deepEqual(packageJson.dependencies, {
    xmcp: "^1.12.1",
    zod: "^4.0.0",
  });
  assert.deepEqual(packageJson.devDependencies, {
    "@xmcp-dev/compiler": "^1.12.0",
  });
  assert.equal(packageJson.engines?.node, ">=22.12");
  assert.equal(changes.length, 5);
});

test("upgrades a 0.6.13 project without touching a supported zod", () => {
  const { packageJson, changes } = planUpgrade(
    { dependencies: { xmcp: "0.6.13", zod: "^4.1.0" } },
    "1.12.1"
  );

  assert.equal(packageJson.dependencies?.xmcp, "^1.12.1");
  assert.equal(packageJson.dependencies?.zod, "^4.1.0");
  assert.equal(packageJson.devDependencies?.["@xmcp-dev/compiler"], "^1.12.0");
  assert.equal(changes.length, 2);
});

test("leaves a current project and dist-tags alone", () => {
  const current = planUpgrade(
    {
      dependencies: { xmcp: "^1.12.1", zod: "^4.0.0" },
      devDependencies: { "@xmcp-dev/compiler": "^1.12.0" },
    },
    "1.12.1"
  );
  assert.deepEqual(current.changes, []);

  const tagged = planUpgrade(
    {
      dependencies: { xmcp: "latest", zod: "^4.0.0" },
      devDependencies: { "@xmcp-dev/compiler": "latest" },
    },
    "1.12.1"
  );
  assert.deepEqual(tagged.changes, []);
  assert.equal(tagged.warnings.length, 1);
});

test("pins the compiler to a prerelease target", () => {
  const { packageJson } = planUpgrade(
    { dependencies: { xmcp: "^0.6.13", zod: "^4.0.0" } },
    "1.13.0-canary-20261120"
  );
  assert.equal(packageJson.dependencies?.xmcp, "^1.13.0-canary-20261120");
  assert.equal(
    packageJson.devDependencies?.["@xmcp-dev/compiler"],
    "^1.13.0-canary-20261120"
  );
});

test("rejects a package.json without xmcp", () => {
  assert.throws(
    () => planUpgrade({ dependencies: { zod: "^4.0.0" } }, "1.12.1"),
    /No xmcp dependency/
  );
});

test("reports code changes it does not rewrite", () => {
  const project = createProject({
    "xmcp.config.ts":
      "export default { http: true, webpack: (c) => c, experimental: { oauth: {} } };",
    "src/tools/ask.ts":
      'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\n' +
      "export default async (_: unknown, extra: any) => extra.elicit({});",
    "src/skills/notes.txt": "not a skill",
  });

  const warnings = scanProject(
    project,
    { dependencies: { xmcp: "^1.12.1" } },
    "20.10.0"
  ).join("\n");

  assert.match(warnings, /"webpack" option to "bundler"/);
  assert.match(warnings, /experimental\.oauth/);
  assert.match(warnings, /@modelcontextprotocol\/sdk/);
  assert.match(warnings, /extra\.elicit\(\)/);

  const migrated = createProject({
    "src/tools/ask.ts":
      "export default async () => inputRequired.elicit({ message: 'Name?' });",
  });
  assert.doesNotMatch(
    scanProject(migrated, { dependencies: { xmcp: "^1.12.1" } }).join("\n"),
    /extra\.elicit/
  );
  assert.match(warnings, /src\/skills/);
  assert.match(warnings, /Node\.js 20\.10\.0 is too old/);
  assert.match(warnings, /src\/resources does not exist/);
  assert.match(warnings, /src\/prompts does not exist/);
  assert.doesNotMatch(warnings, /src\/tools does not exist/);
});

test("detects the package manager from the lockfile", () => {
  const manager = (files: Record<string, string>) =>
    detectPackageManager(createProject(files)).packageManager;
  assert.equal(manager({ "pnpm-lock.yaml": "" }), "pnpm");
  assert.equal(manager({ "bun.lock": "" }), "bun");
  assert.equal(manager({ "yarn.lock": "" }), "yarn");
  assert.equal(manager({ "package-lock.json": "" }), "npm");
  assert.equal(manager({}), "npm");
});

test("installs from the workspace root of a monorepo app", () => {
  const root = createProject({
    "pnpm-lock.yaml": "",
    "apps/mcp/package.json": '{"dependencies":{"xmcp":"^0.2.1"}}',
  });
  const app = path.join(root, "apps", "mcp");
  assert.deepEqual(detectPackageManager(app), {
    packageManager: "pnpm",
    installPath: root,
  });

  const corepack = createProject({
    "package.json": '{"packageManager":"yarn@4.5.0"}',
    "apps/mcp/package.json": '{"dependencies":{"xmcp":"^0.2.1"}}',
  });
  assert.deepEqual(detectPackageManager(path.join(corepack, "apps", "mcp")), {
    packageManager: "yarn",
    installPath: corepack,
  });
});

test("writes package.json without installing when asked", () => {
  const original =
    '{\n    "name": "old-app",\n    "dependencies": {\n        "xmcp": "^0.2.1"\n    }\n}\n';
  const project = createProject({ "package.json": original });
  const packageJsonPath = path.join(project, "package.json");

  assert.equal(
    silenced(() => runUpgrade(["--dry-run"], project)),
    0
  );
  assert.equal(fs.readFileSync(packageJsonPath, "utf8"), original);

  assert.equal(
    silenced(() => runUpgrade(["--no-install"], project)),
    0
  );
  const updated = fs.readFileSync(packageJsonPath, "utf8");
  assert.match(updated, /^ {4}"name"/m);
  assert.ok(updated.endsWith("}\n"));
  assert.match(JSON.parse(updated).dependencies.xmcp, /^\^1\./);

  assert.equal(
    silenced(() => runUpgrade(["--bogus"], project)),
    1
  );
});
