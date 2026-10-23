---
name: "Browserbase Browser Sessions"
description: "Create, inspect, and release cloud browser sessions with authenticated MCP tools."
category: "integration"
tags: ["browserbase", "browser", "automation", "http"]
sourceRepo: "basementstudio/xmcp"
path: "examples/browserbase-http"
deployment: "guides"
---

# Browserbase Browser Sessions

Create, inspect, and release cloud browser sessions with authenticated MCP tools.

## Included workflow

- Create sessions with a five-minute default timeout and a one-hour maximum.
- Inspect session status, region, project, and expiry.
- Release sessions when work finishes, including after automation failures.

Creating a session uses billable browser minutes. `keepAlive` defaults to `false` and requires a paid plan when enabled. Connection credentials are excluded from MCP results. Use trusted automation code for navigation and screenshots, and check the dashboard before retrying an uncertain creation or release.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace; run these commands from the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/browserbase-http/.env.example examples/browserbase-http/.env
```

Configure `examples/browserbase-http/.env` with `BROWSERBASE_API_KEY`, `MCP_API_KEY`. Optionally set `BROWSERBASE_PROJECT_ID`; Browserbase otherwise infers the project from the API key. Generate the separate client secret with `openssl rand -hex 32`. Keep `.env` private. Every client request must include `MCP_API_KEY` as `x-api-key`; all clients share the provider account permissions.

```sh
pnpm --filter browserbase-http build
pnpm --filter browserbase-http start
```

Use the endpoint printed by the server, normally `http://localhost:3001/mcp`. In another terminal, check discovery without invoking a provider tool:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

When ready to use the provider, send this `tools/call` request through your MCP client:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create-browser-session",
    "arguments": {
      "timeoutSeconds": 60
    }
  }
}
```

## Validate and customize

```sh
pnpm --filter browserbase-http typecheck
pnpm --filter browserbase-http test
pnpm --filter browserbase-http test:smoke
```

Tests mock provider calls; they do not use live credentials or perform real provider actions. Add or adapt tools in `examples/browserbase-http/src/tools/`.

The deployment menu links to setup guides because this workspace example is not a standalone clone-and-deploy project. Configure the provider variables and client authentication for your target host, and follow its transport setup.

- [Integration guide](/docs/integrations/browserbase)
- [Complete setup and tool reference](https://github.com/basementstudio/xmcp/tree/main/examples/browserbase-http#readme)
