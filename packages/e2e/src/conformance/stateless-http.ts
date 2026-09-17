import assert from "node:assert/strict";
import { REQUEST_TIMEOUT_MS } from "../harness/constants.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "stateless-http",
    "handles independent requests without a session or cached client metadata",
    async ({ url }) => {
      // Use the legacy wire directly so each request's identity is explicit.
      // These requests deliberately have no initialize handshake or session ID.
      for (const name of ["first-request", "second-request", undefined]) {
        const response = await fetch(url!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            "MCP-Protocol-Version": "2025-11-25",
            ...(name
              ? { "x-mcp-client-name": name, "x-mcp-client-version": "1.0.0" }
              : {}),
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: "client-info", arguments: {} },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("mcp-session-id"), null);
        const body = await response.text();
        const payload = response.headers
          .get("content-type")
          ?.includes("text/event-stream")
          ? body
              .split("\n")
              .filter((line) => line.startsWith("data: "))
              .map((line) => JSON.parse(line.slice(6)))
              .find((message) => message.id === 1)
          : JSON.parse(body);
        assert.deepEqual(
          payload?.result?.structuredContent?.clientInfo,
          name ? { name, version: "1.0.0" } : null
        );
      }
    }
  );
}
