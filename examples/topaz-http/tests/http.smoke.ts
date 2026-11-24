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

// Every outbound fetch in the child goes to this fake Topaz API.
const preload = `
const png = Uint8Array.from(atob("${PNG_BASE64}"), (c) => c.charCodeAt(0));
const base = "https://api.topazlabs.com/image/v1";
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.url === "https://cdn.topaz.test/out.png") return new Response(png, { headers: { "content-type": "image/png" } });
  if (request.headers.get("x-api-key") !== "test-provider-key") throw new Error("Missing provider key");
  if (request.url === base + "/enhance/async" && request.method === "POST") {
    const form = await request.formData();
    if (form.get("source_url") !== "https://example.com/in.png" || form.get("model") !== "Standard V2" || form.get("output_width") !== "2048") throw new Error("Bad form");
    return Response.json({ process_id: "p-1", source_id: "s-1", eta: 0 });
  }
  if (request.url === base + "/status/p-1") return Response.json({ status: "Completed", progress: 100, output_width: 2048, output_height: 2048, credits: 1 });
  if (request.url === base + "/download/p-1") return Response.json({ download_url: "https://cdn.topaz.test/out.png", head_url: "https://cdn.topaz.test/out.png", expiry: 1800000000 });
  if (request.url === base + "/cancel/p-1" && request.method === "DELETE") return new Response(null, { status: 204 });
  throw new Error("Unexpected request " + request.method + " " + request.url);
};`;

for (const protocolVersion of PROTOCOL_VERSIONS) {
  test(
    `built Topaz server upscales, reads, and cancels on MCP ${protocolVersion}`,
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const endpoint = await startServer(context, preload, {
        TOPAZ_API_KEY: "test-provider-key",
      });
      const api = client(endpoint, protocolVersion);
      await commonChecks(
        api,
        protocolVersion,
        ["upscale-image", "get-upscale-job", "cancel-upscale-job"],
        {
          name: "upscale-image",
          arguments: { imageUrl: "http://example.com/in.png" },
        }
      );
      const upscaled = await api.rpc("tools/call", {
        name: "upscale-image",
        arguments: {
          imageUrl: "https://example.com/in.png",
          outputWidth: 2048,
        },
      });
      assert.equal(
        upscaled.result.isError,
        undefined,
        JSON.stringify(upscaled)
      );
      assert.deepEqual(JSON.parse(upscaled.result.content[0].text), {
        jobId: "p-1",
        status: "Completed",
        width: 2048,
        height: 2048,
        credits: 1,
        images: [
          {
            url: "https://cdn.topaz.test/out.png",
            expiresAt: "2027-01-15T08:00:00.000Z",
            inline: true,
          },
        ],
      });
      assert.deepEqual(upscaled.result.content[1], {
        type: "image",
        data: PNG_BASE64,
        mimeType: "image/png",
      });
      const cancelled = await api.rpc("tools/call", {
        name: "cancel-upscale-job",
        arguments: { jobId: "p-1" },
      });
      assert.deepEqual(cancelled.result.structuredContent, {
        jobId: "p-1",
        status: "Cancelled",
      });
    }
  );
}
