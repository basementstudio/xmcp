# Browserbase + xmcp

An authenticated HTTP MCP server for managing Browserbase cloud browser sessions with Node's built-in `fetch`.

| Tool                      | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `create-browser-session`  | Start a billable browser session with a bounded lifetime.  |
| `get-browser-session`     | Read the session's status, expiry, region, and project.    |
| `release-browser-session` | Request that Browserbase close the session and stop usage. |

This example manages the session lifecycle. Navigation, screenshots, and page interaction belong in your trusted Playwright, Puppeteer, or Stagehand automation. See Browserbase's [Playwright quickstart](https://docs.browserbase.com/welcome/quickstarts/playwright) for that workflow. Tool results deliberately omit `connectUrl`, `signingKey`, and other connection credentials; they contain `session` metadata and a `dashboardUrl` instead.

## Run

Use Node 22 and pnpm. Get a Browserbase API key from your [dashboard](https://www.browserbase.com/). From this repository's root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/browserbase-http/.env.example examples/browserbase-http/.env
# Fill in BROWSERBASE_API_KEY and a separate MCP_API_KEY.
pnpm --filter browserbase-http build
pnpm --filter browserbase-http start
```

Generate `MCP_API_KEY` with `openssl rand -hex 32`. Clients send it as `x-api-key` on **every** MCP request. The provider API key is sent only to `https://api.browserbase.com` using `X-BB-API-Key`. Redirects are disabled.

`BROWSERBASE_PROJECT_ID` is optional: Browserbase infers the project from the API key when omitted. Set it to select a specific project. All MCP clients share the provider key's session access, including the ability to release sessions by ID. Use this example with trusted clients; it does not implement per-user ownership.

Connect your client to the printed MCP endpoint, normally `http://localhost:3001/mcp` (xmcp chooses another available port when needed).

## Create, inspect, and release a session

In another terminal, set the same client key and the printed endpoint:

```sh
export MCP_API_KEY='your-client-secret'
export MCP_URL='http://localhost:3001/mcp'
curl "$MCP_URL" \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create-browser-session","arguments":{"timeoutSeconds":60}}}'
```

Creation starts a real, billable browser. `timeoutSeconds` defaults to **300 seconds** and accepts integers from **60 to 3,600**; the example caps the lifetime at one hour to bound forgotten sessions. Browserbase plan limits still apply. `keepAlive` defaults to `false`. Set it to `true` only when the browser must survive automation disconnects; Browserbase requires a paid plan for [keep alive](https://docs.browserbase.com/platform/browser/long-sessions/keep-alive).

Copy `session.id` from the JSON text result, then inspect it:

```sh
export BROWSER_SESSION_ID='paste-the-session-uuid'
curl "$MCP_URL" \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"get-browser-session\",\"arguments\":{\"sessionId\":\"$BROWSER_SESSION_ID\"}}}"
```

Release it when finished, including after an automation failure:

```sh
curl "$MCP_URL" \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"release-browser-session\",\"arguments\":{\"sessionId\":\"$BROWSER_SESSION_ID\"}}}"
```

Release sends `POST /v1/sessions/{id}` with `status: "REQUEST_RELEASE"`. It may interrupt active automation. The response can still show `RUNNING`; use `get-browser-session` or the dashboard to confirm a terminal state (`COMPLETED`, `TIMED_OUT`, or `ERROR`). A release response is not proof that billing has already stopped. The configured timeout bounds sessions even when a caller never releases them.

## Errors and validation

Missing, incorrect, or unconfigured MCP keys return HTTP 401. Provider errors become MCP tool errors with an HTTP status, without raw provider error bodies. Requests time out after 30 seconds and are never retried automatically. A failed creation or release may already have taken effect: check the dashboard before retrying, and release unused sessions to avoid duplicate usage.

```sh
pnpm --filter browserbase-http build
pnpm --filter browserbase-http typecheck
pnpm --filter browserbase-http test
pnpm --filter browserbase-http test:smoke
```

Tests mock **all** provider calls and consume no browser minutes. Built-server tests cover MCP 2025-03-26 and 2026-07-28, authentication, discovery, all three tools, and input validation. Real account permissions, billing, and browser automation require your own Browserbase credentials and are not covered by these tests.

API references: [create](https://docs.browserbase.com/reference/api/create-a-session), [get](https://docs.browserbase.com/reference/api/get-a-session), and [release](https://docs.browserbase.com/reference/api/update-a-session).
