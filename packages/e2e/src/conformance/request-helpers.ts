import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "request-helpers",
    "routes progress and isolates values between concurrent calls",
    async ({ client }) => {
      await Promise.all(
        ["first", "second"].map(async (label) => {
          const updates: { progress: number; total?: number }[] = [];
          const result = await client.callTool(
            { name: "request-helpers", arguments: { label } },
            {
              ...REQUEST_OPTIONS,
              onprogress: ({ progress, total }) => {
                updates.push({ progress, total });
              },
            }
          );
          assert.notEqual(result.isError, true);
          assert.deepEqual(result.structuredContent, { previous: null, label });
          assert.deepEqual(updates, [
            { progress: 0, total: 2 },
            { progress: 1, total: 2 },
            { progress: 2, total: 2 },
          ]);
        })
      );
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
