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

// Every outbound fetch in the child goes to this fake Higgsfield API.
const preload = `
const png = Uint8Array.from(atob("${PNG_BASE64}"), (c) => c.charCodeAt(0));
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.url === "https://cdn.higgsfield.test/out.png") return new Response(png, { headers: { "content-type": "image/png" } });
  if (request.headers.get("authorization") !== "Key key-id:key-secret") throw new Error("Missing provider key");
  if (request.method === "POST" && request.url.endsWith("/cancel")) return new Response(null, { status: 202 });
  if (request.method === "POST") {
    if (!request.headers.get("idempotency-key")) throw new Error("Missing idempotency key");
    const body = await request.json();
    if (request.url === "https://api.higgsfield.ai/higgsfield-ai/soul/v2/standard" && body.prompt === "a red kite") return Response.json({ status: "queued", request_id: "req-1" });
    if (request.url === "https://api.higgsfield.ai/xai/grok-imagine-image-2.0" && body.image_urls[0] === "https://example.com/in.png" && body.aspect_ratio === "auto") return Response.json({ status: "queued", request_id: "req-1" });
  }
  if (request.url === "https://api.higgsfield.ai/requests/req-1/status")
    return Response.json({ status: "completed", images: [{ url: "https://cdn.higgsfield.test/out.png" }], expires_at: "2026-12-01T00:00:00Z" });
  throw new Error("Unexpected request " + request.method + " " + request.url);
};`;

for (const protocolVersion of PROTOCOL_VERSIONS) {
  test(
    `built Higgsfield server generates, edits, and cancels on MCP ${protocolVersion}`,
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const endpoint = await startServer(context, preload, {
        HIGGSFIELD_API_KEY_ID: "key-id",
        HIGGSFIELD_API_KEY_SECRET: "key-secret",
      });
      const api = client(endpoint, protocolVersion);
      await commonChecks(
        api,
        protocolVersion,
        ["generate-image", "edit-image", "get-image-job", "cancel-image-job"],
        {
          name: "edit-image",
          arguments: { prompt: "brighter", imageUrls: [] },
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
          jobId: "req-1",
          status: "completed",
          images: [
            {
              url: "https://cdn.higgsfield.test/out.png",
              expiresAt: "2026-12-01T00:00:00Z",
              inline: true,
            },
          ],
        });
        assert.deepEqual(called.result.content[1], {
          type: "image",
          data: PNG_BASE64,
          mimeType: "image/png",
        });
      }
      const cancelled = await api.rpc("tools/call", {
        name: "cancel-image-job",
        arguments: { jobId: "req-1" },
      });
      assert.deepEqual(cancelled.result.structuredContent, {
        jobId: "req-1",
        status: "canceled",
      });
    }
  );
}
