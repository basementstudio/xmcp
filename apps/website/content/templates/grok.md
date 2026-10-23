---
name: "Grok Research Assistant"
description: "Ask Grok questions and research the web or X with source citations."
category: "integration"
tags: ["grok", "xai", "research", "http"]
sourceRepo: "basementstudio/xmcp"
path: "examples/grok-http"
deployment: "guides"
---

# Grok Research Assistant

Ask Grok questions and research the web or X with source citations.

| Tool                   | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `ask-grok`             | Answer a single question without search.         |
| `search-web-with-grok` | Research the web and return available citations. |
| `search-x-with-grok`   | Research X posts and return available citations. |

## Provider access

Create an API key in the [xAI console](https://console.x.ai) and fund the API account. Set `XAI_API_KEY`; optionally set `XAI_MODEL` to a model that supports the requested tools. The default is `grok-4.7`. xAI API billing is separate from X API access and consumer subscriptions.

The server calls the native [Responses API](https://docs.x.ai/developers/rest-api-reference/inference/responses) at `https://api.x.ai/v1/responses` with a Bearer token. Grok's X search does not need an X OAuth token and cannot publish posts. All authorized MCP clients consume the same xAI account's credits.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace. From the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/grok-http/.env.example examples/grok-http/.env
```

Configure `examples/grok-http/.env` with `XAI_API_KEY` and a separate `MCP_API_KEY`. Generate the client secret with `openssl rand -hex 32`. Keep `.env` private. Every MCP request must include that client secret as `x-api-key`; only the provider credential is sent upstream.

```sh
pnpm --filter grok-http build
pnpm --filter grok-http start
```

Connect to the endpoint printed by the server, normally `http://localhost:3001/mcp`. In another terminal, check tool discovery without contacting the provider:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

When ready to contact the provider, send this request through your MCP client:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "ask-grok",
    "arguments": {
      "prompt": "Explain what an MCP transport does in two sentences."
    }
  }
}
```

## Ask and research

All three tools accept `prompt` (1–8,000 characters after trimming) and optional `maxOutputTokens` (128–4,096, default 1,024). Each call is independent; the server sends no previous response ID or conversation history.

Call `search-web-with-grok` with:

```json
{
  "prompt": "Find the current MCP transport documentation and summarize it with sources.",
  "maxOutputTokens": 1024
}
```

Or call `search-x-with-grok` to research public X posts:

```json
{
  "prompt": "Find recent public posts about xmcp and summarize recurring questions with sources."
}
```

The JSON text result contains `responseId`, `model`, `text`, and `citations` (HTTP(S) source URLs and optional titles). Only completed assistant text is returned. Reasoning and internal tool records are excluded; incomplete responses, refusals, and missing answer text return errors. Citation URLs are deduplicated; offsets are omitted because output text blocks are joined. Citations may be absent; inspect sources before relying on an answer.

Search tools require their corresponding native [web search](https://docs.x.ai/developers/tools/web-search) or [X search](https://docs.x.ai/developers/tools/x-search) tool, with `max_turns: 3` and parallel tool calls disabled. Three turns do not mean three individual searches or a hard spending limit. `maxOutputTokens` limits visible output only; reasoning and search usage can be billed separately. Set provider-side spending controls appropriate to your account.

Requests use `store: false` to disable later response retrieval through the Responses API. This does not promise that the provider retains no data under its broader policies. Streaming is disabled, and the server does not store chat history.

## Draft an X reply

Use this server to research or draft text, then review it and explicitly publish through the separate [X integration](/docs/integrations/x). The X server requires its own OAuth user token. Neither Grok research tool posts or automatically triggers publication.

## Errors and limits

Missing or incorrect client keys return HTTP 401 before reaching xAI. Provider failures return tool errors with HTTP status and no raw error body. Requests time out after 90 seconds and are never retried automatically. A local timeout does not guarantee that provider processing or billing stopped. Model availability, credits, search access, and real answer quality require a live API account.

## Validation

```sh
pnpm --filter grok-http build
pnpm --filter grok-http typecheck
pnpm --filter grok-http test
pnpm --filter grok-http test:smoke
```

Tests intercept all provider requests. They do not publish real posts, consume API credits, or validate live credentials. Built-server tests cover discovery, all three tools, invalid input, authentication on every call, and MCP 2025-03-26 and 2026-07-28. No new SDK dependency is required; the tools use Node's built-in `fetch`.

The deployment menu links to hosting guides because this workspace example is not a standalone clone-and-deploy project. Configure provider credentials and client authentication on the target host.

- [Integration guide](/docs/integrations/grok)
- [Complete source](https://github.com/basementstudio/xmcp/tree/main/examples/grok-http)
