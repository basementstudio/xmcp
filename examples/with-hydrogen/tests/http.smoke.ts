import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { fakeStorefront, product } from "./storefront";

/** Bounds server startup and every HTTP exchange without polling sleeps. */
const TEST_TIMEOUT_MS = 20_000;

const KEY = "client-test-key";

test(
  "the React Router server keeps storefront routes and serves /mcp",
  { timeout: TEST_TIMEOUT_MS },
  async (context) => {
    const storefront = await fakeStorefront(context);
    const probe = createServer().listen(0, "127.0.0.1");
    await once(probe, "listening");
    const { port } = probe.address() as AddressInfo;
    probe.close();
    await once(probe, "close");

    const child = spawn(
      process.execPath,
      ["node_modules/@react-router/serve/bin.cjs", "build/server/index.js"],
      {
        env: {
          ...process.env,
          PORT: String(port),
          HOST: "127.0.0.1",
          MCP_API_KEY: KEY,
          PUBLIC_STORE_DOMAIN: storefront.domain,
          PRIVATE_STOREFRONT_API_TOKEN: "",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    context.after(async () => {
      if (child.exitCode === null) {
        child.kill();
        await once(child, "exit");
      }
    });
    await new Promise<void>((resolve, reject) => {
      let output = "";
      child.stdout.on("data", (data) => {
        output += data;
        if (output.includes(String(port))) resolve();
      });
      child.once("error", reject);
      child.once("exit", (code) => reject(new Error(`Server exited: ${code}`)));
    });

    const origin = `http://127.0.0.1:${port}`;
    const signal = AbortSignal.timeout(TEST_TIMEOUT_MS);
    const home = await fetch(origin, { signal });
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Dog bed/);

    let id = 0;
    const send = (method: string, params: unknown, token?: string) =>
      fetch(`${origin}/mcp`, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      });
    const decode = async (response: Response) => {
      assert.equal(response.status, 200);
      const text = await response.text();
      return JSON.parse(
        text.startsWith("{")
          ? text
          : text
              .split("\n")
              .find((line) => line.startsWith("data: "))!
              .slice(6)
      );
    };
    const call = async (name: string, args: unknown) =>
      decode(await send("tools/call", { name, arguments: args }, KEY));

    const [allowed, denied] = await Promise.all([
      send("tools/list", {}, KEY),
      send("tools/list", {}, "wrong"),
    ]);
    assert.equal(denied.status, 401);
    assert.equal((await send("tools/list", {})).status, 401);
    const names = (await decode(allowed)).result.tools.map(
      (tool: { name: string }) => tool.name
    );
    assert.deepEqual(names.sort(), ["get-product", "search-products"]);

    const search = await call("search-products", { query: "bed" });
    assert.deepEqual(JSON.parse(search.result.content[0].text), [product]);
    const found = await call("get-product", { handle: "dog-bed" });
    assert.deepEqual(JSON.parse(found.result.content[0].text), product);

    const before = storefront.requests.length;
    const invalid = await call("get-product", { handle: "../admin" });
    assert.ok(invalid.error || invalid.result?.isError);
    const tooMany = await call("search-products", { query: "bed", first: 500 });
    assert.ok(tooMany.error || tooMany.result?.isError);
    assert.equal(storefront.requests.length, before);

    const failed = await call("get-product", { handle: "broken" });
    assert.equal(failed.result.isError, true);
    assert.doesNotMatch(failed.result.content[0].text, /Internal secret/);
    for (const request of storefront.requests) {
      assert.equal(request.headers.authorization, undefined);
    }
  }
);
