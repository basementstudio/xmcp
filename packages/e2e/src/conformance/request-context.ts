import assert from "node:assert/strict";
import { CLIENT_INFO, REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "request-context",
    "exposes an immutable context with the current transport and signal",
    async ({ client, fixture }) => {
      const result = await client.callTool(
        { name: "request-context", arguments: {} },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      const context = result.structuredContent as Record<string, unknown>;
      assert.ok(context);
      assert.deepEqual(context.clientInfo, CLIENT_INFO);
      assert.equal(context.aborted, false);
      assert.equal(context.sameSignal, true);
      assert.equal(context.sameContext, true);
      assert.equal(context.frozen, true);
      if (fixture.spec.kind === "stdio") {
        assert.equal(context.http, null);
      } else {
        const http = context.http as {
          id: string;
          headers: Record<string, unknown>;
        };
        assert.equal(typeof http.id, "string");
        assert.ok(http.id.length > 0);
        assert.equal(http.headers["x-mcp-client-name"], CLIENT_INFO.name);
        assert.equal(http.headers["x-mcp-client-version"], CLIENT_INFO.version);
      }
    }
  );
}
