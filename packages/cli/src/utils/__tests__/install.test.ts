import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import {
  createInstallEntry,
  defaultClientConfig,
  runInstall,
} from "../../commands/install.js";
import { updateMcpConfig } from "../install-config.js";
import { parseInstallOptions } from "../install-options.js";

const entry = {
  command: "node",
  args: ["/server/stdio.js", "${ARG}"],
  env: { TOKEN: "${TOKEN}" },
};
const writeOptions = { dryRun: false, replace: false };
async function directory(context: TestContext) {
  const path = await fs.mkdtemp(join(tmpdir(), "xmcp-install-"));
  context.after(() => fs.rm(path, { recursive: true, force: true }));
  return path;
}

test("merges one entry without changing unrelated settings; repeats are byte-identical", async (context) => {
  const path = join(await directory(context), "mcp.json");
  const original = {
    preferences: { theme: "dark" },
    mcpServers: { other: { url: "https://other.test/mcp", custom: true } },
  };
  await fs.writeFile(path, JSON.stringify(original), { mode: 0o640 });
  const result = await updateMcpConfig(path, "local", entry, writeOptions);
  assert.equal(result.changed, true);
  assert.deepEqual(JSON.parse(await fs.readFile(path, "utf8")), {
    ...original,
    mcpServers: { ...original.mcpServers, local: entry },
  });
  const written = await fs.readFile(path, "utf8");
  const before = await fs.stat(path);
  // Object key order has no effect on idempotence.
  const repeated = await updateMcpConfig(
    path,
    "local",
    { env: entry.env, args: entry.args, command: entry.command },
    writeOptions
  );
  assert.equal(repeated.changed, false);
  assert.equal(await fs.readFile(path, "utf8"), written);
  assert.equal((await fs.stat(path)).mtimeMs, before.mtimeMs);
  if (process.platform !== "win32") assert.equal(before.mode & 0o777, 0o640);
});

test("conflicts require --replace even for dry runs, and replacement affects only that name", async (context) => {
  const path = join(await directory(context), "mcp.json");
  const original =
    '{"extra":42,"mcpServers":{"local":{"command":"old"},"other":{"url":"https://example.test"}}}';
  await fs.writeFile(path, original);
  for (const dryRun of [false, true])
    await assert.rejects(
      updateMcpConfig(path, "local", entry, { dryRun, replace: false }),
      /--replace/
    );
  assert.equal(await fs.readFile(path, "utf8"), original);
  const preview = await updateMcpConfig(path, "local", entry, {
    dryRun: true,
    replace: true,
  });
  assert.equal(await fs.readFile(path, "utf8"), original);
  const updated = await updateMcpConfig(path, "local", entry, {
    dryRun: false,
    replace: true,
  });
  assert.deepEqual(updated.config, preview.config);
  assert.equal(updated.config.extra, 42);
  assert.deepEqual(updated.config.mcpServers.other, {
    url: "https://example.test",
  });
});

test("dry-run creates no directories; new config is private and contains literal references", async (context) => {
  const root = await directory(context);
  const path = join(root, "nested", "mcp.json");
  const preview = await updateMcpConfig(path, "local", entry, {
    ...writeOptions,
    dryRun: true,
  });
  assert.deepEqual(await fs.readdir(root), []);
  const result = await updateMcpConfig(path, "local", entry, writeOptions);
  assert.deepEqual(result.config, preview.config);
  assert.equal(
    JSON.parse(await fs.readFile(path, "utf8")).mcpServers.local.env.TOKEN,
    "${TOKEN}"
  );
  if (process.platform !== "win32")
    assert.equal((await fs.stat(path)).mode & 0o777, 0o600);
  assert.deepEqual(await fs.readdir(join(root, "nested")), ["mcp.json"]);
});

test("invalid existing config is never overwritten, even with --replace", async (context) => {
  const path = join(await directory(context), "mcp.json");
  for (const original of [
    "",
    "{",
    "null",
    "[]",
    '{"mcpServers":null}',
    '{"mcpServers":[]}',
  ]) {
    await fs.writeFile(path, original);
    await assert.rejects(
      updateMcpConfig(path, "local", entry, { ...writeOptions, replace: true }),
      /JSON/
    );
    assert.equal(await fs.readFile(path, "utf8"), original);
  }
});

test("atomic replacement leaves the old file intact on rename failure and removes the temp file", async (context) => {
  const root = await directory(context);
  const path = join(root, "mcp.json");
  const original = '{"keep":true}';
  await fs.writeFile(path, original);
  context.mock.method(
    fs,
    "rename",
    async (temporary: string, destination: string) => {
      assert.equal(destination, await fs.realpath(path));
      assert.equal(await fs.readFile(path, "utf8"), original);
      assert.deepEqual(JSON.parse(await fs.readFile(temporary, "utf8")), {
        keep: true,
        mcpServers: { local: entry },
      });
      throw new Error("simulated rename failure");
    }
  );
  await assert.rejects(
    updateMcpConfig(path, "local", entry, writeOptions),
    /simulated rename failure/
  );
  assert.equal(await fs.readFile(path, "utf8"), original);
  assert.deepEqual(await fs.readdir(root), ["mcp.json"]);
});

test("preserves existing config symlinks and handles special JSON keys without prototype mutation", async (context) => {
  if (process.platform === "win32")
    return context.skip(
      "Creating symlinks requires Windows developer permissions"
    );
  const root = await directory(context);
  const real = join(root, "real.json");
  const link = join(root, "mcp.json");
  await fs.writeFile(real, '{"mcpServers":{}}');
  await fs.symlink(real, link);
  await updateMcpConfig(link, "__proto__", entry, writeOptions);
  assert.equal((await fs.lstat(link)).isSymbolicLink(), true);
  const parsed = JSON.parse(await fs.readFile(real, "utf8"));
  assert.equal(Object.hasOwn(parsed.mcpServers, "__proto__"), true);
  assert.equal(Object.getPrototypeOf(parsed.mcpServers), Object.prototype);
  const dangling = join(root, "dangling.json");
  await fs.symlink(join(root, "missing.json"), dangling);
  await assert.rejects(
    updateMcpConfig(dangling, "local", entry, writeOptions),
    /Cannot read config target/
  );
  assert.equal((await fs.lstat(dangling)).isSymbolicLink(), true);
});

test("default paths follow the selected client's OS conventions", () => {
  assert.equal(
    defaultClientConfig("cursor", "linux", "/home/alice"),
    "/home/alice/.cursor/mcp.json"
  );
  assert.equal(
    defaultClientConfig("cursor", "darwin", "/Users/alice"),
    "/Users/alice/.cursor/mcp.json"
  );
  assert.equal(
    defaultClientConfig("cursor", "win32", "C:\\Users\\alice"),
    "C:\\Users\\alice\\.cursor\\mcp.json"
  );
  assert.equal(
    defaultClientConfig("claude-desktop", "darwin", "/Users/alice"),
    "/Users/alice/Library/Application Support/Claude/claude_desktop_config.json"
  );
  assert.equal(
    defaultClientConfig(
      "claude-desktop",
      "win32",
      "C:\\Users\\alice",
      "D:\\AppData"
    ),
    "D:\\AppData\\Claude\\claude_desktop_config.json"
  );
  assert.throws(
    () => defaultClientConfig("claude-desktop", "linux", "/home/alice"),
    /--config/
  );
  assert.throws(
    () =>
      defaultClientConfig("claude-desktop", "win32", "C:\\Users\\alice", ""),
    /--config/
  );
});

test("entry conversion keeps placeholders literal and does not capture environment values", () => {
  const definition = {
    type: "http" as const,
    name: "remote",
    url: "https://${env:HOST}:${env:PORT}/mcp/${PATH}",
    headers: [
      { name: "Authorization", env: "TOKEN" },
      { name: "Literal", value: "Bearer ${TOKEN}" },
    ],
  };
  assert.deepEqual(createInstallEntry(definition), {
    url: definition.url,
    headers: { Authorization: "${TOKEN}", Literal: "Bearer ${TOKEN}" },
  });
  assert.deepEqual(createInstallEntry(definition, "cursor"), {
    url: definition.url,
    headers: { Authorization: "${env:TOKEN}", Literal: "Bearer ${TOKEN}" },
  });
  assert.deepEqual(
    createInstallEntry({ type: "stdio", name: "local", ...entry }),
    entry
  );
  assert.throws(
    () => createInstallEntry(definition, "claude-desktop"),
    /STDIO/
  );
  assert.throws(
    () =>
      createInstallEntry(
        { type: "stdio", name: "local", ...entry, cwd: "/project" },
        "claude-desktop"
      ),
    /cwd/
  );
});

test("parsing distinguishes source clients from destination config and leaves subprocess args intact", () => {
  const options = parseInstallOptions([
    "--name",
    "local",
    "--client",
    "cursor",
    "--config",
    "mcp.json",
    "--dry-run",
    "--replace",
    "--stdio",
    "node",
    "server.js",
    "--client",
    "child",
    "${TOKEN}",
  ]);
  assert.equal(options.name, "local");
  assert.equal(options.client, "cursor");
  assert.equal(options.config, "mcp.json");
  assert.ok(options.dryRun && options.replace);
  assert.deepEqual(options.stdio, {
    command: "node",
    args: ["server.js", "--client", "child", "${TOKEN}"],
  });
  assert.equal(
    parseInstallOptions([
      "local",
      "--clients",
      "input.ts",
      "--config",
      "output.json",
    ]).clientsFile,
    "input.ts"
  );
  assert.ok(parseInstallOptions(["--help"]).help);
  for (const args of [
    ["local", "--client", "unknown"],
    ["local", "--config"],
    ["local", "--name", ""],
    ["local", "--typo"],
  ])
    assert.throws(() => parseInstallOptions(args));
});

test("generic output and explicit destination work without connecting or launching a server", async (context) => {
  const generic = await runInstall(
    parseInstallOptions(["https://example.test/mcp/${TOKEN}"])
  );
  assert.deepEqual(generic.config, {
    mcpServers: {
      "example.test": { url: "https://example.test/mcp/${TOKEN}" },
    },
  });
  assert.equal(generic.path, undefined);
  const path = join(await directory(context), "custom.json");
  const result = await runInstall(
    parseInstallOptions([
      "--client",
      "claude-desktop",
      "--config",
      path,
      "--name",
      "local",
      "--stdio",
      "not-an-installed-command",
      "${ARG}",
    ])
  );
  assert.deepEqual(result.config, {
    mcpServers: {
      local: { command: "not-an-installed-command", args: ["${ARG}"] },
    },
  });
});
