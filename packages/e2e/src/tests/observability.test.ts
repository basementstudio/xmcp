import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

import { REQUEST_OPTIONS } from "../harness/client-options.js";
import { FIXTURE_TIMEOUT_MS } from "../harness/constants.js";
import { createFixture } from "../harness/fixture.js";
import type { Target } from "../harness/target.js";
import { startHttpTarget } from "../harness/targets/http.js";
import { startStdioTarget } from "../harness/targets/stdio.js";

for (const kind of ["http", "stdio"] as const) {
  for (const moduleType of ["commonjs", "module"] as const) {
    for (const enabled of [false, true]) {
      test(
        `execution logging ${enabled ? "enabled" : "disabled"}: ${kind}/${moduleType}`,
        { timeout: FIXTURE_TIMEOUT_MS },
        async (context) => {
          const fixture = await createFixture({
            kind,
            moduleType,
            configFragment: `observability: { enabled: ${enabled} },`,
            files: {
              "src/tools/log-throw.ts": `export default function logThrow() { throw new Error("private-error-token"); }`,
            },
          });
          let target: Target | undefined;
          let passed = false;
          context.after(async () => {
            await target?.close();
            if (passed) await fixture.dispose();
            else
              context.diagnostic(
                `Retained failed fixture: ${fixture.directory}`
              );
          });
          for (const mode of ["auto", "legacy"] as const) {
            target = await (
              kind === "http" ? startHttpTarget : startStdioTarget
            )(fixture, mode);
            const clientErrors: Error[] = [];
            target.client.onerror = (error) => clientErrors.push(error);
            const listed = await target.client.listTools({}, REQUEST_OPTIONS);
            assert.ok(listed.tools.some((tool) => tool.name === "add"));
            const result = await target.client.callTool(
              { name: "add", arguments: { a: 2, b: 3 } },
              REQUEST_OPTIONS
            );
            assert.deepEqual(result.structuredContent, { sum: 5 });
            await target.client.getPrompt(
              { name: "greet", arguments: { name: "private-input-name" } },
              REQUEST_OPTIONS
            );
            await target.client.readResource(
              { uri: "fixture://info" },
              REQUEST_OPTIONS
            );
            await target.client.readResource(
              { uri: "fixture://users/private-user-id" },
              REQUEST_OPTIONS
            );
            for (const name of ["fail", "log-throw", "middleware-denied"]) {
              const failure = await target.client.callTool(
                { name },
                REQUEST_OPTIONS
              );
              assert.equal(failure.isError, true);
            }
            const multiRound = mode === "auto" || kind === "stdio";
            if (multiRound) {
              const confirmation = await target.client.callTool(
                { name: "confirm" },
                REQUEST_OPTIONS
              );
              assert.deepEqual(confirmation.content, [
                { type: "text", text: "confirmed" },
              ]);
            }
            await target.close();
            target = undefined;
            assert.deepEqual(
              clientErrors,
              [],
              "STDIO must contain only valid MCP messages"
            );
            const text = await readFile(
              join(fixture.directory, `server-${mode}.log`),
              "utf8"
            ).catch((error: NodeJS.ErrnoException) => {
              if (!enabled && error.code === "ENOENT") return "";
              throw error;
            });
            const lines = text
              .split("\n")
              .filter((line) => line.startsWith('{"@timestamp":'));
            if (!enabled) {
              assert.deepEqual(lines, []);
              continue;
            }
            const events = lines.map((line) => JSON.parse(line));
            const end = events.filter(
              (event) => event.event.action === "execution.end"
            );
            assert.equal(end.length, 7 + (multiRound ? 2 : 0));
            assert.equal(events.length, end.length * 2);
            for (const event of end) {
              const pair = events.filter(
                (candidate) => candidate.transaction.id === event.transaction.id
              );
              assert.equal(pair.length, 2);
              assert.equal(pair[0].event.action, "execution.start");
              assert.equal(pair[1].event.action, "execution.end");
              assert.ok(event.event.duration >= 0);
            }
            for (const name of ["fail", "log-throw", "middleware-denied"]) {
              assert.equal(
                end.find((event) => event.xmcp.component === name)?.xmcp.status,
                "failure"
              );
            }
            assert.ok(
              end.some(
                (event) =>
                  event.xmcp.component === "user" &&
                  event.xmcp.status === "success"
              )
            );
            if (multiRound) {
              assert.deepEqual(
                end
                  .filter((event) => event.xmcp.component === "confirm")
                  .map((event) => event.xmcp.status),
                ["input_required", "success"]
              );
            }
            assert.doesNotMatch(
              lines.join("\n"),
              /private-|arguments|structuredContent/
            );
          }
          passed = true;
        }
      );
    }
  }
}
