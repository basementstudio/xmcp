# xmcp with eve

This example connects an [eve](https://eve.dev) agent and an xmcp server in both directions:

- **eve consumes xmcp tools.** `agent/connections/xmcp.ts` defines an MCP client connection that allows only `get-shipping-policy`.
- **xmcp exposes the eve agent.** The `ask-agent` tool starts an eve session with `eve/client` and returns the agent's reply.

Each `ask-agent` call starts a new session. Because the connection allowlists `get-shipping-policy`, the agent cannot discover `ask-agent` and call itself.

## Setup

Requires Node 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
cp examples/with-eve/.env.example examples/with-eve/.env
```

Edit `.env`:

| Variable            | Purpose                                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| `MCP_API_KEY`       | Bearer token for the xmcp server. eve sends it on every MCP request.               |
| `MCP_URL`           | xmcp endpoint the agent connects to. Defaults to `http://localhost:3001/mcp`.      |
| `EVE_URL`           | Base URL of the eve server.                                                        |
| `EVE_TOKEN`         | Bearer token the eve channel requires (`agent/channels/eve.ts`).                   |
| `ANTHROPIC_API_KEY` | Provider key for `anthropic()`. Only the eve server needs it.                      |
| `PORT`              | Port for the built eve server. The xmcp server always uses `3001` from its config. |

## Run

```sh
cd examples/with-eve
pnpm build && pnpm start          # xmcp on http://localhost:3001/mcp
pnpm dev:agent                    # eve on http://localhost:3002 (or: pnpm build:agent && pnpm start:agent)
```

- **Agent → xmcp:** ask the eve agent a shipping question. eve resolves the `xmcp` connection and calls `get-shipping-policy`.
- **xmcp → agent:** connect any MCP client to `http://localhost:3001/mcp` with `Authorization: Bearer <MCP_API_KEY>` and call `ask-agent` with `{ "prompt": "How long does shipping take?" }`.

## Errors and cancellation

`ask-agent` creates one session and never retries. Failed runs, upstream errors, and empty replies become the tool error `eve agent request failed`; details stay in the eve server logs. Cancelling the MCP request stops waiting for the reply, but the eve run may still finish.

## Tests

```sh
pnpm test         # askAgent with a deterministic eve client fixture
pnpm test:smoke   # compiled server: auth, discovery, tools, upstream failure, tool allowlist
```

The smoke test points `ask-agent` at a failing local stand-in and checks that exactly one session request is sent. Live model runs need a provider key and are not part of the automated tests.

Tested with `eve` 1.0.0-rc.18.

See the [eve integration guide](https://xmcp.dev/docs/integrations/eve).
