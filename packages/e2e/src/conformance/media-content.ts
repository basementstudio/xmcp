import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "media-content",
    "returns image, audio and embedded resources alongside text",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "media-content", arguments: {} },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      assert.deepEqual(result.content, [
        { type: "text", text: "A pixel and its description" },
        {
          type: "image",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          mimeType: "image/png",
        },
        { type: "audio", data: "AP8=", mimeType: "audio/wav" },
        {
          type: "resource",
          resource: {
            uri: "note://pixel",
            text: "One pixel",
            mimeType: "text/plain",
          },
        },
        {
          type: "resource",
          resource: {
            uri: "data://bytes",
            blob: "AP8=",
            mimeType: "application/octet-stream",
          },
        },
      ]);
    }
  );
}
