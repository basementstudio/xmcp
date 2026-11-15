import assert from "node:assert/strict";
import { z } from "zod";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    const { code, message, data } = error as {
      code: number;
      message: string;
      data?: unknown;
    };
    return { code, message, data };
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
            data: { uri },
            message: unknownResource.message.replace("authz://missing", uri),
          }
        );
      }
    }
  );
  whenSupported(
    "authorization",
    "rejects denied completions exactly like unknown references",
    async ({ client }) => {
      for (const [ref, name] of [
        [{ type: "ref/prompt", name: "authz-hidden" }, "value"],
        [{ type: "ref/resource", uri: "authz://secret/{id}" }, "id"],
        [{ type: "ref/resource", uri: "authz://hidden" }, "id"],
        [{ type: "ref/resource", uri: "ui://app/authz-widget.html" }, "id"],
      ] as const) {
        const unknownRef =
          ref.type === "ref/prompt"
            ? { type: "ref/prompt" as const, name: "authz-missing" }
            : { type: "ref/resource" as const, uri: "authz://missing" };
        const argument = { name, value: "a" };
        const unknown = await rejection(
          client.complete({ ref: unknownRef, argument }, REQUEST_OPTIONS)
        );
        assert.deepEqual(
          await rejection(client.complete({ ref, argument }, REQUEST_OPTIONS)),
          {
            ...unknown,
            message: unknown.message.replace(
              ref.type === "ref/prompt" ? "authz-missing" : "authz://missing",
              ref.type === "ref/prompt" ? ref.name : ref.uri
            ),
          }
        );
      }
    }
  );
  whenSupported(
    "authorization",
    "hides denied skills from discovery and direct access",
    async ({ client }) => {
      const result = z.object({}).passthrough();
      const listed = await client.request(
        { method: "skills/list", params: {} },
        z.object({ skills: z.array(z.object({ uri: z.string() })) }),
        REQUEST_OPTIONS
      );
      assert.ok(listed.skills.length > 0);
      assert.ok(
        listed.skills.every(
          (skill) => skill.uri !== "skill://authz-hidden/SKILL.md"
        )
      );
      const get = (uri: string) =>
        client.request(
          { method: "skills/get", params: { uri } },
          result,
          REQUEST_OPTIONS
        );
      const missing = await rejection(get("skill://missing/SKILL.md"));
      assert.deepEqual(await rejection(get("skill://authz-hidden/SKILL.md")), {
        ...missing,
        message: missing.message.replace(
          "skill://missing/SKILL.md",
          "skill://authz-hidden/SKILL.md"
        ),
      });
      const resources = await client.listResources({}, REQUEST_OPTIONS);
      assert.ok(
        resources.resources.every(
          (resource) => resource.uri !== "skill://authz-hidden/SKILL.md"
        )
      );
      await assert.rejects(
        client.readResource(
          { uri: "skill://authz-hidden/SKILL.md" },
          REQUEST_OPTIONS
        ),
        /Resource not found/
      );
    }
  );
  whenSupported(
    "authorization",
    "shares policy values with tool handlers without mixing requests",
    async ({ client }) => {
      const results = await Promise.all(
        ["1", "2", undefined].map((n) =>
          client.callTool(
            { name: "authz-context", arguments: n === undefined ? {} : { n } },
            REQUEST_OPTIONS
          )
        )
      );
      assert.deepEqual(
        results.map((result) => result.structuredContent),
        [
          { n: 1, raw: "1" },
          { n: 2, raw: "2" },
          { n: 7, raw: "default" },
        ]
      );
    }
  );
}
