import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { assertPollingUrl, submit } from "../src/bfl";
import { settle } from "../src/results";

const originalEnv = { ...process.env };
const call = () => ({ signal: new AbortController().signal });
const POLL = "https://api.eu.bfl.ai/v1/get_result?id=t1";
function routes(handler: (request: Request) => Response) {
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
  process.env.BFL_API_KEY = "provider-key";
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("only BFL polling URLs receive the key", () => {
  assert.equal(assertPollingUrl(POLL).hostname, "api.eu.bfl.ai");
  for (const url of [
    "https://bfl.ai.attacker.test/v1/get_result?id=1",
    "http://api.bfl.ai/v1/get_result?id=1",
    "https://api.bfl.ai/v1/other",
    "https://user:pass@api.bfl.ai/v1/get_result?id=1",
  ])
    assert.throws(() => assertPollingUrl(url));
});

test("submits to the configured model and maps source images to input_image fields", async () => {
  process.env.BFL_MODEL = "flux-2-max";
  const seen = routes(() => Response.json({ id: "t1", polling_url: POLL }));
  const pollingUrl = await submit(
    {
      prompt: "kite",
      imageUrls: ["https://x.test/1.png", "https://x.test/2.png"],
      safetyTolerance: 2,
      outputFormat: "png",
    },
    call()
  );
  assert.equal(pollingUrl, POLL);
  assert.equal(seen[0].url, "https://api.bfl.ai/v1/flux-2-max");
  assert.equal(seen[0].headers.get("x-key"), "provider-key");
  assert.deepEqual(await seen[0].json(), {
    prompt: "kite",
    input_image: "https://x.test/1.png",
    input_image_2: "https://x.test/2.png",
    safety_tolerance: 2,
    output_format: "png",
  });
});

test("reports moderation and keeps polling while generating", async () => {
  let polls = 0;
  routes(() =>
    Response.json({
      status: ++polls < 2 ? "Generating" : "Content Moderated",
      result: null,
    })
  );
  const result = await settle(POLL, call(), {
    pollIntervalMs: 1,
    waitBudgetMs: 1_000,
  });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /moderated/);
  assert.equal(polls, 2);
});

test("refuses to poll a foreign URL without making a request", async () => {
  const seen = routes(() => Response.json({}));
  await assert.rejects(
    settle("https://attacker.test/v1/get_result?id=1", call()),
    /polling URL/
  );
  assert.equal(seen.length, 0);
});
