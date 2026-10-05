import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "input-required",
    "fulfils a tool input request",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "confirm", arguments: {} },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true, JSON.stringify(result));
      assert.deepEqual(result.content, [{ type: "text", text: "confirmed" }]);
    }
  );
}
