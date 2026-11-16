# xmcp with Flue

This example connects a [Flue](https://flueframework.com) agent and an xmcp server in both directions:

- **Flue consumes xmcp tools.** The `ShippingAssistant` agent mounts the xmcp server with `useMcpConnection` and may call only `get-shipping-policy`.
- **xmcp exposes the Flue agent.** The `ask-agent` tool sends a prompt to the deployed agent with `@flue/sdk` and returns its final reply.

Each `ask-agent` call opens a new conversation. The agent's connection allowlists `get-shipping-policy`, so it cannot discover `ask-agent` and call itself.

## Setup

Requires Node 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
cp examples/with-flue/.env.example examples/with-flue/.env
```

Edit `.env`:

| Variable            | Purpose                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| `MCP_API_KEY`       | Bearer token for the xmcp server. Flue sends it on every MCP request.                |
| `MCP_URL`           | xmcp endpoint the agent connects to.                                                 |
| `FLUE_AGENT_URL`    | Base URL of the mounted agent. Each call appends a new conversation ID.              |
| `FLUE_TOKEN`        | Bearer token the agent server requires (`src/app.ts`). Use a different secret.       |
| `FLUE_MODEL`        | Flue model ID, such as `anthropic/claude-sonnet-5-5`.                                |
| `ANTHROPIC_API_KEY` | Provider key for the model. Only the agent server needs it.                          |
| `PORT`              | Port for the built agent server. The xmcp server always uses `3001` from its config. |

## Run

```sh
cd examples/with-flue
pnpm build && pnpm start          # xmcp on http://localhost:3001/mcp
pnpm dev:agent                    # Flue on http://localhost:3002 (or: pnpm build:agent && pnpm start:agent)
```

- **Agent → xmcp:** `pnpm consume` lists the tools Flue adapts from xmcp (`mcp__xmcp__get-shipping-policy`). Flue runs adapted MCP tools only inside an agent turn, so send the agent a shipping question to exercise a call.
- **xmcp → agent:** connect any MCP client to `http://localhost:3001/mcp` with `Authorization: Bearer <MCP_API_KEY>` and call `ask-agent` with `{ "prompt": "How long does shipping take?" }`.

## Errors and cancellation

`ask-agent` submits once and never retries. Upstream failures, failed runs, and empty replies become the tool error `Flue agent request failed`; details stay in the agent server logs. Cancelling the MCP request stops the HTTP read, but the agent may finish its turn. Abort it with the Flue client if you need to stop the run.

## Tests

```sh
pnpm test         # askAgent with a deterministic conversation fixture
pnpm test:smoke   # compiled server: auth, discovery, tools, upstream failure, Flue's MCP client
```

The smoke test points `ask-agent` at a failing local stand-in and checks that exactly one submission is sent. Live model runs need a provider key and are not part of the automated tests.

Tested with `@flue/runtime`, `@flue/sdk`, and `@flue/vite` 2.3.0 on Vite 8. Flue 2.3.0 accepts `@earendil-works/pi-ai` `^1.1.0`, but pi-ai 1.5 removed an export Flue imports, so this repository pins Flue's `pi-ai` and `pi-agent-core` to 1.4.0 with a pnpm override. Add the same override in your project until Flue publishes a fix.

See the [Flue integration guide](https://xmcp.dev/docs/integrations/flue).
