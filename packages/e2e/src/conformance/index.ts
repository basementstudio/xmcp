import assert from "node:assert/strict";
import { it } from "node:test";
import { CLIENT_INFO, REQUEST_OPTIONS } from "../harness/client-options.js";
import { REQUEST_TIMEOUT_MS } from "../harness/constants.js";
import { supports, type Capability, type Target } from "../harness/target.js";

export function register(getTarget: () => Target, onFailure: () => void) {
  function whenSupported(
    capability: Capability,
    name: string,
    check: (target: Target) => Promise<void>
  ) {
    it(name, { timeout: REQUEST_TIMEOUT_MS }, async (context) => {
      const target = getTarget();
      if (!supports(target, capability)) {
        context.skip(
          target.unsupportedReasons?.[capability] ??
            `${target.fixture.label} does not support ${capability}`
        );
        return;
      }
      try {
        await check(target);
      } catch (error) {
        onFailure();
        throw error;
      }
    });
  }

  whenSupported(
    "tools",
    "lists tools with input/output schemas and annotations",
    async ({ client }) => {
      const { tools } = await client.listTools({}, REQUEST_OPTIONS);
      const add = tools.find((tool) => tool.name === "add");
      assert.ok(add);
      assert.deepEqual(add.inputSchema.required, ["a", "b"]);
      assert.partialDeepStrictEqual(add.inputSchema.properties?.a, {
        type: "number",
      });
      assert.ok(add.outputSchema);
      assert.partialDeepStrictEqual(add.outputSchema.properties, {
        sum: { type: "number" },
      });
      assert.equal(add.annotations?.readOnlyHint, true);
      assert.ok(tools.some((tool) => tool.name === "confirm"));
    }
  );
  whenSupported(
    "tools",
    "calls a tool and preserves structured output",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "add", arguments: { a: 2, b: 3 } },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      assert.deepEqual(result.structuredContent, { sum: 5 });
    }
  );
  whenSupported(
    "tools",
    "rejects invalid arguments and unknown tools",
    async ({ client }) => {
      // Servers may return a tool error or a JSON-RPC error. A successful result
      // in either case is a regression; transport failures are not accepted.
      for (const params of [
        { name: "add", arguments: { a: "invalid", b: 3 } },
        { name: "missing-tool", arguments: {} },
      ]) {
        const outcome = await client.callTool(params, REQUEST_OPTIONS).then(
          (result) => ({ result }),
          (error: unknown) => ({ error })
        );
        if ("result" in outcome) assert.equal(outcome.result.isError, true);
        else {
          assert.ok(outcome.error instanceof Error);
          assert.ok("code" in outcome.error);
          assert.ok(
            [-32602, -32601].includes(Number(outcome.error.code)),
            outcome.error.message
          );
        }
      }
    }
  );
  whenSupported("tools", "preserves application errors", async ({ client }) => {
    const result = await client.callTool(
      { name: "fail", arguments: {} },
      REQUEST_OPTIONS
    );
    assert.equal(result.isError, true);
    assert.deepEqual(result.content, [
      { type: "text", text: "Expected fixture error" },
    ]);
  });
  whenSupported(
    "tools",
    "exposes client identity to tools",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "client-info", arguments: {} },
        REQUEST_OPTIONS
      );
      assert.deepEqual(result.structuredContent, { clientInfo: CLIENT_INFO });
    }
  );
  whenSupported("prompts", "lists and renders prompts", async ({ client }) => {
    const { prompts } = await client.listPrompts({}, REQUEST_OPTIONS);
    assert.ok(prompts.some((prompt) => prompt.name === "greet"));
    const result = await client.getPrompt(
      { name: "greet", arguments: { name: "Ada" } },
      REQUEST_OPTIONS
    );
    assert.deepEqual(result.messages, [
      { role: "user", content: { type: "text", text: "Hello, Ada" } },
    ]);
  });
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
  whenSupported(
    "stateless-http",
    "handles independent requests without a session or cached client metadata",
    async ({ url }) => {
      // Use the legacy wire directly so each request's identity is explicit.
      // These requests deliberately have no initialize handshake or session ID.
      for (const name of ["first-request", "second-request", undefined]) {
        const response = await fetch(url!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            "MCP-Protocol-Version": "2025-11-25",
            ...(name
              ? { "x-mcp-client-name": name, "x-mcp-client-version": "1.0.0" }
              : {}),
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: "client-info", arguments: {} },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("mcp-session-id"), null);
        const body = await response.text();
        const payload = response.headers
          .get("content-type")
          ?.includes("text/event-stream")
          ? body
              .split("\n")
              .filter((line) => line.startsWith("data: "))
              .map((line) => JSON.parse(line.slice(6)))
              .find((message) => message.id === 1)
          : JSON.parse(body);
        assert.deepEqual(
          payload?.result?.structuredContent?.clientInfo,
          name ? { name, version: "1.0.0" } : null
        );
      }
    }
  );
}
