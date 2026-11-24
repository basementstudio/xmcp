import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { edit, generate } from "../src/openai";
import { respond } from "../src/options";

const originalEnv = { ...process.env };
const call = () => ({ signal: new AbortController().signal });
const options = {
  size: "auto",
  quality: "auto",
  background: "auto",
  outputFormat: "webp",
  n: 1,
};
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
  process.env.OPENAI_API_KEY = "provider-key";
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("generates once with the configured model and decodes the returned bytes", async () => {
  process.env.OPENAI_IMAGE_MODEL = "gpt-image-2";
  const seen = routes(() => Response.json({ data: [{ b64_json: "AQID" }] }));
  const [output] = await generate("kite", options, call());
  assert.equal(seen.length, 1);
  assert.equal(seen[0].redirect, "error");
  assert.deepEqual(await seen[0].json(), {
    model: "gpt-image-2",
    prompt: "kite",
    size: "auto",
    quality: "auto",
    background: "auto",
    output_format: "webp",
    n: 1,
  });
  assert.deepEqual([...output.bytes!], [1, 2, 3]);
  assert.equal(output.mimeType, "image/webp");
});

test("sends edit sources and the mask as image URLs for OpenAI to fetch", async () => {
  const seen = routes(() =>
    Response.json({ data: [{ b64_json: "AQID" }], output_format: "png" })
  );
  await edit(
    "brighter",
    ["https://x.test/a.png"],
    "https://x.test/mask.png",
    options,
    call()
  );
  const body = await seen[0].json();
  assert.equal(seen[0].url, "https://api.openai.com/v1/images/edits");
  assert.deepEqual(body.images, [{ image_url: "https://x.test/a.png" }]);
  assert.deepEqual(body.mask, { image_url: "https://x.test/mask.png" });
});

test("explains moderation and verification errors without leaking provider details", async () => {
  routes(() =>
    Response.json(
      { error: { message: "internal detail", code: "moderation_blocked" } },
      { status: 400 }
    )
  );
  const result = await respond(() => generate("kite", options, call()), call());
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /moderation/);
  assert.doesNotMatch(JSON.stringify(result), /internal detail/);
});
