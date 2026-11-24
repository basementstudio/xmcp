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

// Every outbound fetch in the child goes to this fake OpenAI API.
const preload = `
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.headers.get("authorization") !== "Bearer test-provider-key") throw new Error("Missing provider key");
  const body = await request.json();
  if (body.model !== "gpt-image-2.6-flare" || body.n !== 1 || body.output_format !== "png") throw new Error("Bad body");
  if (request.url === "https://api.openai.com/v1/images/generations" && body.prompt === "a red kite")
    return Response.json({ data: [{ b64_json: "${PNG_BASE64}" }], output_format: "png" });
  if (request.url === "https://api.openai.com/v1/images/edits" && body.images[0].image_url === "https://example.com/in.png")
    return Response.json({ data: [{ b64_json: "${PNG_BASE64}" }], output_format: "png" });
  throw new Error("Unexpected request " + request.method + " " + request.url);
};`;

for (const protocolVersion of PROTOCOL_VERSIONS) {
  test(
    `built OpenAI images server generates and edits on MCP ${protocolVersion}`,
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const endpoint = await startServer(context, preload, {
        OPENAI_API_KEY: "test-provider-key",
      });
      const api = client(endpoint, protocolVersion);
      await commonChecks(
        api,
        protocolVersion,
        ["generate-image", "edit-image"],
        {
          name: "generate-image",
          arguments: { prompt: "kite", n: 10 },
        }
      );
      for (const [name, args] of [
        ["generate-image", { prompt: "a red kite" }],
        [
          "edit-image",
          { prompt: "brighter", imageUrls: ["https://example.com/in.png"] },
        ],
      ] as const) {
        const called = await api.rpc("tools/call", { name, arguments: args });
        assert.equal(called.result.isError, undefined, JSON.stringify(called));
        assert.deepEqual(JSON.parse(called.result.content[0].text), {
          count: 1,
          images: [{ inline: true }],
        });
        assert.deepEqual(called.result.content[1], {
          type: "image",
          data: PNG_BASE64,
          mimeType: "image/png",
        });
      }
    }
  );
}
