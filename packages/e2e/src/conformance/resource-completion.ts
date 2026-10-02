import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "resource-completion",
    "completes resource variables with prefixes, context, and the MCP result cap",
    async ({ client }) => {
      const { resourceTemplates } = await client.listResourceTemplates(
        {},
        REQUEST_OPTIONS
      );
      const template = resourceTemplates.find(
        (item) => item.name === "completion-members"
      );
      assert.equal(template?.uriTemplate, "team://members/{department}/{name}");
      const ref = { type: "ref/resource" as const, uri: template!.uriTemplate };
      const department = await client.complete(
        { ref, argument: { name: "department", value: "e" } },
        REQUEST_OPTIONS
      );
      assert.deepEqual(department.completion, {
        values: ["engineering"],
        total: 1,
        hasMore: false,
      });
      const names = await client.complete(
        {
          ref,
          argument: { name: "name", value: "A" },
          context: { arguments: { department: "engineering" } },
        },
        REQUEST_OPTIONS
      );
      assert.deepEqual(names.completion.values, ["Ada", "Alan"]);
      for (const name of ["unknown", "toString"]) {
        const result = await client.complete(
          { ref, argument: { name, value: "" } },
          REQUEST_OPTIONS
        );
        assert.deepEqual(result.completion.values, []);
      }
      const bulk = await client.complete(
        { ref, argument: { name: "name", value: "bulk" } },
        REQUEST_OPTIONS
      );
      assert.deepEqual(bulk.completion, {
        values: Array.from({ length: 100 }, (_, index) => "user-" + index),
        total: 105,
        hasMore: true,
      });
      const read = await client.readResource(
        { uri: "team://members/engineering/Ada" },
        REQUEST_OPTIONS
      );
      assert.ok("text" in read.contents[0]);
      assert.equal(read.contents[0].text, "engineering:Ada");
    }
  );
  whenSupported(
    "resource-completion",
    "keeps prompt completable callbacks working alongside resource completion",
    async ({ client }) => {
      const result = await client.complete(
        {
          ref: { type: "ref/prompt", name: "resource-completion" },
          argument: { name: "name", value: "Ad" },
        },
        REQUEST_OPTIONS
      );
      assert.deepEqual(result.completion, {
        values: ["Ada"],
        total: 1,
        hasMore: false,
      });
    }
  );
}
