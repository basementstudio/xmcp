import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import { FIXTURE_TIMEOUT_MS } from "../harness/constants.js";
import { createFixture } from "../harness/fixture.js";
import type { Target } from "../harness/target.js";
import { startHttpTarget } from "../harness/targets/http.js";
import { startStdioTarget } from "../harness/targets/stdio.js";

for (const kind of ["http", "stdio"] as const) {
  test(
    `Upstash quota middleware shares decisions across ${kind} processes`,
    { timeout: FIXTURE_TIMEOUT_MS },
    async (context) => {
      // A deterministic external quota service tests the plugin contract without
      // credentials. It does not substitute for testing Upstash's Redis algorithms.
      const used = new Map<string, number>();
      const backend = createServer(async (request, response) => {
        let body = "";
        for await (const chunk of request) body += chunk;
        const { key, rate } = JSON.parse(body) as { key: string; rate: number };
        const total = (used.get(key) ?? 0) + rate;
        used.set(key, total);
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            success: total <= 2,
            limit: 2,
            remaining: Math.max(0, 2 - total),
            reset: Date.now() + 60_000,
          })
        );
      });
      backend.listen(0, "127.0.0.1");
      await once(backend, "listening");
      const url = `http://127.0.0.1:${(backend.address() as AddressInfo).port}`;
      context.after(async () => {
        backend.closeAllConnections();
        await new Promise<void>((resolve, reject) =>
          backend.close((error) => (error ? reject(error) : resolve()))
        );
      });
      const fixture = await createFixture({
        kind,
        moduleType: "module",
        files: {
          "src/middleware.ts": `
          import { upstashRateLimit } from "@xmcp-dev/upstash";
          export const mcp = upstashRateLimit({
            limiter: { limit: async (key, options) => {
              const response = await fetch(${JSON.stringify(url)}, { method: "POST", body: JSON.stringify({ key, rate: options.rate }) });
              return { ...await response.json(), pending: Promise.resolve() };
            } },
            // Fixed server-side identity is sufficient for this transport test.
            identifier: () => "customer-a",
          });`,
        },
      });
      const targets: Target[] = [];
      let passed = false;
      context.after(async () => {
        for (const target of targets) await target.close();
        if (passed) await fixture.dispose();
        else
          context.diagnostic(`Retained failed fixture: ${fixture.directory}`);
      });
      for (const mode of ["auto", "legacy"] as const) {
        used.clear();
        const start = kind === "http" ? startHttpTarget : startStdioTarget;
        const first = await start(fixture, mode);
        const second = await start(fixture, mode);
        targets.push(first, second);
        const errors: Error[] = [];
        first.client.onerror = second.client.onerror = (error) =>
          errors.push(error);
        await first.client.listTools({}, REQUEST_OPTIONS);
        await first.client.getPrompt(
          { name: "greet", arguments: { name: "Ada" } },
          REQUEST_OPTIONS
        );
        await first.client.readResource(
          { uri: "fixture://info" },
          REQUEST_OPTIONS
        );
        assert.equal(used.size, 0, "non-tool operations do not consume quota");
        const call = (target: Target) =>
          target.client.callTool(
            { name: "add", arguments: { a: 2, b: 3 } },
            REQUEST_OPTIONS
          );
        for (const target of [first, second])
          assert.deepEqual((await call(target)).structuredContent, { sum: 5 });
        const denied = await call(second);
        assert.equal(denied.isError, true);
        assert.equal(
          denied.structuredContent,
          undefined,
          "tool was not executed"
        );
        assert.equal(
          (denied._meta?.["xmcp.dev/rateLimit"] as { reason: string }).reason,
          "limit"
        );
        assert.deepEqual(
          errors,
          [],
          "transport remains valid, including STDIO stdout"
        );
        await first.close();
        await second.close();
        targets.splice(0);
      }
      passed = true;
    }
  );
}
