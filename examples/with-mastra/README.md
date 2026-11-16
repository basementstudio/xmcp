# xmcp with Mastra

This example connects [Mastra](https://mastra.ai) and an xmcp server in both directions:

- **Mastra consumes xmcp tools.** `src/connection.ts` creates an `MCPClient` for the xmcp server and passes only `xmcp_get-shipping-policy` to the agent.
- **xmcp exposes a Mastra agent.** The `ask-agent` tool runs a Mastra `Agent` in-process and returns its final text.

Each `ask-agent` call creates a new agent and MCP client, then disconnects the client. The agent receives only the shipping tool, so it cannot call `ask-agent` recursively.

## Setup

Requires Node 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
cp examples/with-mastra/.env.example examples/with-mastra/.env
```

Edit `.env`:

| Variable            | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `MCP_API_KEY`       | Bearer token for the xmcp server, sent on every MCP request.   |
| `MCP_URL`           | xmcp endpoint the Mastra `MCPClient` connects to.              |
| `MASTRA_MODEL`      | Mastra model router ID, such as `anthropic/claude-sonnet-5-5`. |
| `ANTHROPIC_API_KEY` | Provider key for the model.                                    |

## Run

```sh
cd examples/with-mastra
pnpm build && pnpm start
```

- **Agent → xmcp:** `pnpm consume` lists and calls `get-shipping-policy` through Mastra's `MCPClient`. No model key is needed.
- **xmcp → agent:** connect any MCP client to `http://localhost:3001/mcp` with `Authorization: Bearer <MCP_API_KEY>` and call `ask-agent` with `{ "prompt": "How long does shipping take?" }`. The in-process agent calls back into the same server over HTTP.

## Errors and cancellation

`ask-agent` runs the agent once and never resubmits. Model and tool failures, and empty replies, become the tool error `Mastra agent request failed`. A missing `MASTRA_MODEL` returns `Set MASTRA_MODEL`. Cancelling the MCP request aborts the in-process model and tool calls.

## Tests

```sh
pnpm test:smoke
```

The smoke test starts the compiled server, checks auth and discovery, and calls the tool through `MCPClient`. A deterministic AI SDK mock model then drives `ask-agent`'s agent through the real xmcp tool. The test also covers model failure and cancellation, and checks that the agent sees only the shipping tool. Live model runs need a provider key and are not part of the automated tests.

Tested with `@mastra/core` 1.83.0 and `@mastra/mcp` 2.9.0.

See the [Mastra integration guide](https://xmcp.dev/docs/integrations/mastra).
