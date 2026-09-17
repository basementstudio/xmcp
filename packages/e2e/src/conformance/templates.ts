import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "templates",
    "lists and reads resource templates",
    async ({ client }) => {
      const { resourceTemplates } = await client.listResourceTemplates(
        {},
        REQUEST_OPTIONS
      );
      assert.ok(
        resourceTemplates.some(
          (resource) => resource.uriTemplate === "fixture://users/{id}"
        )
      );
      const result = await client.readResource(
        { uri: "fixture://users/42" },
        REQUEST_OPTIONS
      );
      assert.ok(result.contents[0] && "text" in result.contents[0]);
      assert.equal(result.contents[0].text, "user:42");
    }
  );
}
