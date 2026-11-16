import assert from "node:assert/strict";
import { test } from "node:test";
import { askAgent, type Conversation } from "../src/agent-client";

type Admission = Awaited<ReturnType<Conversation["send"]>>;

const admission = { submissionId: "s1" } as Admission;

function fake(read: Conversation["read"]) {
  const sends: unknown[] = [];
  const conversation = {
    send: async (options: unknown) => {
      sends.push(options);
      return admission;
    },
    read,
  } as Conversation;
  return { conversation, sends };
}

test("returns the reply from a single submission", async () => {
  const { conversation, sends } = fake((async () => ({
    text: "3–5 business days",
  })) as unknown as Conversation["read"]);
  const text = await askAgent(
    "Shipping?",
    new AbortController().signal,
    conversation
  );
  assert.equal(text, "3–5 business days");
  assert.equal(sends.length, 1);
});

test("hides upstream failures and empty replies behind one error", async () => {
  const failing = fake((async () => {
    throw new Error("upstream secret");
  }) as Conversation["read"]);
  await assert.rejects(
    askAgent("Shipping?", new AbortController().signal, failing.conversation),
    { message: "Flue agent request failed" }
  );
  assert.equal(failing.sends.length, 1);
  const empty = fake((async () => ({
    text: "  ",
  })) as unknown as Conversation["read"]);
  await assert.rejects(
    askAgent("Shipping?", new AbortController().signal, empty.conversation),
    { message: "Flue agent request failed" }
  );
});

test("forwards cancellation and surfaces it as an abort", async () => {
  const controller = new AbortController();
  const { conversation } = fake(
    ((_target, options) =>
      new Promise((_resolve, reject) => {
        options!.signal!.addEventListener("abort", () =>
          reject(options!.signal!.reason)
        );
        controller.abort();
      })) as Conversation["read"]
  );
  await assert.rejects(askAgent("Shipping?", controller.signal, conversation), {
    name: "AbortError",
  });
});
