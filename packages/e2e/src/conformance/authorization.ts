import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    const { code, message } = error as { code: number; message: string };
    return { code, message };
  }
  assert.fail("Expected the request to be rejected");
}

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "authorization",
    "hides denied components from every listing",
    async ({ client }) => {
      const tools = await client.listTools({}, REQUEST_OPTIONS);
      const names = tools.tools.map((tool) => tool.name);
      assert.ok(names.includes("add"));
      assert.ok(names.includes("authz-listed"));
      assert.ok(!names.includes("authz-hidden"));
      const prompts = await client.listPrompts({}, REQUEST_OPTIONS);
      assert.ok(prompts.prompts.some((prompt) => prompt.name === "greet"));
      assert.ok(
        !prompts.prompts.some((prompt) => prompt.name === "authz-hidden")
      );
      const resources = await client.listResources({}, REQUEST_OPTIONS);
      assert.ok(resources.resources.some((item) => item.name === "info"));
      assert.ok(
        !resources.resources.some((item) => item.uri.startsWith("authz://"))
      );
      const templates = await client.listResourceTemplates({}, REQUEST_OPTIONS);
      assert.ok(
        !templates.resourceTemplates.some(
          (item) => item.name === "authz-secret"
        )
      );
    }
  );
  whenSupported(
    "authorization",
    "rejects denied direct access exactly like an unknown component",
    async ({ client }) => {
      const unknownTool = await rejection(
        client.callTool(
          { name: "authz-missing", arguments: {} },
          REQUEST_OPTIONS
        )
      );
      // Invalid arguments must not reveal that a denied tool exists.
      for (const [name, args] of [
        ["authz-hidden", { n: 1 }],
        ["authz-hidden", { n: "invalid" }],
        ["authz-listed", {}],
      ] as const) {
        assert.deepEqual(
          await rejection(
            client.callTool({ name, arguments: args }, REQUEST_OPTIONS)
          ),
          {
            ...unknownTool,
            message: unknownTool.message.replace("authz-missing", name),
          }
        );
      }
      const unknownPrompt = await rejection(
        client.getPrompt({ name: "authz-missing" }, REQUEST_OPTIONS)
      );
      assert.deepEqual(
        await rejection(
          client.getPrompt(
            { name: "authz-hidden", arguments: { value: "x" } },
            REQUEST_OPTIONS
          )
        ),
        {
          ...unknownPrompt,
          message: unknownPrompt.message.replace(
            "authz-missing",
            "authz-hidden"
          ),
        }
      );
      const unknownResource = await rejection(
        client.readResource({ uri: "authz://missing" }, REQUEST_OPTIONS)
      );
      for (const uri of ["authz://hidden", "authz://secret/one"]) {
        assert.deepEqual(
          await rejection(client.readResource({ uri }, REQUEST_OPTIONS)),
          {
            ...unknownResource,
            message: unknownResource.message.replace("authz://missing", uri),
          }
        );
      }
    }
  );
  whenSupported(
    "authorization",
    "returns no completions for denied prompts and templates",
    async ({ client }) => {
      for (const [ref, name] of [
        [{ type: "ref/prompt", name: "authz-hidden" }, "value"],
        [{ type: "ref/resource", uri: "authz://secret/{id}" }, "id"],
      ] as const) {
        const result = await client.complete(
          { ref, argument: { name, value: "a" } },
          REQUEST_OPTIONS
        );
        assert.deepEqual(result.completion.values, []);
      }
    }
  );
}
