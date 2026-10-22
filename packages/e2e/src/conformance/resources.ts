import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "resources",
    "lists and reads static resources",
    async ({ client }) => {
      const { resources } = await client.listResources({}, REQUEST_OPTIONS);
      assert.ok(
        resources.some((resource) => resource.uri === "fixture://info")
      );
      const result = await client.readResource(
        { uri: "fixture://info" },
        REQUEST_OPTIONS
      );
      assert.ok(result.contents[0] && "text" in result.contents[0]);
      assert.equal(result.contents[0].text, "fixture information");
    }
  );
}
