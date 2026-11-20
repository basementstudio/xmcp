# Structured output

Tools that return typed data a client can use without parsing text. Each tool
declares an `outputSchema`; xmcp publishes it in `tools/list`, validates the
result against it, and returns the data as `structuredContent`.

| Tool            | `outputSchema`            | Returns                  |
| --------------- | ------------------------- | ------------------------ |
| `get-weather`   | A map of Zod fields       | An object                |
| `list-forecast` | `z.array(z.object(...))`  | An array                 |
| `count-alerts`  | `z.number().int().min(0)` | A number                 |
| `find-station`  | `z.union([...])`          | One of two object shapes |

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/structured-output
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`. If that port is taken, xmcp
uses the next free one and prints it.

## Call a tool

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/call' \
  -H 'Mcp-Name: list-forecast' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list-forecast","arguments":{"days":2},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"output-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

The result carries the array as `structuredContent` and the same data as a JSON
string in `content`, for clients that only read text:

```json
{
  "content": [
    {
      "type": "text",
      "text": "[{\"day\":\"Mon\",\"high\":24,\"low\":15},{\"day\":\"Tue\",\"high\":21,\"low\":13}]"
    }
  ],
  "structuredContent": [
    { "day": "Mon", "high": 24, "low": 15 },
    { "day": "Tue", "high": 21, "low": 13 }
  ]
}
```

`list-forecast`, `count-alerts` and `find-station` return their data directly.
With a complete `outputSchema`, that is shorthand for
`{ structuredContent: data }`.

## Earlier protocol revisions

Before `2026-07-28`, `structuredContent` had to be an object. For those clients
the MCP SDK wraps other values under `result`, in both the published schema and
the result:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"count-alerts","arguments":{}}}'
```

This returns `"structuredContent":{"result":2}`. A `2026-07-28` client receives
`"structuredContent":2`.

## Read the data from a client

`client.mjs` calls `list-forecast` with `xmcp/client` and loops over
`structuredContent`:

```sh
pnpm client
```

It prints one line per day. Set `MCP_URL` to use another address.
