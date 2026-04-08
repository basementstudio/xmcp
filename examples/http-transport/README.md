# HTTP Transport Example

This example demonstrates `extra.sample()` over Streamable HTTP.

## Sampling behavior in HTTP examples

- With MCP-compatible clients, `extra.sample()` runs the real
  `sampling/createMessage` flow and completes the full sampling loop.
- With MCPJam, `sampling/createMessage` is not supported today and returns
  `-32601 Method not found`, so the demo tools fall back to deterministic local
  responses instead of failing.

Use a compatible HTTP MCP client as the proof that real sampling succeeds over
HTTP.
Use MCPJam only to verify the fallback path and graceful degradation.

## Run the server

From this directory:

```bash
pnpm install
pnpm dev
```

Use the MCP URL printed in the terminal when the server starts.
If the default port is free, that URL will usually be `http://localhost:3000/mcp`.

## Open it in MCPJam

Connect MCPJam to the HTTP server URL printed by `pnpm dev`.

```txt
http://localhost:3000/mcp
```

## Try the sampling tools

Once MCPJam opens:

1. Confirm the server is connected in the `MCP Servers` tab.
2. Open the `Tools` tab and run `summarize_with_sample` with:

```json
{
  "topic": "Model Context Protocol"
}
```

With an MCP-compatible client, this exercises the basic `extra.sample()` flow
and returns sampled text.
With MCPJam, it returns a deterministic fallback message instead of failing the
tool run.

3. Run `research_topic` with:

```json
{
  "topic": "xmcp sampling helper"
}
```

With an MCP-compatible client, this exercises the local tool loop. The model
asks for `search_docs`, xmcp runs that tool, and then the sampling helper
continues the `tool_use -> tool_result -> continue` flow before returning the
final text.
With MCPJam, it falls back to calling `search_docs` directly so the example
still completes end-to-end over HTTP.
