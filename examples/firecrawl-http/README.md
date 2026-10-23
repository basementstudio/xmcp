# Firecrawl + xmcp

An authenticated HTTP MCP server for reading web pages through [Firecrawl's REST API](https://docs.firecrawl.dev/api-reference/endpoint/scrape), using Node's built-in `fetch`.

| Tool                   | Behavior                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| `scrape-page`          | Read one page as Markdown, with available page metadata.                   |
| `extract-page-summary` | Extract a page's title, description, headings, and topics using JSON mode. |
| `map-site`             | Discover site URLs, optionally ordered by relevance to a search query.     |

These tools read source pages and consume the server owner's Firecrawl credits. There are no automatic retries, background crawls, or follow-up scrapes of discovered URLs.

## Run

Use Node 22 and pnpm. Create an API key in your [Firecrawl dashboard](https://www.firecrawl.dev/app), then run from the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/firecrawl-http/.env.example examples/firecrawl-http/.env
# Fill in FIRECRAWL_API_KEY and a separate MCP_API_KEY.
pnpm --filter firecrawl-http build
pnpm --filter firecrawl-http start
```

Generate the separate `MCP_API_KEY` with `openssl rand -hex 32`. Keep `.env` private. Clients send this secret as `x-api-key` on **every** MCP request. The server sends only `FIRECRAWL_API_KEY` to `https://api.firecrawl.dev` as a Bearer token. Provider credentials are never tool arguments.

This example uses one shared Firecrawl account for trusted clients. All callers consume that account's credits; the MCP secret does not establish individual users or quotas. Requested URLs, queries, and extraction instructions are sent to Firecrawl for processing.

Use the endpoint printed at startup (normally `http://localhost:3001/mcp`; xmcp selects another available port if needed). Configure an HTTP MCP client with that URL and the `x-api-key` header. The server exposes the three tools above.

## Scrape a page

In another terminal, set the same MCP secret and call the server:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"scrape-page","arguments":{"url":"https://example.com"}}}'
```

The tool returns JSON in text content, with `success: true`, `data.markdown`, and any available `data.metadata`. `onlyMainContent` defaults to `true`; set it to `false` to include navigation and footers. Inputs must be HTTP(S) URLs without embedded credentials.

## Extract structured facts

Change the call's tool name to `extract-page-summary`, keeping the same `url` argument. Its `data.json` contains:

```json
{
  "title": "Example Domain",
  "description": null,
  "headings": ["Example Domain"],
  "topics": ["Documentation examples"]
}
```

This is an illustrative shape, not a guaranteed result for that URL. [Firecrawl JSON mode](https://docs.firecrawl.dev/features/llm-extract) generates these fields from the page. Missing titles/descriptions are nullable and missing headings/topics are empty arrays. Review extracted facts against the source before using them; the tool does not calculate SEO scores.

## Discover site URLs

Call `map-site` with arguments such as:

```json
{
  "url": "https://example.com",
  "search": "pricing",
  "limit": 20,
  "includeSubdomains": false
}
```

The [map endpoint](https://docs.firecrawl.dev/api-reference/endpoint/map) returns `links`, each containing a `url` and optional title/description. `search` orders results by relevance; it is not a strict filter. `limit` defaults to 20 and accepts 1–100; `includeSubdomains` defaults to `false`. Mapping discovers URLs without returning all their page content. Select a URL and call `scrape-page` separately to read it.

For example, use a URL discovered through xmcp's Profound integration, scrape it, and extract a page summary to compare with your own content. The agent chooses each step explicitly.

## Errors and testing

Missing or incorrect MCP keys return HTTP 401. Missing provider credentials, network failures, malformed responses, or provider failures return `isError: true`. HTTP failures include their status; HTTP 429 includes `retryAfterSeconds` when the provider supplies a numeric `Retry-After`. Raw provider error bodies and credentials are not echoed.

Requests time out after 75 seconds, allowing Firecrawl's default 60-second scrape budget plus network overhead. Configure the MCP client's tool timeout accordingly. The example does not retry automatically; check credits and provider status before retrying a failed request.

Validate without credentials:

```sh
pnpm --filter firecrawl-http build
pnpm --filter firecrawl-http typecheck
pnpm --filter firecrawl-http test
pnpm --filter firecrawl-http test:smoke
```

Tests mock every outbound provider request. The smoke tests start the built server and verify discovery, authentication on every call, and execution of all three tools with both MCP 2025-03-26 (including initialization) and MCP 2026-07-28 (negotiation metadata repeated on each request, without initialization or a session). Live extraction quality and account access require your own Firecrawl key; the curl walkthrough makes a live request and may consume credits.
