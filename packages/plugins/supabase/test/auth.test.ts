import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { supabaseAuth, getSupabase, getSupabaseUser } from "../src/index.js";

test("rejects service-role/secret configuration", () => {
  for (const key of [
    "sb_secret_never",
    `x.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.x`,
  ]) {
    assert.throws(
      () =>
        supabaseAuth({
          url: "https://example.supabase.co",
          publishableKey: key,
        }),
      /publishable/
    );
  }
});

test("verifies every request and isolates user-scoped database clients", async (context) => {
  const checked: string[] = [];
  const databaseRequests: string[] = [];
  const server = createServer((request, response) => {
    const token = request.headers.authorization?.replace("Bearer ", "") ?? "";
    response.setHeader("content-type", "application/json");
    if (request.url?.startsWith("/auth/v1/user")) {
      checked.push(token);
      if (!["user-a", "user-b"].includes(token)) {
        response.statusCode = 401;
        response.end(JSON.stringify({ message: "invalid private-token" }));
        return;
      }
      response.end(
        JSON.stringify({
          id: token,
          aud: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        })
      );
      return;
    }
    databaseRequests.push(token);
    assert.equal(request.headers.apikey, "sb_publishable_example");
    response.end(JSON.stringify([{ body: token }]));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(
    () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      })
  );
  const options = {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    publishableKey: "sb_publishable_example",
  };
  const middleware = supabaseAuth(options) as Function;
  const run = async (authorization?: string) => {
    let status = 200,
      body: unknown,
      challenge: unknown;
    await middleware(
      { headers: { authorization } },
      {
        setHeader: (_name: string, value: unknown) => {
          challenge = value;
        },
        status: (value: number) => {
          status = value;
          return {
            json: (value: unknown) => {
              body = value;
            },
          };
        },
      },
      async () => {
        const user = getSupabaseUser();
        const { data, error } = await getSupabase()
          .from("notes")
          .select("body");
        assert.equal(error, null);
        assert.deepEqual(data, [{ body: user.id }]);
        body = user.id;
      }
    );
    return { status, body, challenge };
  };
  const results = await Promise.all([
    run("Bearer user-a"),
    run("Bearer user-b"),
  ]);
  assert.deepEqual(
    results.map((x) => x.body),
    ["user-a", "user-b"]
  );
  for (const value of [
    undefined,
    "Basic secret",
    "Bearer invalid",
    "Bearer user-a other",
  ]) {
    const denied = await run(value);
    assert.equal(denied.status, 401);
    assert.ok(denied.challenge);
    assert.doesNotMatch(JSON.stringify(denied.body), /private|secret/);
  }
  await run("Bearer user-a");
  assert.deepEqual(checked.sort(), ["invalid", "user-a", "user-a", "user-b"]);
  assert.deepEqual(databaseRequests.sort(), ["user-a", "user-a", "user-b"]);
  assert.throws(() => getSupabaseUser(), /context/);
  assert.throws(() => getSupabase(), /context/);
});
