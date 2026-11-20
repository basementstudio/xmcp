# Authorization policy

One `authorize` function decides which tools and resources each caller can see
and use. A component's `tags` name the roles it requires; the policy compares
them with the scopes on the caller's verified `authInfo`.

| Component           | Tags      | `demo-support` | `demo-admin` |
| ------------------- | --------- | -------------- | ------------ |
| `get-status`        | none      | yes            | yes          |
| `list-invoices`     | `support` | yes            | yes          |
| `refund-invoice`    | `admin`   | no             | yes          |
| `reports://revenue` | `admin`   | no             | yes          |

The two API keys are public demonstration values. Use your authentication
provider in production.

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/authorization-policy
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`. If that port is taken, xmcp
uses the next free one and prints it.

## List tools as each caller

```sh
curl -s http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-api-key: demo-support' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

The listing has `get-status` and `list-invoices`. Change the key to `demo-admin`
and `refund-invoice` appears. Omit the key to get HTTP 401.

## Call a tool the caller cannot see

```sh
curl -s http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-api-key: demo-support' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"refund-invoice","arguments":{"invoiceId":"inv_1042"}}}'
```

The response is `Tool refund-invoice not found`, the same error as a tool that
does not exist. With `demo-admin` the call returns `Refunded inv_1042.`

## Resources follow the same policy

```sh
curl -s http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-api-key: demo-support' \
  -d '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"reports://revenue"}}'
```

The support caller gets `Resource not found`, and `resources/list` is empty for
them. The admin caller can list and read the report.

## How it works

`src/middleware.ts` has two exports. The default export is HTTP middleware that
checks the API key and attaches verified `authInfo` to the request. The named
`authorize` export is the policy. xmcp runs it for listings, calls, reads,
prompts and completions, so there is no separate listing filter to keep in sync.
