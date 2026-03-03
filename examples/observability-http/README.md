# observability-http

Runnable xmcp example that demonstrates observability execution logs for HTTP transport.

## What this example shows

- `tool.start` and `tool.end` logs for a successful tool run
- Redaction of sensitive input keys with dedicated tools (`password`, `apiKey`, `token`, `authorization`)
- Trace correlation fields (`trace.id`, `span.id`) when `traceparent` is present
- Failure logs (`event.outcome: "failure"`, `error.message`)
- Edge-case sanitization markers for large arrays/objects
- Invalid `traceparent` behavior (no `trace.id` / `span.id`)

## Run

```bash
pnpm --filter "Observability HTTP" dev
```

Server runs on `http://127.0.0.1:3002/mcp`.

## Exercise the tools

1) Initialize session:

```bash
curl -sS -D /tmp/obs-headers.txt -o /tmp/obs-init.json \
  -X POST http://127.0.0.1:3002/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"1.0.0"}}}'
```

2) Extract session id and call success tool with traceparent:

```bash
SESSION_ID=$(awk '/mcp-session-id:/ {print $2}' /tmp/obs-headers.txt | tr -d '\r')

curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"observability-success","arguments":{"action":"sync-profile","userId":"user-42"}}}'
```

3) Redaction demos (one sensitive field per tool):

```bash
curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"observability-redact-password","arguments":{"password":"hunter2"}}}'

curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"observability-redact-apikey","arguments":{"apiKey":"api-key-xyz"}}}'

curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"observability-redact-token","arguments":{"token":"secret-token-123"}}}'

curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"observability-redact-authorization","arguments":{"authorization":"Bearer super-secret"}}}'
```

4) Call failure tool:

```bash
curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"observability-failure","arguments":{"reason":"database unavailable"}}}'
```

5) Call edge-case tool with oversized arrays/objects to trigger truncation markers:

```bash
LONG=$(printf 'x%.0s' {1..2600})
ITEMS=$(printf '"i%d",' {1..55} | sed 's/,$//')
KEYS=$(printf '"k%d":"v",' {1..110} | sed 's/,$//')

curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":8,\"method\":\"tools/call\",\"params\":{\"name\":\"observability-edge-cases\",\"arguments\":{\"veryLong\":\"$LONG\",\"items\":[${ITEMS}],\"bigObject\":{${KEYS}},\"nested\":{\"authorization\":\"Bearer secret\",\"token\":\"top-secret\"}}}}"
```

6) Call success tool with an invalid `traceparent` header:

```bash
curl -sS http://127.0.0.1:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "traceparent: invalid-traceparent-value" \
  -d '{"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"observability-success","arguments":{"action":"invalid-trace-test","userId":"user-42"}}}'
```

## Expected log signals (stderr)

- `event.action` includes `tool.start` and `tool.end`
- For success call, `event.outcome` is `success`
- For each redaction tool call, the sensitive field is emitted as `[REDACTED]`
- For failure call, `log.level` is `error`, `event.outcome` is `failure`, and `error.message` is set
- Sensitive input values appear as `[REDACTED]`
- With the `traceparent` header, `trace.id` and `span.id` are present
- For the edge-case call, `input.bigObject` includes `__truncatedKeys`, and oversized arrays include `[TRUNCATED:n items]`
- For the invalid `traceparent` call, `trace.id` and `span.id` are omitted
