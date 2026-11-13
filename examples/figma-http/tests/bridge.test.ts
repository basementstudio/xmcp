import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COMMAND_TIMEOUT_MS,
  FigmaBridge,
  POLL_TIMEOUT_MS,
} from "../src/bridge";

const info = {
  sessionId: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
  pageId: "1:2",
  documentName: "Demo",
  pageName: "Page",
};
const result = { content: [{ type: "text" as const, text: "created" }] };

test("routes commands to a pinned session, rejects competing plugins and mismatched results", async () => {
  const bridge = new FigmaBridge();
  const poll = bridge.poll(info, new AbortController().signal);
  assert.deepEqual(bridge.status(), { connected: true, busy: false, ...info });
  await assert.rejects(
    bridge.poll({ ...info, sessionId: "other" }, new AbortController().signal),
    /already connected/
  );
  await assert.rejects(bridge.execute("other", "create", {}), /sessionId/);
  const execution = bridge.execute(info.sessionId, "create", { name: "Frame" });
  const command = await poll;
  assert.ok(command);
  assert.equal(command.pageId, info.pageId);
  assert.deepEqual(command.arguments, { name: "Frame" });
  await assert.rejects(
    bridge.execute(info.sessionId, "create", {}),
    /sessionId/
  );
  assert.equal(bridge.complete("other", command.id, result), false);
  assert.equal(bridge.complete(info.sessionId, "wrong", result), false);
  assert.equal(bridge.complete(info.sessionId, command.id, result), true);
  assert.deepEqual(await execution, result);
  assert.equal(bridge.complete(info.sessionId, command.id, result), false);
  assert.equal(bridge.status().connected, false);
});

test("disconnect removes an idle plugin and denies subsequent calls", async () => {
  const bridge = new FigmaBridge();
  const controller = new AbortController();
  const poll = bridge.poll(info, controller.signal);
  controller.abort();
  assert.equal(await poll, null);
  assert.equal(bridge.status().connected, false);
  await assert.rejects(
    bridge.execute(info.sessionId, "read", {}),
    /Connect the Figma plugin/
  );
});

test("poll expiry releases the connection without a busy polling loop", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const bridge = new FigmaBridge();
  const poll = bridge.poll(info, new AbortController().signal);
  context.mock.timers.tick(POLL_TIMEOUT_MS);
  assert.equal(await poll, null);
  assert.equal(bridge.status().connected, false);
});

test("timeout never requeues a write and late results cannot satisfy a new command", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const bridge = new FigmaBridge();
  const poll = bridge.poll(info, new AbortController().signal);
  const execution = bridge.execute(info.sessionId, "create", {});
  const rejection = assert.rejects(execution, /may have executed/);
  const command = await poll;
  assert.ok(command);
  context.mock.timers.tick(COMMAND_TIMEOUT_MS);
  await rejection;
  assert.equal(bridge.complete(info.sessionId, command.id, result), false);
  const controller = new AbortController();
  const nextPoll = bridge.poll(info, controller.signal);
  assert.equal(bridge.status().busy, false);
  controller.abort();
  assert.equal(await nextPoll, null);
});
