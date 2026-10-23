---
name: "Linear Issue Triage"
description: "Discover teams, inspect issues, and create requested work items in Linear."
category: "integration"
tags: ["linear", "issues", "project-management", "http"]
sourceRepo: "basementstudio/xmcp"
path: "examples/linear-http"
deployment: "guides"
---

# Linear Issue Triage

Discover teams, inspect issues, and create requested work items in Linear.

## Included workflow

- Discover teams and their IDs with `list-linear-teams`.
- Read a page of issues for a selected team with `list-linear-issues`.
- Create a real issue with `create-linear-issue` when the user requests it.

Use a Linear personal API key with the permissions required by these tools. Team IDs come from discovery. Issue creation is a write operation: after an uncertain failure, check Linear before retrying to avoid duplicates.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace; run these commands from the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/linear-http/.env.example examples/linear-http/.env
```

Configure `examples/linear-http/.env` with `LINEAR_API_KEY`, `MCP_API_KEY`. Generate the separate client secret with `openssl rand -hex 32`. Keep `.env` private. Every client request must include `MCP_API_KEY` as `x-api-key`; all clients share the provider account permissions.

```sh
pnpm --filter linear-http build
pnpm --filter linear-http start
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
    "name": "list-linear-teams",
    "arguments": {
      "limit": 10
    }
  }
}
```

## Validate and customize

```sh
pnpm --filter linear-http typecheck
pnpm --filter linear-http test
pnpm --filter linear-http test:smoke
```

Tests mock provider calls; they do not use live credentials or perform real provider actions. Add or adapt tools in `examples/linear-http/src/tools/`.

The deployment menu links to setup guides because this workspace example is not a standalone clone-and-deploy project. Configure the provider variables and client authentication for your target host, and follow its transport setup.

- [Integration guide](/docs/integrations/linear)
- [Complete setup and tool reference](https://github.com/basementstudio/xmcp/tree/main/examples/linear-http#readme)
