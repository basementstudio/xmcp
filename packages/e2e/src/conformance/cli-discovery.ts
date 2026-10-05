import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";
import { runDeveloperCli } from "../harness/developer-cli.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "cli-discovery",
    "inspects and lists a server through the built developer CLI",
    async (target) => {
      const args = target.url
        ? [target.url]
        : [
            "--stdio",
            process.execPath,
            join(target.fixture.directory, "dist/stdio.js"),
          ];
      const inspect = await runDeveloperCli(
        ["inspect", "--json", ...args],
        target.fixture.directory,
        `cli-inspect-${target.mode}`
      );
      assert.equal(inspect.code, 0, inspect.stderr);
      const details = JSON.parse(inspect.stdout);
      assert.ok(details.serverInfo.name);
      assert.ok(details.capabilities.tools);
      assert.equal(details.protocolVersion, "2026-07-28");

      const listed = await runDeveloperCli(
        ["list", "--json", ...args],
        target.fixture.directory,
        `cli-list-${target.mode}`
      );
      assert.equal(listed.code, 0, listed.stderr);
      const catalog = JSON.parse(listed.stdout);
      assert.ok(
        catalog.tools.some((tool: { name: string }) => tool.name === "add")
      );
      assert.ok(
        catalog.prompts.some(
          (prompt: { name: string }) => prompt.name === "greet"
        )
      );
      assert.ok(
        catalog.resources.some(
          (resource: { name: string }) => resource.name === "info"
        )
      );
      assert.ok(
        catalog.resourceTemplates.some(
          (resource: { name: string }) => resource.name === "user"
        )
      );
      assert.ok(
        catalog.tools.find((tool: { name: string }) => tool.name === "add")
          .inputSchema.properties.a
      );

      const definition = target.url
        ? { url: target.url }
        : {
            command: process.execPath,
            args: [join(target.fixture.directory, "dist/stdio.js")],
            env: { XMCP_TELEMETRY_DISABLED: "true" },
          };
      const configPath = join(
        target.fixture.directory,
        `cli-clients-${target.mode}.ts`
      );
      await writeFile(
        configPath,
        `console.log("client config loaded");\nexport const clients = { local: ${JSON.stringify(definition)} };\n`
      );
      const named = await runDeveloperCli(
        ["list", "local", "--json", "--clients", configPath],
        target.fixture.directory,
        `cli-named-${target.mode}`
      );
      assert.equal(named.code, 0, named.stderr);
      assert.match(named.stderr, /client config loaded/);
      assert.deepEqual(JSON.parse(named.stdout), catalog);
    }
  );
}
