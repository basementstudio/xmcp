import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "openapi-import",
    "calls a compiled OpenAPI tool with encoded path and query inputs",
    async ({ client }) => {
      const { tools } = await client.listTools({}, REQUEST_OPTIONS);
      const imported = tools.find((tool) => tool.name === "import-user");
      assert.ok(imported);
      assert.deepEqual(imported.inputSchema.required, ["id"]);
      assert.equal(imported.annotations?.readOnlyHint, true);
      assert.ok(!tools.some((tool) => tool.name === "not-imported"));
      const result = await client.callTool(
        {
          name: "import-user",
          arguments: {
            id: "a/b ?#%é",
            q: "hello &/雪",
            page: 0,
            active: false,
            tags: ["a,b", "x/y"],
            labels: ["one", "two three"],
          },
        },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      assert.ok(result.content[0]?.type === "text");
      assert.deepEqual(JSON.parse(result.content[0].text), {
        method: "GET",
        path: "/v1/users/a%2Fb%20%3F%23%25%C3%A9",
        query:
          "?q=hello%20%26%2F%E9%9B%AA&page=0&active=false&tags=a%2Cb,x%2Fy&labels=one&labels=two%20three",
      });
      const omitted = await client.callTool(
        { name: "import-user", arguments: { id: "only" } },
        REQUEST_OPTIONS
      );
      assert.ok(omitted.content[0]?.type === "text");
      assert.deepEqual(JSON.parse(omitted.content[0].text), {
        method: "GET",
        path: "/v1/users/only",
        query: "",
      });
    }
  );
  whenSupported(
    "openapi-import",
    "reports upstream errors and rejects path traversal values",
    async ({ client }) => {
      const failed = await client.callTool(
        { name: "import-user", arguments: { id: "failure", status: 503 } },
        REQUEST_OPTIONS
      );
      assert.equal(failed.isError, true);
      assert.ok(failed.content[0]?.type === "text");
      assert.match(failed.content[0].text, /HTTP 503/);
      for (const id of [".", ".."]) {
        const traversal = await client.callTool(
          { name: "import-user", arguments: { id } },
          REQUEST_OPTIONS
        );
        assert.equal(traversal.isError, true);
        assert.ok(traversal.content[0]?.type === "text");
        assert.match(traversal.content[0].text, /dot segments/);
      }
    }
  );
}
