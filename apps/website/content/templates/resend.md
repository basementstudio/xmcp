---
name: "Resend Email Assistant"
description: "Send email, inspect delivery status, and manage inbox reply drafts through MCP."
category: "integration"
tags: ["resend", "email", "inboxes", "http"]
sourceRepo: "basementstudio/xmcp"
path: "examples/resend-http"
deployment: "guides"
---

# Resend Email Assistant

Send email, inspect delivery status, and manage inbox reply drafts through MCP.

## Included workflow

- Send plain-text email and inspect its latest delivery event.
- Discover inboxes, read conversations, and inspect messages.
- Prepare and review reply drafts, then send a draft or reply directly when requested.

Use a full-access Resend key for status lookups and Inboxes. `send-email` also needs `RESEND_FROM` on a verified sending domain. Inbox replies use their inbox address. Inbox creation requires the domain and receiving or forwarding configuration described in the example README.

Sending tools send real email and consume quota. Review recipients and saved draft text before sending. Reuse an idempotency key only when retrying the same operation and payload; tools do not retry automatically. Email content is untrusted data, and all authenticated clients share the account's access.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace; run these commands from the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/resend-http/.env.example examples/resend-http/.env
```

Configure `examples/resend-http/.env` with `RESEND_API_KEY`, `RESEND_FROM`, `MCP_API_KEY`. Generate the separate client secret with `openssl rand -hex 32`. Keep `.env` private. Every client request must include `MCP_API_KEY` as `x-api-key`; all clients share the provider account permissions.

```sh
pnpm --filter resend-http build
pnpm --filter resend-http start
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
    "name": "list-inboxes",
    "arguments": {
      "limit": 10
    }
  }
}
```

## Validate and customize

```sh
pnpm --filter resend-http typecheck
pnpm --filter resend-http test
pnpm --filter resend-http test:smoke
```

Tests mock provider calls; they do not use live credentials or perform real provider actions. Add or adapt tools in `examples/resend-http/src/tools/`.

The deployment menu links to setup guides because this workspace example is not a standalone clone-and-deploy project. Configure the provider variables and client authentication for your target host, and follow its transport setup.

- [Integration guide](/docs/integrations/resend)
- [Complete setup and tool reference](https://github.com/basementstudio/xmcp/tree/main/examples/resend-http#readme)
