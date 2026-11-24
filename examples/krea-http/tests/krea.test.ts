import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { submitGeneration } from "../src/krea";
import { settle } from "../src/results";

const PNG = new Uint8Array([137, 80, 78, 71]);
const fast = { pollIntervalMs: 1, waitBudgetMs: 1_000 };
const originalEnv = { ...process.env };
const call = (progress: number[] = []) => ({
  signal: new AbortController().signal,
  progress: async (value: number) => {
    progress.push(value);
  },
});
type Route = (request: Request) => Response | Promise<Response>;
function routes(handler: Route) {
  const seen: Request[] = [];
  mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo, init?: RequestInit) => {
      const request = new Request(input, init);
      seen.push(request);
      return handler(request);
    }
  );
  return seen;
}

beforeEach(() => {
  process.env.KREA_API_KEY = "provider-key";
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("submits once with the bearer key and only the options that were set", async () => {
  const seen = routes(() => Response.json({ job_id: "j1" }));
  const jobId = await submitGeneration(
    {
      prompt: "kite",
      aspectRatio: "16:9",
      resolution: "2K",
      thinkingMode: "high",
      imageUrls: ["https://x.test/a.png"],
    },
    call()
  );
  assert.equal(jobId, "j1");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://api.krea.ai/generate/image/krea/krea-3");
  assert.equal(seen[0].headers.get("authorization"), "Bearer provider-key");
  assert.equal(seen[0].redirect, "error");
  assert.deepEqual(await seen[0].json(), {
    prompt: "kite",
    aspect_ratio: "16:9",
    resolution: "2K",
    thinking_mode: "high",
    image_urls: ["https://x.test/a.png"],
  });
});

test("polls with progress until the job completes, then returns the image inline", async () => {
  let polls = 0;
  routes((request) => {
    if (request.url === "https://cdn.test/out.png")
      return new Response(PNG, { headers: { "content-type": "image/png" } });
    polls++;
    return Response.json(
      polls < 3
        ? { job_id: "j1", status: "processing" }
        : {
            job_id: "j1",
            status: "completed",
            result: { urls: ["https://cdn.test/out.png"] },
          }
    );
  });
  const progress: number[] = [];
  const result = await settle("j1", call(progress), fast);
  assert.equal(result.isError, undefined);
  assert.deepEqual(progress, [1, 2]);
  assert.deepEqual(result.content[1], {
    type: "image",
    data: Buffer.from(PNG).toString("base64"),
    mimeType: "image/png",
  });
});

test("returns the job ID instead of waiting past the budget", async () => {
  routes(() => Response.json({ job_id: "j1", status: "queued" }));
  const result = await settle("j1", call(), {
    pollIntervalMs: 1,
    waitBudgetMs: 0,
  });
  const summary = JSON.parse((result.content[0] as { text: string }).text);
  assert.equal(summary.jobId, "j1");
  assert.equal(summary.status, "queued");
});

test("reports failures by code and keeps oversized or non-https outputs as links", async () => {
  routes(() =>
    Response.json({
      job_id: "j1",
      status: "failed",
      error: { code: "content_policy", message: "secret detail" },
    })
  );
  const failed = await settle("j1", call(), fast);
  assert.equal(failed.isError, true);
  assert.match(JSON.stringify(failed), /content_policy/);
  assert.doesNotMatch(JSON.stringify(failed), /secret detail/);

  mock.restoreAll();
  routes((request) =>
    request.url.startsWith("https://cdn.test/")
      ? new Response(PNG, {
          headers: {
            "content-type": "image/png",
            "content-length": String(64 * 1024 * 1024),
          },
        })
      : Response.json({
          job_id: "j1",
          status: "completed",
          result: {
            urls: ["https://cdn.test/big.png", "http://cdn.test/plain.png"],
          },
        })
  );
  const big = await settle("j1", call(), fast);
  assert.equal(big.content.length, 1);
  assert.deepEqual(
    JSON.parse((big.content[0] as { text: string }).text).images,
    [
      { url: "https://cdn.test/big.png", inline: false },
      { url: "http://cdn.test/plain.png", inline: false },
    ]
  );
});

test("maps account errors to readable messages without retrying", async () => {
  const seen = routes(() =>
    Response.json(
      { status: 402, message: "WORKSPACE_USAGE_LIMIT_REACHED" },
      { status: 402 }
    )
  );
  await assert.rejects(
    submitGeneration(
      {
        prompt: "kite",
        aspectRatio: "1:1",
        resolution: "1K",
        thinkingMode: "fast",
      },
      call()
    ),
    /balance is empty/
  );
  assert.equal(seen.length, 1);
});

test("stops waiting when the MCP request is cancelled", async () => {
  routes(() => Response.json({ job_id: "j1", status: "processing" }));
  const controller = new AbortController();
  const pending = settle(
    "j1",
    { signal: controller.signal },
    { pollIntervalMs: 50, waitBudgetMs: 5_000 }
  );
  setImmediate(() => controller.abort());
  await assert.rejects(pending, { name: "AbortError" });
});
