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

// Every outbound fetch in the child goes to this fake Krea API.
const preload = `
const png = Uint8Array.from(atob("${PNG_BASE64}"), (c) => c.charCodeAt(0));
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.url === "https://cdn.krea.test/out.png") return new Response(png, { headers: { "content-type": "image/png" } });
  if (request.headers.get("authorization") !== "Bearer test-provider-key") throw new Error("Missing provider key");
  if (request.url === "https://api.krea.ai/generate/image/krea/krea-3" && request.method === "POST") {
    const body = await request.json();
    if (body.prompt !== "a red kite" || body.resolution !== "1K" || body.thinking_mode !== "fast") throw new Error("Bad body");
    return Response.json({ job_id: "job-1" });
  }
  if (request.url === "https://api.krea.ai/jobs/job-1" && request.method === "GET")
    return Response.json({ job_id: "job-1", status: "completed", result: { urls: ["https://cdn.krea.test/out.png"] } });
  if (request.url === "https://api.krea.ai/jobs/job-1" && request.method === "DELETE") return new Response(null, { status: 204 });
  throw new Error("Unexpected request " + request.method + " " + request.url);
};`;

for (const protocolVersion of PROTOCOL_VERSIONS) {
  test(
    `built Krea server generates, reads, and cancels jobs on MCP ${protocolVersion}`,
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const endpoint = await startServer(context, preload, {
        KREA_API_KEY: "test-provider-key",
      });
      const api = client(endpoint, protocolVersion);
      await commonChecks(
        api,
        protocolVersion,
        ["generate-image", "get-image-job", "cancel-image-job"],
        {
          name: "generate-image",
          arguments: { prompt: "" },
        }
      );
      const generated = await api.rpc("tools/call", {
        name: "generate-image",
        arguments: { prompt: "a red kite" },
      });
      assert.equal(
        generated.result.isError,
        undefined,
        JSON.stringify(generated)
      );
      const [summary, picture] = generated.result.content;
      assert.deepEqual(JSON.parse(summary.text), {
        jobId: "job-1",
        status: "completed",
        images: [{ url: "https://cdn.krea.test/out.png", inline: true }],
      });
      assert.deepEqual(picture, {
        type: "image",
        data: PNG_BASE64,
        mimeType: "image/png",
      });
      const fetched = await api.rpc("tools/call", {
        name: "get-image-job",
        arguments: { jobId: "job-1" },
      });
      assert.equal(fetched.result.content[1].type, "image");
      const cancelled = await api.rpc("tools/call", {
        name: "cancel-image-job",
        arguments: { jobId: "job-1" },
      });
      assert.deepEqual(JSON.parse(cancelled.result.content[0].text), {
        jobId: "job-1",
        status: "cancelled",
      });
    }
  );
}
