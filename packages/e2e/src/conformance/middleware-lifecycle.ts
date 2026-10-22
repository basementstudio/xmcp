import { cancellationProbe } from "../harness/cancellation-probe.js";
import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "middleware-input-required",
    "preserves two elicitation rounds and fresh middleware context on re-entry",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "lifecycle-confirm" },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true, JSON.stringify(result));
      assert.deepEqual(result.structuredContent, {
        confirmed: true,
        state: "lifecycle:finished",
      });
      assert.deepEqual(result._meta?.lifecycleTrace, [
        "outer before",
        "inner before",
        "tool:lifecycle:finished",
        "inner after",
        "outer after",
      ]);
    }
  );
  whenSupported(
    "middleware-cancellation",
    "cancels the handler's original signal and unwinds middleware",
    async ({ client, mode, url }) => {
      const probe = await cancellationProbe();
      const controller = new AbortController();
      const params = {
        name: "lifecycle-cancel",
        arguments: { probeUrl: probe.url },
      };
      // Legacy stateless HTTP cannot route a cancellation notification to a
      // previous request. Close that request's HTTP stream instead. Modern HTTP
      // and both STDIO modes use the SDK client's cancellation mechanism.
      const pending =
        url && mode === "legacy"
          ? fetch(url, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                accept: "application/json, text/event-stream",
                "mcp-protocol-version": "2025-11-25",
              },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: "cancel",
                method: "tools/call",
                params,
              }),
              signal: controller.signal,
            }).then((response) => response.text())
          : client.callTool(params, {
              ...REQUEST_OPTIONS,
              signal: controller.signal,
            });
      // Attach a rejection handler before waiting for server readiness.
      const outcome = pending.then(
        (result) => ({ result }),
        (error: unknown) => ({ error })
      );
      try {
        const started = await Promise.race([
          probe.wait("started"),
          outcome.then((value) => {
            throw new Error(
              "Tool finished before cancellation: " + JSON.stringify(value)
            );
          }),
        ]);
        assert.deepEqual(started, { sameSignal: true, aborted: false });
        controller.abort(new Error("cancelled by conformance"));
        const result = await outcome;
        assert.ok("error" in result && result.error instanceof Error);
        assert.match(result.error.message, /cancelled by conformance|aborted/i);
        assert.deepEqual(await probe.wait("handler-aborted"), {
          sameSignal: true,
          aborted: true,
          contextAborted: true,
        });
        assert.deepEqual(await probe.wait("middleware-finished"), {
          sameSignal: true,
          aborted: true,
        });
      } finally {
        controller.abort();
        await probe.close();
      }
    }
  );
}
