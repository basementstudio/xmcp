import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "openapi-request",
    "serializes JSON bodies, raw headers and runtime Authorization independently of URL inputs",
    async ({ client }) => {
      const { tools } = await client.listTools({}, REQUEST_OPTIONS);
      const imported = tools.find((tool) => tool.name === "import-update-user");
      assert.ok(imported);
      assert.equal(imported.annotations?.readOnlyHint, false);
      assert.deepEqual(imported.inputSchema.required, [
        "id",
        "X-Label",
        "body",
      ]);
      assert.ok(
        !Object.hasOwn(imported.inputSchema.properties!, "Authorization")
      );
      const body = {
        name: "a/b &雪",
        active: false,
        count: 0,
        tags: ["a,b", "x/y"],
        extra: { retained: null },
      };
      const args = {
        id: "a/b",
        q: "a &/雪",
        "X-Label": "a/b &?=%",
        "X-Flags": [false, true],
        "X-Count": 0,
        body,
      };
      const setAuth = (value?: string) =>
        client.callTool(
          {
            name: "import-set-auth",
            arguments: value === undefined ? {} : { value },
          },
          REQUEST_OPTIONS
        );
      await setAuth();
      const missing = await client.callTool(
        { name: "import-update-user", arguments: args },
        REQUEST_OPTIONS
      );
      assert.equal(missing.isError, true);
      assert.ok(missing.content[0]?.type === "text");
      assert.match(
        missing.content[0].text,
        /Missing Authorization environment variable/
      );
      try {
        for (const credential of [
          "Bearer first-fixture-token",
          "Bearer rotated-fixture-token",
        ]) {
          await setAuth(credential);
          const result = await client.callTool(
            { name: "import-update-user", arguments: args },
            REQUEST_OPTIONS
          );
          assert.notEqual(result.isError, true);
          assert.ok(result.content[0]?.type === "text");
          assert.deepEqual(JSON.parse(result.content[0].text), {
            method: "PUT",
            path: "/v1/users/a%2Fb",
            query: "?q=a%20%26%2F%E9%9B%AA",
            headers: {
              authorization: credential,
              contentType: "application/json",
              label: "a/b &?=%",
              flags: "false,true",
              count: "0",
            },
            body,
          });
        }
        for (const invalid of [
          { ...args, "X-Label": "bad\r\nheader" },
          { ...args, body: { ...body, count: -1 } },
          { ...args, body: undefined },
        ]) {
          const failed = await client.callTool(
            { name: "import-update-user", arguments: invalid },
            REQUEST_OPTIONS
          );
          assert.equal(failed.isError, true);
        }
        await setAuth("Bearer secret-that-must-not-appear\r\nInjected: value");
        const invalidAuth = await client.callTool(
          { name: "import-update-user", arguments: args },
          REQUEST_OPTIONS
        );
        assert.equal(invalidAuth.isError, true);
        assert.ok(invalidAuth.content[0]?.type === "text");
        assert.match(
          invalidAuth.content[0].text,
          /Invalid value for header Authorization/
        );
        assert.doesNotMatch(
          invalidAuth.content[0].text,
          /secret-that-must-not-appear/
        );
      } finally {
        await setAuth();
      }
    }
  );
  whenSupported(
    "openapi-request",
    "omits absent JSON bodies and preserves a false scalar body",
    async ({ client }) => {
      for (const body of [undefined, false]) {
        const result = await client.callTool(
          {
            name: "import-optional-body",
            arguments: {
              id: "optional",
              ...(body === undefined ? {} : { body }),
            },
          },
          REQUEST_OPTIONS
        );
        assert.notEqual(result.isError, true);
        assert.ok(result.content[0]?.type === "text");
        assert.deepEqual(JSON.parse(result.content[0].text), {
          method: "PATCH",
          path: "/v1/users/optional",
          query: "",
          headers:
            body === undefined ? {} : { contentType: "application/json" },
          ...(body === undefined ? {} : { body }),
        });
      }
    }
  );
}
