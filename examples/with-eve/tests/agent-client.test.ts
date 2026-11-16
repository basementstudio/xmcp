import assert from "node:assert/strict";
import { test } from "node:test";
import { askAgent, type EveClient } from "../src/agent-client";

type Result = { status: string; reply?: string };

function fake(result: (signal: AbortSignal) => Promise<Result>) {
  const creates: unknown[] = [];
  const client = {
    sessions: {
      create: async (options: { signal: AbortSignal }) => {
        creates.push(options);
        return { delivery: { result: () => result(options.signal) } };
      },
    },
  } as unknown as EveClient;
  return { client, creates };
}

test("returns the reply from a single new session", async () => {
  const { client, creates } = fake(async () => ({
    status: "completed",
    reply: "3–5 business days",
  }));
  const text = await askAgent(
    "Shipping?",
    new AbortController().signal,
    client
  );
  assert.equal(text, "3–5 business days");
  assert.equal(creates.length, 1);
});

test("hides failed runs and upstream errors behind one error", async () => {
  for (const result of [
    async () => ({ status: "failed" }),
    async () => ({ status: "completed", reply: " " }),
    async () => {
      throw new Error("upstream secret");
    },
  ]) {
    const { client, creates } = fake(result);
    await assert.rejects(
      askAgent("Shipping?", new AbortController().signal, client),
      { message: "eve agent request failed" }
    );
    assert.equal(creates.length, 1);
  }
});

test("forwards cancellation and surfaces it as an abort", async () => {
  const controller = new AbortController();
  const { client } = fake(
    (signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
        controller.abort();
      })
  );
  await assert.rejects(askAgent("Shipping?", controller.signal, client), {
    name: "AbortError",
  });
});
