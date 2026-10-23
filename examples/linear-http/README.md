# Linear + xmcp

An authenticated HTTP MCP server using Linear's [GraphQL API](https://linear.app/developers/graphql) and Node's built-in `fetch`. No additional provider SDK is required.

| Tool                  | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `list-linear-teams`   | Discover team UUIDs, keys, and names accessible to the server key.  |
| `list-linear-issues`  | List one page of issues belonging to a selected team.               |
| `create-linear-issue` | Create a real issue with a title and optional Markdown description. |

## Run

Use Node 22 and pnpm. Create a **personal API key** in Linear's **Settings → Security & access**. Choose access appropriate to your teams and intended operations. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/linear-http/.env.example examples/linear-http/.env
# Fill in LINEAR_API_KEY and a separate MCP_API_KEY.
pnpm --filter linear-http build
pnpm --filter linear-http start
```

Generate `MCP_API_KEY` with `openssl rand -hex 32`. Keep `.env` private. Clients send it as `x-api-key` on every MCP request. The provider key goes only to `https://api.linear.app/graphql` as `Authorization: <key>`, without the Bearer prefix used by OAuth tokens. This example accepts personal API keys, not OAuth access tokens.

All clients share the server key's Linear access, including permission to create issues. Team selection is a query filter, not per-user authorization. Use this example with trusted clients; applications serving separate users should implement their own authorization and [OAuth flow](https://linear.app/developers/oauth-2-0-authentication).

Connect your MCP client to the endpoint printed at startup, normally `http://localhost:3001/mcp`. xmcp selects another available port if needed.

## Discover teams and issues

In another terminal, set the same MCP key:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list-linear-teams","arguments":{"limit":10}}}'
```

The text result contains JSON with `teams.nodes` and `teams.pageInfo`. Copy a team `id` (UUID, not the team's short key) and call `list-linear-issues`:

```json
{
  "teamId": "your-team-uuid",
  "limit": 20
}
```

The result contains `issues.nodes` with IDs, identifiers, titles, URLs, and nullable descriptions. Linear excludes archived issues by default. Both list tools default to 20 items, accept 1–50, and make one request per invocation. If `pageInfo.hasNextPage` is true, pass `pageInfo.endCursor` as `after` with the other arguments unchanged. See [Linear pagination](https://linear.app/developers/pagination).

## Create an issue

When the user requests creation, call `create-linear-issue` with:

```json
{
  "teamId": "your-team-uuid",
  "title": "Review pricing-page content",
  "description": "## Finding\nDescribe the finding and link to the source page."
}
```

This is a write operation. It returns `issueCreate.success` and the new issue's ID, identifier, title, and URL. Titles are trimmed and limited to 255 characters; descriptions are optional and limited to 10,000 characters by this example. Other issue settings use Linear's defaults. Inputs are passed as GraphQL variables, not interpolated into queries.

For a content workflow, use the Firecrawl tools to inspect a page, review the findings, and explicitly request a Linear issue. The example does not automatically create issues from findings or send messages.

## Errors and validation

Missing or incorrect MCP keys return HTTP 401. Provider HTTP failures, GraphQL errors (including errors alongside partial data), malformed responses, and unsuccessful mutations return MCP tool errors. Raw provider error bodies are not echoed.

Requests time out after 30 seconds with **no automatic retries**. A timeout or response error does not prove creation failed: check Linear before retrying a mutation to avoid duplicate issues. Rate-limit errors may arrive as GraphQL errors even with HTTP 200; see [Linear rate limits](https://linear.app/developers/rate-limiting).

```sh
pnpm --filter linear-http build
pnpm --filter linear-http typecheck
pnpm --filter linear-http test
pnpm --filter linear-http test:smoke
```

All tests intercept provider requests, including mutations; they create no real issues. The smoke tests run the built server under MCP 2025-03-26 and 2026-07-28, checking authentication, discovery, all three tools, and invalid input. Live permissions, workspace data, and issue creation require your own key and are not covered by these tests.
