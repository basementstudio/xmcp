import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { withClient, type ClientDefinition } from "xmcp/client";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";
import { runDeveloperCli } from "../harness/developer-cli.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "cli-install",
    "installs a config entry that connects to the fixture",
    async (target) => {
      const directory = target.fixture.directory;
      const destination = join(directory, `installed-${target.mode}.json`);
      const original = {
        preferences: { keep: true },
        mcpServers: { other: { url: "https://other.test/mcp" } },
      };
      await writeFile(destination, JSON.stringify(original));
      const connection = target.url
        ? [target.url]
        : ["--stdio", process.execPath, join(directory, "dist/stdio.js")];
      const args = [
        "install",
        "--client",
        target.url ? "cursor" : "claude-desktop",
        "--config",
        destination,
        "--name",
        "fixture",
      ];
      const preview = await runDeveloperCli(
        [...args, "--dry-run", ...connection],
        directory,
        `install-preview-${target.mode}`
      );
      assert.equal(preview.code, 0, preview.stderr);
      assert.deepEqual(
        JSON.parse(await readFile(destination, "utf8")),
        original
      );
      const installed = await runDeveloperCli(
        [...args, ...connection],
        directory,
        `install-${target.mode}`
      );
      assert.equal(installed.code, 0, installed.stderr);
      assert.deepEqual(
        JSON.parse(installed.stdout),
        JSON.parse(preview.stdout)
      );
      const config = JSON.parse(await readFile(destination, "utf8"));
      assert.deepEqual(config.preferences, original.preferences);
      assert.deepEqual(config.mcpServers.other, original.mcpServers.other);
      assert.deepEqual(config, JSON.parse(installed.stdout));
      const definition: ClientDefinition = {
        ...config.mcpServers.fixture,
        type: target.url ? "http" : "stdio",
        name: "installed",
      };
      const result = await withClient(
        definition,
        (client) =>
          client.callTool(
            { name: "add", arguments: { a: 2, b: 3 } },
            REQUEST_OPTIONS
          ),
        {
          versionNegotiation: { mode: target.mode },
          connect: REQUEST_OPTIONS,
        }
      );
      assert.deepEqual(result.structuredContent, { sum: 5 });
    }
  );
}
