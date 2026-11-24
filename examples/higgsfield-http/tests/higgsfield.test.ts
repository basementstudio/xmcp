import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { cancelRequest, GENERATE_PATH, submit } from "../src/higgsfield";
import { settle } from "../src/results";

const fast = { pollIntervalMs: 1, waitBudgetMs: 1_000 };
const originalEnv = { ...process.env };
const call = () => ({ signal: new AbortController().signal });
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
  process.env.HIGGSFIELD_API_KEY_ID = "id";
  process.env.HIGGSFIELD_API_KEY_SECRET = "secret";
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("submits once with the key pair and a fresh idempotency key", async () => {
  const seen = routes(() =>
    Response.json({ status: "queued", request_id: "r1" })
  );
  assert.equal(await submit(GENERATE_PATH, { prompt: "kite" }, call()), "r1");
  assert.equal(seen.length, 1);
  assert.equal(
    seen[0].url,
    "https://api.higgsfield.ai/higgsfield-ai/soul/v2/standard"
  );
  assert.equal(seen[0].headers.get("authorization"), "Key id:secret");
  assert.match(seen[0].headers.get("idempotency-key") ?? "", /^[0-9a-f-]{36}$/);
  assert.equal(seen[0].redirect, "error");
});

test("requires both halves of the key", async () => {
  delete process.env.HIGGSFIELD_API_KEY_SECRET;
  routes(() => Response.json({}));
  await assert.rejects(
    submit(GENERATE_PATH, { prompt: "kite" }, call()),
    /HIGGSFIELD_API_KEY_SECRET/
  );
});

test("reports content-policy blocks, balance errors, and pending jobs", async () => {
  routes(() => Response.json({ status: "nsfw" }));
  assert.match(
    JSON.stringify(await settle("r1", call(), fast)),
    /content policy/
  );
  mock.restoreAll();
  routes(() => Response.json({ status: "in_progress" }));
  const pending = await settle("r1", call(), {
    pollIntervalMs: 1,
    waitBudgetMs: 0,
  });
  assert.equal(
    JSON.parse((pending.content[0] as { text: string }).text).status,
    "in_progress"
  );
  mock.restoreAll();
  routes(() =>
    Response.json({ detail: "Insufficient balance" }, { status: 403 })
  );
  await assert.rejects(cancelRequest("r1", call()), /balance is too low/);
});
