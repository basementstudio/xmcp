import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { submitUpscale } from "../src/topaz";
import { settle } from "../src/results";

const originalEnv = { ...process.env };
const call = (progress: unknown[] = []) => ({
  signal: new AbortController().signal,
  progress: async (value: number, total?: number) => {
    progress.push([value, total]);
  },
});
function routes(handler: (request: Request) => Response | Promise<Response>) {
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
  process.env.TOPAZ_API_KEY = "provider-key";
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("sends a source URL to the generative endpoint with its default model", async () => {
  const seen = routes(() =>
    Response.json({ process_id: "p1", source_id: "s1", eta: 0 })
  );
  await submitUpscale(
    {
      imageUrl: "https://x.test/a.png",
      generative: true,
      outputFormat: "png",
      cropToFill: false,
    },
    call()
  );
  assert.equal(seen.length, 1);
  assert.equal(
    seen[0].url,
    "https://api.topazlabs.com/image/v1/enhance-gen/async"
  );
  assert.equal(seen[0].headers.get("x-api-key"), "provider-key");
  const form = await seen[0].formData();
  assert.equal(form.get("model"), "Redefine");
  assert.equal(form.get("source_url"), "https://x.test/a.png");
  assert.equal(form.get("output_width"), null);
});

test("reports Topaz's percentage only when it increases and hands back running jobs", async () => {
  const percents = [10, 10, 5, 30];
  let polls = 0;
  routes(() =>
    Response.json({
      status: "Processing",
      progress: percents[Math.min(polls++, 3)],
    })
  );
  const progress: unknown[] = [];
  const result = await settle("p1", call(progress), {
    pollIntervalMs: 1,
    waitBudgetMs: 40,
  });
  assert.deepEqual(progress.slice(0, 2), [
    [10, 100],
    [30, 100],
  ]);
  assert.equal(progress.length, 2);
  assert.equal(
    JSON.parse((result.content[0] as { text: string }).text).status,
    "Processing"
  );
});

test("explains credit and subscription errors", async () => {
  routes(() =>
    Response.json({ message: "INSUFFICIENT_CREDITS" }, { status: 402 })
  );
  await assert.rejects(
    submitUpscale(
      {
        imageUrl: "https://x.test/a.png",
        generative: false,
        outputFormat: "jpeg",
        cropToFill: false,
      },
      call()
    ),
    /too few credits/
  );
});

test("a download cut off by the deadline still reports the finished job", async () => {
  routes((request) =>
    request.url.includes("/status/")
      ? Response.json({
          status: "Completed",
          output_width: 8,
          output_height: 8,
        })
      : new Promise<Response>((_, reject) =>
          request.signal.addEventListener(
            "abort",
            () => reject(request.signal.reason),
            { once: true }
          )
        )
  );
  const result = await settle("p1", {
    signal: new AbortController().signal,
    deadline: Date.now() + 200,
  });
  const summary = JSON.parse((result.content[0] as { text: string }).text);
  assert.equal(result.isError, undefined);
  assert.equal(summary.status, "Completed");
  assert.match(summary.message, /get-upscale-job/);
});
