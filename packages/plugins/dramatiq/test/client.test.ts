import assert from "node:assert/strict";
import { once } from "node:events";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import { createDramatiqClient, DramatiqBridgeError } from "../src/index.js";

type Handler = (
  request: IncomingMessage,
  body: string,
  response: ServerResponse
) => void;

/** A local bridge that records every request it receives. */
async function bridge(context: TestContext, handler: Handler) {
  const requests: {
    method?: string;
    url?: string;
    auth?: string;
    body: string;
  }[] = [];
  const server = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    requests.push({
      method: request.method,
      url: request.url,
      auth: request.headers.authorization,
      body,
    });
    handler(request, body, response);
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => server.close());
  const { port } = server.address() as AddressInfo;
  return { baseUrl: `http://127.0.0.1:${port}/bridge`, requests };
}

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};

test("enqueues once with the bearer token and returns the job ID", async (context) => {
  const { baseUrl, requests } = await bridge(
    context,
    (_request, _body, response) => json(response, 202, { jobId: "job-1" })
  );
  const client = createDramatiqClient({
    baseUrl: `${baseUrl}/`,
    token: "secret",
  });
  const job = await client.enqueue({ actor: "count_words", args: ["a b"] });
  assert.deepEqual(job, { jobId: "job-1" });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "POST");
  assert.equal(requests[0].url, "/bridge/v1/jobs");
  assert.equal(requests[0].auth, "Bearer secret");
  assert.deepEqual(JSON.parse(requests[0].body), {
    actor: "count_words",
    args: ["a b"],
  });
});

test("rejects bridge errors without retrying", async (context) => {
  for (const status of [401, 422, 503]) {
    const { baseUrl, requests } = await bridge(
      context,
      (_request, _body, response) => json(response, status, { detail: "nope" })
    );
    const client = createDramatiqClient({ baseUrl, token: "secret" });
    await assert.rejects(
      client.enqueue({ actor: "count_words", args: ["a"] }),
      (error: unknown) =>
        error instanceof DramatiqBridgeError && error.status === status
    );
    assert.equal(requests.length, 1);
  }
});

test("rejects malformed bridge responses", async (context) => {
  const { baseUrl } = await bridge(context, (request, _body, response) =>
    json(response, request.method === "POST" ? 202 : 200, { status: "weird" })
  );
  const client = createDramatiqClient({ baseUrl, token: "secret" });
  await assert.rejects(client.enqueue({ actor: "count_words" }), {
    message: "Invalid bridge job response",
  });
  await assert.rejects(client.getResult("job-1"), {
    message: "Invalid bridge result response",
  });
});

test("maps every result state", async (context) => {
  const states: Record<string, [number, unknown]> = {
    done: [200, { status: "succeeded", result: { words: 2 } }],
    broken: [200, { status: "failed", error: "Actor execution failed" }],
    pending: [200, { status: "unavailable" }],
    missing: [404, { detail: "Job not found" }],
  };
  const { baseUrl, requests } = await bridge(
    context,
    (request, _body, response) => {
      const id = decodeURIComponent(request.url!.split("/").at(-1)!);
      json(response, ...(states[id] ?? [500, {}]));
    }
  );
  const client = createDramatiqClient({ baseUrl, token: "secret" });
  assert.deepEqual(await client.getResult("done"), {
    status: "succeeded",
    result: { words: 2 },
  });
  assert.deepEqual(await client.getResult("broken"), {
    status: "failed",
    error: "Actor execution failed",
  });
  assert.deepEqual(await client.getResult("pending"), {
    status: "unavailable",
  });
  assert.deepEqual(await client.getResult("missing"), { status: "not_found" });
  await assert.rejects(client.getResult("other/../x"), DramatiqBridgeError);
  assert.equal(requests.at(-1)!.url, "/bridge/v1/jobs/other%2F..%2Fx");
});

test("never follows redirects with the token", async (context) => {
  const { baseUrl } = await bridge(context, (_request, _body, response) => {
    response.writeHead(307, { location: "http://example.invalid/steal" });
    response.end();
  });
  const client = createDramatiqClient({ baseUrl, token: "secret" });
  await assert.rejects(client.getResult("job-1"), TypeError);
});

test("forwards abort signals", async (context) => {
  const { baseUrl } = await bridge(context, () => {
    // Never responds; only the abort can settle the request.
  });
  const client = createDramatiqClient({ baseUrl, token: "secret" });
  const controller = new AbortController();
  const pending = client.getResult("job-1", { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});

test("validates configuration and inputs before sending", async () => {
  const create = (config: unknown) => () =>
    createDramatiqClient(config as Parameters<typeof createDramatiqClient>[0]);
  assert.throws(create({ baseUrl: undefined, token: "secret" }), {
    message: "createDramatiqClient: baseUrl is required",
  });
  assert.throws(create({ baseUrl: "http://bridge", token: undefined }), {
    message: "createDramatiqClient: token is required",
  });
  assert.throws(create({ baseUrl: "http://bridge", token: " " }), {
    message: "createDramatiqClient: token is required",
  });
  assert.throws(create({ baseUrl: "not a url", token: "secret" }), {
    message: "createDramatiqClient: baseUrl must be a valid URL",
  });
  for (const baseUrl of [
    "ftp://bridge",
    "http://user:pass@bridge",
    "http://bridge?x=1",
    "http://bridge#x",
  ]) {
    assert.throws(create({ baseUrl, token: "secret" }), /without credentials/);
  }
  const client = createDramatiqClient({
    baseUrl: "http://bridge",
    token: "secret",
  });
  await assert.rejects(client.enqueue({ actor: " " }), {
    message: "An actor is required",
  });
  await assert.rejects(client.getResult(""), {
    message: "A job ID is required",
  });
});
