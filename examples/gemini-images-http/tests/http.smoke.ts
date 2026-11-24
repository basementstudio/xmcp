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

// Every outbound fetch in the child goes to this fake Gemini API.
const preload = `
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.url !== "https://generativelanguage.googleapis.com/v1beta/interactions" || request.headers.get("x-goog-api-key") !== "test-provider-key") throw new Error("Unexpected request " + request.url);
  const body = await request.json();
  if (body.model !== "gemini-nano-banana-2.1" || body.response_format.type !== "image" || body.input[0].type !== "text") throw new Error("Bad body");
  if (body.input[0].text === "brighter" && body.input[1].data !== "${PNG_BASE64}") throw new Error("Missing source image");
  return Response.json({ id: "i-1", status: "completed", steps: [{ type: "model_output", content: [{ type: "image", data: "${PNG_BASE64}" }] }] });
};`;

for (const protocolVersion of PROTOCOL_VERSIONS) {
  test(
    `built Gemini images server generates and edits on MCP ${protocolVersion}`,
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const endpoint = await startServer(context, preload, {
        GEMINI_API_KEY: "test-provider-key",
      });
      const api = client(endpoint, protocolVersion);
      await commonChecks(
        api,
        protocolVersion,
        ["generate-image", "edit-image"],
        {
          name: "edit-image",
          arguments: {
            prompt: "brighter",
            images: [{ data: "not base64!", mimeType: "image/png" }],
          },
        }
      );
      for (const [name, args] of [
        ["generate-image", { prompt: "a red kite", aspectRatio: "16:9" }],
        [
          "edit-image",
          {
            prompt: "brighter",
            images: [{ data: PNG_BASE64, mimeType: "image/png" }],
          },
        ],
      ] as const) {
        const called = await api.rpc("tools/call", { name, arguments: args });
        assert.equal(called.result.isError, undefined, JSON.stringify(called));
        assert.deepEqual(called.result.content[1], {
          type: "image",
          data: PNG_BASE64,
          mimeType: "image/png",
        });
      }
    }
  );
}
