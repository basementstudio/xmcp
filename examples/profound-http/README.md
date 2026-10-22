# Profound + xmcp

An authenticated HTTP MCP server for Profound's AI search visibility data, using Node's built-in `fetch` and the documented REST API.

| Tool                        | Behavior                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `list-profound-categories`  | List categories and organizations accessible to the API key owner; optionally filter organization IDs. |
| `query-profound-visibility` | Query one page of v2 visibility metrics, optionally selecting exact asset names.                       |
| `query-profound-citations`  | Query one page of v2 domain citation metrics.                                                          |

All three tools are read-only. They do not launch agents, create prompts, or modify Profound data.

## Run

Profound currently documents REST API key access as an [Enterprise feature](https://docs.tryprofound.com/rest-api/authentication). Create a personal API key in **Settings → Account → API Keys**. The key follows the owner's organization memberships.

Use Node 22 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/profound-http/.env.example examples/profound-http/.env
# Fill in PROFOUND_API_KEY and a separate MCP_API_KEY.
pnpm --filter profound-http build
pnpm --filter profound-http start
```

Generate `MCP_API_KEY` with a command such as `openssl rand -hex 32`. MCP clients send it as `x-api-key` on **every** request. The server sends `PROFOUND_API_KEY` only to `https://api.tryprofound.com` as `X-API-Key`. Keep both keys private and `.env` out of version control.

The example shares the provider key owner's accessible data with trusted MCP clients. An organization filter narrows a query; it does not provide per-user authorization. Add your own authorization policy before sharing it with users who should see different organizations.

## Discover categories

In another terminal, set the same MCP key:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list-profound-categories","arguments":{}}}'
```

The result contains Profound's category/organization rows. To narrow discovery, supply `organizationIds: ["your-organization-uuid"]`. The provider accepts repeated `organization_ids` query parameters; the tool handles that mapping.

## Query reports

Copy a category ID from discovery. Choose dates for which your category has data:

```sh
export PROFOUND_CATEGORY_ID='your-category-uuid'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"query-profound-visibility\",\"arguments\":{\"categoryId\":\"$PROFOUND_CATEGORY_ID\",\"dates\":{\"start\":\"2026-10-01\",\"end\":\"2026-10-07\"},\"scope\":\"owned\",\"limit\":10}}}"
```

Change the tool name to `query-profound-citations` with the same arguments for domain citations. Both tools default to `scope: "owned"`; use `"all"` to include competitors or other cited domains. Profound's citations endpoint itself defaults to `all`, so this example deliberately supplies its narrower default.

Additional arguments:

- `groupBy`: dimensions such as `["date"]` or `["model"]`; omitted by default.
- `interval`: `"day"`, `"week"`, or `"month"`, used for date grouping.
- `assets`: exact asset names for visibility only.
- `limit`: 1–50 results, default 10.
- `cursor`: the previous response's `info.next_cursor`. Keep all other arguments unchanged to fetch the next page. Stop when it is `null`.

The [v2 report contract](https://docs.tryprofound.com/rest-api/reports/reports-v2-overview) uses **inclusive** `YYYY-MM-DD` bounds in Profound's Eastern Time reporting calendar. The tools validate real dates and reject reversed ranges. Dates are passed unchanged without converting through the caller's timezone.

Responses preserve Profound's `info` and `data`, including metric values, nulls, and pagination. The example does not rescale metrics or fetch all pages automatically. See the provider references for [visibility](https://docs.tryprofound.com/rest-api/reports/query-visibility-v2) and [citations](https://docs.tryprofound.com/rest-api/reports/query-citations-v2).

Missing/incorrect MCP keys return HTTP 401. Provider failures return an MCP tool error with the HTTP status; HTTP 429 also includes `retryAfterSeconds` when Profound supplies a numeric `Retry-After`. Requests time out after 30 seconds and are not retried automatically. Raw provider error bodies and credentials are not echoed.

## Validate without credentials

```sh
pnpm --filter profound-http test
pnpm --filter profound-http typecheck
pnpm --filter profound-http build
pnpm --filter profound-http test:smoke
```

Tests mock all provider requests. The smoke test starts the built server to verify authentication and report execution with a fake API response. Live account access and report contents require your own Profound key and category data.
