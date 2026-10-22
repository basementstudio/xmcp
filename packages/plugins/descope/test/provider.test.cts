import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { once } from "node:events";
import { test, type TestContext } from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import { descopeProvider } from "../src/provider.js";
import { getSession } from "../src/session.js";

const request = globalThis.fetch;
const projectId = `P${"a".repeat(27)}`;
const signingKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = {
  ...signingKey.publicKey.export({ format: "jwk" }),
  kid: "test-key",
  alg: "RS256",
};

function token(
  issuer: string,
  { expired = false, key = signingKey.privateKey } = {}
) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: jwk.kid })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: issuer,
      sub: "test-user",
      iat: now,
      exp: expired ? now - 60 : now + 300,
    })
  ).toString("base64url");
  const message = `${header}.${payload}`;
  return `${message}.${sign("RSA-SHA256", Buffer.from(message), key).toString("base64url")}`;
}

// Use CommonJS in this test to load xmcp's bundled CommonJS context exports.
async function server(
  t: TestContext,
  issuerURL: string,
  {
    explicitProjectId,
    discovery,
  }: {
    explicitProjectId?: string;
    discovery?: Record<string, unknown>;
  } = {}
) {
  const origin = new URL(issuerURL).origin;
  const upstreamRequests: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input);
    upstreamRequests.push(url.href);
    if (url.origin === origin && url.pathname.startsWith("/v2/keys/")) {
      return Response.json({ keys: [jwk] });
    }
    if (url.href === `${issuerURL}/.well-known/openid-configuration`) {
      return discovery
        ? Response.json(discovery)
        : new Response(null, { status: 503 });
    }
    return Response.json({ keys: [] }, { status: 404 });
  });

  const provider = descopeProvider({
    issuerURL,
    baseURL: "https://mcp.example.test",
    ...(explicitProjectId ? { projectId: explicitProjectId } : {}),
  });
  assert.ok("router" in provider && "middleware" in provider);
  const app = express();
  app.use(provider.router);
  app.use(provider.middleware);
  app.post("/mcp", (_req, res) => res.json({ userId: getSession().userId }));
  const listener = app.listen(0, "127.0.0.1");
  t.after(async () => {
    listener.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      listener.close((error) => (error ? reject(error) : resolve()))
    );
  });
  await once(listener, "listening");
  return {
    url: `http://127.0.0.1:${(listener.address() as AddressInfo).port}`,
    upstreamRequests,
  };
}

for (const [name, issuer, explicitProjectId] of [
  ["default host and legacy issuer", `https://api.descope.com/${projectId}`],
  [
    "regional host and agentic issuer",
    `https://api.euw1.descope.com/v1/apps/agentic/Peuw1${"a".repeat(27)}/server`,
  ],
  [
    "alternate environment",
    `https://api.descope.org/v1/apps/agentic/${projectId}/server`,
  ],
  ["custom origin with a port", `https://auth.example.test:8443/${projectId}`],
  [
    "explicit project ID",
    `https://api.descope.org/v1/apps/agentic/${projectId}/server`,
    projectId,
  ],
] as const) {
  test(`validates tokens and keeps fallback JWKS on the ${name}`, async (t) => {
    const { url, upstreamRequests } = await server(t, issuer, {
      explicitProjectId,
    });
    const response = await request(`${url}/mcp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token(issuer)}` },
    });
    assert.equal(response.status, 200, JSON.stringify(upstreamRequests));
    assert.deepEqual(await response.json(), { userId: "test-user" });

    const metadata = await request(
      `${url}/.well-known/oauth-authorization-server`
    ).then((response) => response.json());
    const expectedProject = new URL(issuer).pathname.includes("Peuw1")
      ? `Peuw1${"a".repeat(27)}`
      : projectId;
    assert.equal(metadata.issuer, issuer);
    assert.equal(
      metadata.jwks_uri,
      `${new URL(issuer).origin}/${expectedProject}/.well-known/jwks.json`
    );
    assert.ok(
      upstreamRequests.includes(
        `${new URL(issuer).origin}/v2/keys/${expectedProject}`
      )
    );
  });
}

test("preserves upstream discovery metadata", async (t) => {
  const issuer = `https://api.descope.org/${projectId}`;
  const discovery = {
    issuer,
    jwks_uri: "https://keys.example.test/keys.json",
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
  };
  const { url } = await server(t, issuer, { discovery });
  const response = await request(
    `${url}/.well-known/oauth-authorization-server`
  );
  assert.deepEqual(await response.json(), discovery);
});

test("still rejects missing, expired, and incorrectly signed tokens", async (t) => {
  const issuer = `https://api.descope.org/${projectId}`;
  const { url } = await server(t, issuer);
  for (const [bearer, error] of [
    [undefined, "unauthorized"],
    [token(issuer, { expired: true }), "invalid_token"],
    [token(issuer, { key: otherKey.privateKey }), "invalid_token"],
  ]) {
    const response = await request(`${url}/mcp`, {
      method: "POST",
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, error);
    assert.match(response.headers.get("www-authenticate") ?? "", /^Bearer /);
  }
});
