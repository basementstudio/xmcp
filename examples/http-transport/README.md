# HTTP Transport Example

This example demonstrates xmcp sampling over Streamable HTTP.

## Run the server

From this directory:

```bash
pnpm install
pnpm dev
```

Use the MCP URL printed in the terminal when the server starts.
If the default port is free, that URL will usually be `http://localhost:3000/mcp`.

## Open it in your MCP client

Connect a compatible MCP client to the HTTP server URL printed by `pnpm dev`.

```txt
http://localhost:3000/mcp
```

## Try the sampling tools

Once your client opens:

1. Confirm the server is connected in the `MCP Servers` tab.
2. Open the `Tools` tab and run `summarize_with_sample` with:

```json
{
  "topic": "Model Context Protocol"
}
```

This exercises the basic sampling flow and returns sampled text.

3. Run `research_topic` with:

```json
{
  "topic": "xmcp sampling"
}
```

This exercises the local tool loop. The model asks for `search_docs`, xmcp runs
that tool, and then sampling continues the `tool_use -> tool_result ->
continue` flow before returning the final text.
