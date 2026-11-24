import assert from "node:assert/strict";
import { test } from "node:test";
import {
  client,
  commonChecks,
  PNG_BASE64,
  PROTOCOL_VERSIONS,
  startServer,
  TEST_TIMEOUT_MS,
} from "./server";

const POLL = "https://api.us1.bfl.ai/v1/get_result?id=task-1";
// Every outbound fetch in the child goes to this fake BFL API.
const preload = `
const png = Uint8Array.from(atob("${PNG_BASE64}"), (c) => c.charCodeAt(0));
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.url === "https://delivery.bfl.test/out.png") return new Response(png, { headers: { "content-type": "image/png" } });
  if (request.headers.get("x-key") !== "test-provider-key") throw new Error("Missing provider key");
  if (request.url === "https://api.bfl.ai/v1/flux-2-pro" && request.method === "POST") {
    const body = await request.json();
    if (body.prompt === "a red kite" && body.safety_tolerance === 2 && !body.input_image) return Response.json({ id: "task-1", polling_url: "${POLL}" });
    if (body.input_image === "https://example.com/a.png" && body.input_image_2 === "https://example.com/b.png") return Response.json({ id: "task-1", polling_url: "${POLL}" });
    throw new Error("Bad body");
  }
  if (request.url === "${POLL}") return Response.json({ id: "task-1", status: "Ready", result: { sample: "https://delivery.bfl.test/out.png" } });
  throw new Error("Unexpected request " + request.method + " " + request.url);
};`;

for (const protocolVersion of PROTOCOL_VERSIONS) {
  test(
    `built BFL server generates and edits on MCP ${protocolVersion}`,
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const endpoint = await startServer(context, preload, {
        BFL_API_KEY: "test-provider-key",
      });
      const api = client(endpoint, protocolVersion);
      await commonChecks(
        api,
        protocolVersion,
        ["generate-image", "edit-image", "get-image-job"],
        {
          name: "generate-image",
          arguments: { prompt: "kite", safetyTolerance: 9 },
        }
      );
      for (const [name, args] of [
        ["generate-image", { prompt: "a red kite" }],
        [
          "edit-image",
          {
            prompt: "merge",
            imageUrls: [
              "https://example.com/a.png",
              "https://example.com/b.png",
            ],
          },
        ],
      ] as const) {
        const called = await api.rpc("tools/call", { name, arguments: args });
        assert.equal(called.result.isError, undefined, JSON.stringify(called));
        const summary = JSON.parse(called.result.content[0].text);
        assert.equal(summary.pollingUrl, POLL);
        assert.equal(summary.images[0].inline, true);
        assert.deepEqual(called.result.content[1], {
          type: "image",
          data: PNG_BASE64,
          mimeType: "image/png",
        });
      }
      const foreign = await api.rpc("tools/call", {
        name: "get-image-job",
        arguments: {
          pollingUrl: "https://attacker.test/v1/get_result?id=task-1",
        },
      });
      assert.equal(foreign.result.isError, true);
    }
  );
}
