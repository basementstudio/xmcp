import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import type { StdioClientConnection } from "xmcp";
import {
  prepareClientTarget,
  type ClientTarget,
} from "../harness/client-target.js";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import { FIXTURE_TIMEOUT_MS } from "../harness/constants.js";
import { createFixture } from "../harness/fixture.js";

// The bundled CommonJS entry does not expose synthetic ESM named exports.
const { createHTTPClient, createSTDIOClient, disconnectSTDIOClient } =
  createRequire(import.meta.url)("xmcp") as typeof import("xmcp");

for (const kind of ["http", "stdio"] as const) {
  for (const moduleType of ["commonjs", "module"] as const) {
    test(
      `xmcp client connects and calls tools over ${kind}/${moduleType}`,
      { timeout: FIXTURE_TIMEOUT_MS },
      async (context) => {
        const fixture = await createFixture({ kind, moduleType });
        let target: ClientTarget | undefined;
        let client: Awaited<ReturnType<typeof createHTTPClient>> | undefined;
        let connection: StdioClientConnection | undefined;
        let passed = false;
        context.after(async () => {
          try {
            if (connection) await disconnectSTDIOClient(connection);
            else await client?.close();
          } finally {
            try {
              if (target?.type === "http") await target.close();
            } finally {
              if (passed) await fixture.dispose();
              else
                context.diagnostic(
                  `Retained failed fixture: ${fixture.directory}`
                );
            }
          }
        });
        target = await prepareClientTarget(fixture);
        if (target.type === "http") {
          client = await createHTTPClient({ url: target.url });
        } else {
          connection = await createSTDIOClient({
            ...target.parameters,
            onStderrData: target.onStderrData,
          });
          client = connection.client;
        }
        const { tools } = await client.listTools({}, REQUEST_OPTIONS);
        assert.ok(tools.some((tool) => tool.name === "add"));
        const result = await client.callTool(
          { name: "add", arguments: { a: 2, b: 3 } },
          REQUEST_OPTIONS
        );
        assert.notEqual(result.isError, true);
        assert.deepEqual(result.structuredContent, { sum: 5 });
        passed = true;
      }
    );
  }
}
