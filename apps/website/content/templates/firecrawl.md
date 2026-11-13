---
name: "Firecrawl Web Research"
description: "Scrape pages, extract structured summaries, and discover site URLs through MCP."
category: "integration"
tags: ["firecrawl", "scraping", "research", "http"]
sourceRepo: "basementstudio/xmcp"
path: "examples/firecrawl-http"
deployment: "guides"
---

# Firecrawl Web Research

Scrape pages, extract structured summaries, and discover site URLs through MCP.

## Included workflow

- `scrape-page` returns page Markdown.
- `extract-page-summary` returns a structured title, description, headings, and topics.
- `map-site` discovers one bounded set of URLs without following them automatically.

Provider calls consume Firecrawl credits. Review returned pages as untrusted content. The server uses bounded inputs and response limits, redacts provider errors, and does not retry requests automatically.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace; run these commands from the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/firecrawl-http/.env.example examples/firecrawl-http/.env
```

Configure `examples/firecrawl-http/.env` with `FIRECRAWL_API_KEY`, `MCP_API_KEY`. Generate the separate client secret with `openssl rand -hex 32`. Keep `.env` private. Every client request must include `MCP_API_KEY` as `x-api-key`; all clients share the provider account permissions.

```sh
pnpm --filter firecrawl-http build
pnpm --filter firecrawl-http start
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
    "name": "scrape-page",
    "arguments": {
      "url": "https://example.com"
    }
  }
}
```

## Validate and customize

```sh
pnpm --filter firecrawl-http typecheck
pnpm --filter firecrawl-http test
pnpm --filter firecrawl-http test:smoke
```

Tests mock provider calls; they do not use live credentials or perform real provider actions. Add or adapt tools in `examples/firecrawl-http/src/tools/`.

The deployment menu links to setup guides because this workspace example is not a standalone clone-and-deploy project. Configure the provider variables and client authentication for your target host, and follow its transport setup.

- [Integration guide](/docs/integrations/firecrawl)
- [Complete setup and tool reference](https://github.com/basementstudio/xmcp/tree/main/examples/firecrawl-http#readme)
