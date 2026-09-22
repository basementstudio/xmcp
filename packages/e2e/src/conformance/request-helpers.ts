import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import { startStdioTarget } from "../harness/targets/stdio.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "request-helpers",
    "routes progress and isolates values between concurrent calls",
    async (target) => {
      // The SDK defers notification callbacks but clears onprogress handlers
      // synchronously on a result. STDIO can deliver both in one read, so use
      // explicit tokens and a dedicated notification handler for that transport.
      // A separate client keeps the shared target's SDK handlers untouched.
      const progressTarget =
        target.fixture.spec.kind === "stdio"
          ? await startStdioTarget(target.fixture, target.mode)
          : undefined;
      const client = progressTarget?.client ?? target.client;
      const received = new Map<
        string | number,
        { progress: number; total?: number }[]
      >();
      if (progressTarget) {
        client.setNotificationHandler(
          "notifications/progress",
          ({ params }) => {
            const { progressToken, progress, total } = params;
            received.get(progressToken)?.push({ progress, total });
          }
        );
      }
      try {
        await Promise.all(
          ["first", "second"].map(async (label) => {
            const updates: { progress: number; total?: number }[] = [];
            received.set(label, updates);
            const result = await client.callTool(
              {
                name: "request-helpers",
                arguments: { label },
                ...(progressTarget ? { _meta: { progressToken: label } } : {}),
              },
              {
                ...REQUEST_OPTIONS,
                onprogress: progressTarget
                  ? undefined
                  : ({ progress, total }) => {
                      updates.push({ progress, total });
                    },
              }
            );
            assert.notEqual(result.isError, true);
            assert.deepEqual(result.structuredContent, {
              previous: null,
              label,
            });
            assert.deepEqual(updates, [
              { progress: 0, total: 2 },
              { progress: 1, total: 2 },
              { progress: 2, total: 2 },
            ]);
          })
        );
      } finally {
        await progressTarget?.close();
      }
    }
  );
  whenSupported(
    "request-helpers",
    "works without progress opt-in and starts with fresh local values",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "request-helpers", arguments: { label: "without-token" } },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      assert.deepEqual(result.structuredContent, {
        previous: null,
        label: "without-token",
      });
    }
  );
}
