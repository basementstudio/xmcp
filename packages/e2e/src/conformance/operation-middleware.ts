import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "operation-middleware",
    "filters every catalog and denies direct access to hidden components",
    async ({ client }) => {
      const tools = await client.listTools({}, REQUEST_OPTIONS);
      assert.ok(tools.tools.some((item) => item.name === "add"));
      assert.ok(!tools.tools.some((item) => item.name === "middleware-denied"));
      const prompts = await client.listPrompts({}, REQUEST_OPTIONS);
      assert.ok(prompts.prompts.some((item) => item.name === "operation-echo"));
      assert.ok(
        !prompts.prompts.some((item) => item.name === "operation-denied")
      );
      const resources = await client.listResources({}, REQUEST_OPTIONS);
      assert.ok(
        resources.resources.some((item) => item.uri === "operation://echo")
      );
      assert.ok(
        !resources.resources.some((item) => item.uri === "operation://denied")
      );
      const templates = await client.listResourceTemplates({}, REQUEST_OPTIONS);
      assert.ok(
        templates.resourceTemplates.some(
          (item) => item.uriTemplate === "operation://echo/{value}"
        )
      );
      assert.ok(
        !templates.resourceTemplates.some(
          (item) => item.name === "operation-denied-template"
        )
      );
      for (const uri of [
        "operation://denied",
        "operation://denied/secret",
        "OPERATION://denied",
      ]) {
        await assert.rejects(
          client.readResource({ uri }, REQUEST_OPTIONS),
          /Read denied by middleware/
        );
      }
      await assert.rejects(
        client.getPrompt(
          { name: "operation-denied", arguments: { value: "secret" } },
          REQUEST_OPTIONS
        ),
        /Prompt denied by middleware/
      );
      const deniedTool = await client.callTool(
        { name: "middleware-denied" },
        REQUEST_OPTIONS
      );
      assert.equal(deniedTool.isError, true);
      assert.deepEqual(deniedTool.content, [
        { type: "text", text: "Denied by MCP middleware" },
      ]);
    }
  );
  whenSupported(
    "operation-middleware",
    "shares isolated context with prompt and resource handlers",
    async ({ client }) => {
      await Promise.all(
        ["first", "second"].map(async (value) => {
          const prompt = await client.getPrompt(
            { name: "operation-echo", arguments: { value } },
            REQUEST_OPTIONS
          );
          assert.deepEqual(prompt.messages, [
            { role: "assistant", content: { type: "text", text: value } },
          ]);
          assert.equal(prompt._meta?.operation, "prompts/get");
          assert.equal(prompt._meta?.seen, value);
          for (const uri of ["operation://echo", "operation://echo/" + value]) {
            const result = await client.readResource({ uri }, REQUEST_OPTIONS);
            assert.deepEqual(result.contents, [{ uri, text: uri }]);
            assert.equal(result._meta?.operation, "resources/read");
            assert.equal(result._meta?.seen, uri);
          }
        })
      );
    }
  );
  whenSupported(
    "operation-middleware",
    "wraps completion callbacks and can short-circuit them",
    async ({ client }) => {
      const result = await client.complete(
        {
          ref: { type: "ref/prompt", name: "operation-echo" },
          argument: { name: "value", value: "prefix" },
        },
        REQUEST_OPTIONS
      );
      assert.deepEqual(result.completion.values, ["prefix:from middleware"]);
      assert.equal(result._meta?.operation, "completion/complete");
      assert.equal(result._meta?.seen, "from middleware");
      const denied = await client.complete(
        {
          ref: { type: "ref/prompt", name: "operation-denied" },
          argument: { name: "value", value: "prefix" },
        },
        REQUEST_OPTIONS
      );
      assert.deepEqual(denied.completion.values, []);
    }
  );
}
