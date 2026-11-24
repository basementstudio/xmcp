import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { createImage } from "../src/gemini";

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
  process.env.GEMINI_API_KEY = "provider-key";
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("sends one interaction with the prompt, source images, and image format", async () => {
  const seen = routes(() =>
    Response.json({
      steps: [
        { type: "thought", content: [] },
        {
          type: "model_output",
          content: [
            { type: "text", text: "Here" },
            { type: "image", mime_type: "image/jpeg", data: "/9j/" },
          ],
        },
      ],
    })
  );
  const [output] = await createImage(
    {
      prompt: "brighter",
      images: [{ data: "AQID", mimeType: "image/png" }],
      aspectRatio: "4:3",
      imageSize: "2K",
    },
    call()
  );
  assert.equal(seen.length, 1);
  assert.equal(seen[0].headers.get("x-goog-api-key"), "provider-key");
  assert.deepEqual(await seen[0].json(), {
    model: "gemini-nano-banana-2.1",
    input: [
      { type: "text", text: "brighter" },
      { type: "image", mime_type: "image/png", data: "AQID" },
    ],
    response_format: { type: "image", image_size: "2K", aspect_ratio: "4:3" },
  });
  assert.equal(output.mimeType, "image/jpeg");
});

test("detects the format when no MIME type is given and fails clearly without images", async () => {
  routes(() =>
    Response.json({
      steps: [
        {
          type: "model_output",
          content: [{ type: "image", data: "iVBORw0KGgo=" }],
        },
      ],
    })
  );
  const [png] = await createImage({ prompt: "kite", imageSize: "1K" }, call());
  assert.equal(png.mimeType, "image/png");
  mock.restoreAll();
  routes(() =>
    Response.json({
      steps: [
        { type: "model_output", content: [{ type: "text", text: "No." }] },
      ],
    })
  );
  await assert.rejects(
    createImage({ prompt: "kite", imageSize: "1K" }, call()),
    /no image/
  );
});
