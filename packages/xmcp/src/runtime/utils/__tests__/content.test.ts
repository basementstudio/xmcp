import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  specTypeSchemas,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { image, audio, embeddedResource } from "../content";
import {
  imageFromFile,
  audioFromFile,
  embeddedResourceFromFile,
} from "../../../node";
import { transformToolHandler } from "../transformers/tool";

test("image and audio encode byte arrays and ArrayBuffers with standard base64", () => {
  for (const bytes of [
    new Uint8Array(),
    new Uint8Array([0]),
    new Uint8Array([0, 255]),
    new Uint8Array([0, 127, 128, 254, 255]),
    new TextEncoder().encode("Hello, 世界"),
  ]) {
    for (const input of [bytes, bytes.buffer]) {
      const data = Buffer.from(bytes).toString("base64");
      assert.deepEqual(image(input, "image/png"), {
        type: "image",
        data,
        mimeType: "image/png",
      });
      assert.deepEqual(audio(input, "audio/wav"), {
        type: "audio",
        data,
        mimeType: "audio/wav",
      });
    }
  }
});

test("byte views and Node Buffers encode only their visible bytes", () => {
  const bytes = new Uint8Array([11, 22, 33, 44, 55]);
  for (const view of [
    bytes.subarray(1, 4),
    Buffer.from(bytes).subarray(1, 4),
  ]) {
    assert.equal(
      image(view, "image/png").data,
      Buffer.from([22, 33, 44]).toString("base64")
    );
    assert.deepEqual(bytes, new Uint8Array([11, 22, 33, 44, 55]));
  }
});

test("large binary content does not overflow argument limits or insert base64 padding mid-stream", () => {
  const bytes = Uint8Array.from({ length: 200_003 }, (_, index) => index % 256);
  assert.equal(
    audio(bytes, "audio/wav").data,
    Buffer.from(bytes).toString("base64")
  );
});

test("embedded resources distinguish Unicode text from binary blobs", () => {
  assert.deepEqual(
    embeddedResource("note://hello", "Hello, 世界", "text/plain"),
    {
      type: "resource",
      resource: {
        uri: "note://hello",
        text: "Hello, 世界",
        mimeType: "text/plain",
      },
    }
  );
  assert.deepEqual(embeddedResource("note://empty", ""), {
    type: "resource",
    resource: { uri: "note://empty", text: "" },
  });
  const bytes = new Uint8Array([0, 255]);
  for (const input of [bytes, bytes.buffer]) {
    assert.deepEqual(
      embeddedResource("data://bytes", input, "application/octet-stream"),
      {
        type: "resource",
        resource: {
          uri: "data://bytes",
          blob: "AP8=",
          mimeType: "application/octet-stream",
        },
      }
    );
  }
});

test("binary helpers reject strings instead of silently double-encoding base64", () => {
  for (const helper of [image, audio]) {
    assert.throws(
      () => helper("AP8=" as unknown as Uint8Array, "image/png"),
      /Expected bytes/
    );
  }
});

test("mixed text, image, audio and resource blocks survive tool transformation", async () => {
  const content = [
    { type: "text" as const, text: "Media" },
    image(new Uint8Array([0, 255]), "image/png"),
    audio(new Uint8Array([0, 255]), "audio/wav"),
    embeddedResource("note://text", "Hello"),
    embeddedResource("data://bytes", new Uint8Array([0, 255])),
  ];
  const expected = structuredClone(content);
  const context = {
    mcpReq: { id: "media", signal: new AbortController().signal },
  } as unknown as ServerContext;
  const result = await transformToolHandler(() => ({ content }))({}, context);
  assert.deepEqual(result.content, expected);
  const validation =
    await specTypeSchemas.CallToolResult["~standard"].validate(result);
  assert.equal(validation.issues, undefined);
});

test("Node file helpers read paths and file URLs and preserve filesystem errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "xmcp-content-"));
  const path = join(directory, "media.bin");
  await writeFile(path, new Uint8Array([0, 255]));
  try {
    for (const input of [path, pathToFileURL(path)]) {
      assert.deepEqual(await imageFromFile(input, "image/png"), {
        type: "image",
        data: "AP8=",
        mimeType: "image/png",
      });
      assert.deepEqual(await audioFromFile(input, "audio/wav"), {
        type: "audio",
        data: "AP8=",
        mimeType: "audio/wav",
      });
      assert.deepEqual(
        await embeddedResourceFromFile(
          input,
          "data://file",
          "application/octet-stream"
        ),
        {
          type: "resource",
          resource: {
            uri: "data://file",
            blob: "AP8=",
            mimeType: "application/octet-stream",
          },
        }
      );
    }
    const missing = join(directory, "missing");
    await assert.rejects(imageFromFile(missing, "image/png"), {
      code: "ENOENT",
    });
    await assert.rejects(audioFromFile(missing, "audio/wav"), {
      code: "ENOENT",
    });
    await assert.rejects(embeddedResourceFromFile(missing, "data://file"), {
      code: "ENOENT",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
