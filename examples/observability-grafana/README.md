# observability-grafana

End-to-end example that ships xmcp observability logs to Grafana via Loki and Promtail — no custom sinks or adapters required.

## Architecture

```
xmcp server (stderr) → log file → Promtail → Loki → Grafana
```

- **xmcp server**: runs with `observability.color: "off"` so stderr output is clean for machine parsing
- **Promtail**: tails the log file, extracts the JSON payload after the `|` delimiter, and pushes to Loki
- **Loki**: stores and indexes logs
- **Grafana**: queries Loki, pre-configured with Loki as the default datasource

## Run

```bash
docker compose up --build
```

This starts four services:

| Service | URL |
| --- | --- |
| xmcp server | `http://localhost:3002/mcp` |
| Grafana | `http://localhost:3000` |
| Loki | `http://localhost:3100` |
| Promtail | `http://localhost:9080` |

Grafana credentials: `admin` / `admin` (anonymous access is also enabled).

## Generate logs

1) Initialize a session:

```bash
curl -sS -D /tmp/grafana-headers.txt -o /tmp/grafana-init.json \
  -X POST http://localhost:3002/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"1.0.0"}}}'
```

2) Extract session ID and call tools:

```bash
SESSION_ID=$(awk '/mcp-session-id:/ {print $2}' /tmp/grafana-headers.txt | tr -d '\r')

# Success tool
curl -sS http://localhost:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"greet","arguments":{"name":"Grafana"}}}'

# Failure tool
curl -sS http://localhost:3002/mcp \
  -X POST \
  -H "content-type: application/json" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"fail","arguments":{"reason":"database unavailable"}}}'
```

## Query logs in Grafana

Open `http://localhost:3000`, go to **Explore**, select the **Loki** datasource, and try these LogQL queries:

```logql
# All xmcp logs
{job="xmcp"}

# Only tool execution end events
{job="xmcp", phase="end"}

# Failed executions
{job="xmcp", outcome="failure"}

# Slow tools (> 500ms)
{job="xmcp", phase="end"} | json | durationMs > 500

# Filter by tool name
{job="xmcp", name="greet"}

# Trace correlation
{job="xmcp"} | json | trace_id="4bf92f3577b34da6a3ce929d0e0e4736"
```

## How the pipeline works

Each xmcp log line on stderr looks like:

```
2026-03-16T10:00:00.000Z INFO tool.start tool/greet req=2 dur=- outcome=- | {"@timestamp":"...","event.action":"tool.start",...}
```

Promtail's pipeline:
1. **regex** — extracts everything after ` | ` as `json_payload`
2. **json** — parses the JSON and extracts fields (`log.level`, `type`, `name`, `phase`, `event.outcome`)
3. **labels** — promotes extracted fields to Loki labels for fast filtering
4. **output** — stores the clean JSON payload as the log line in Loki

## Cleanup

```bash
docker compose down -v
```
