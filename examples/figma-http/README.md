# Figma canvas + xmcp

A local HTTP MCP server and Figma development plugin for reading, creating, editing, and exporting design nodes. It uses the Figma Plugin API, so it needs an open editable file in Figma Desktop, rather than a REST API token.

| Tool                | Behavior                                                            |
| ------------------- | ------------------------------------------------------------------- |
| `figma-status`      | Inspect the connected document/page and obtain its session ID.      |
| `read-figma-page`   | Read the selection and up to 100 top-level nodes.                   |
| `create-figma-node` | Create a frame, rectangle, or text node, optionally inside a frame. |
| `update-figma-node` | Set a node's name, position, size, fill, or text.                   |
| `export-figma-node` | Return PNG image content or SVG text.                               |

This is a focused development example, not a general-purpose Figma automation service. It does not execute arbitrary JavaScript, delete nodes, publish components, or manage files. Figma also offers [hosted MCP canvas writes](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/), but its remote server [requires an approved client](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/).

## Start the server

Use Node 22 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/figma-http/.env.example examples/figma-http/.env
# Fill in .env with two different secrets; generate each with openssl rand -hex 32.
pnpm --filter figma-http build
pnpm --filter figma-http start
```

`MCP_API_KEY` authenticates MCP clients. `FIGMA_BRIDGE_KEY` authenticates the development plugin; paste only that key into the plugin UI. Neither is a Figma account token. The server binds to `127.0.0.1`. The plugin expects port **3001**: stop other examples using that port and confirm the printed endpoint is `http://127.0.0.1:3001/mcp` before connecting. Do not expose this bridge publicly or put it behind multiple server instances.

## Install the development plugin

1. In Figma Desktop, create a new development plugin for Figma Design with a UI. Copy the numeric `id` from the generated `manifest.json`.
2. Generate this example's local manifest, preserving that ID:

   ```sh
   pnpm --filter figma-http setup:plugin 1234567890123456789
   ```

   Replace the number with your generated ID. The resulting `plugin/manifest.local.json` is ignored by git.

3. Use **Plugins → Development → Import plugin from manifest** and select `examples/figma-http/plugin/manifest.local.json`. Open an editable design file, select the page you want to work on, and run the plugin.
4. Paste `FIGMA_BRIDGE_KEY` into the plugin and click **Connect**. Keep the plugin open. Call `figma-status` to confirm the connection and the target document/page.

The [manifest](https://developers.figma.com/docs/plugins/manifest/) grants development network access only to the local bridge. This plugin is intended to run in development mode. A browser or organization may restrict local network access or development plugins; resolve that through your Figma setup rather than widening the bridge's network permissions.

## Create, edit, and export

In another terminal, set the same `MCP_API_KEY` and get the active session:

```sh
export MCP_API_KEY='your-client-secret'
curl http://127.0.0.1:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"figma-status","arguments":{}}}'
```

Confirm `connected: true`, `busy: false`, and the document/page names. Copy `sessionId` from the returned text. The following request **creates a real frame**:

```sh
export FIGMA_SESSION_ID='paste-sessionId-from-figma-status'
curl http://127.0.0.1:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"create-figma-node\",\"arguments\":{\"sessionId\":\"$FIGMA_SESSION_ID\",\"kind\":\"frame\",\"name\":\"xmcp card\",\"width\":320,\"height\":180,\"fill\":\"#EEF2FF\"}}}"
```

Copy the returned node ID, then edit it:

```sh
export FIGMA_NODE_ID='paste-created-node-id'
curl http://127.0.0.1:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"update-figma-node\",\"arguments\":{\"sessionId\":\"$FIGMA_SESSION_ID\",\"nodeId\":\"$FIGMA_NODE_ID\",\"patch\":{\"name\":\"Updated card\",\"width\":400,\"fill\":\"#DBEAFE\"}}}}"
```

Use the same request format with these tool arguments:

- `read-figma-page`: `{"sessionId":"..."}`.
- `create-figma-node`: use `kind: "text"`, `text: "Hello"`, and `parentId` set to the frame ID to add text inside it. Text uses Inter Regular; `fill` controls text color and defaults to white, so set a contrasting color.
- `export-figma-node`: `{"sessionId":"...","nodeId":"...","format":"PNG"}` or `"SVG"`. PNG is returned as MCP image content; SVG as text.

Nodes can be edited only on the connected page; updates support frames, rectangles, and text. For text edits, the plugin loads the existing fonts before changing characters. Review the result in Figma and use Undo if needed. Updates are not transactions; a Figma API error may occur after some properties have changed.

## Connection and retry behavior

Only one plugin and one operation can be active at a time. The plugin holds a long poll until a command arrives, with idle polls renewed every 25 seconds. Canvas operations time out after 30 seconds. A timeout or disconnection does **not** prove a write failed: inspect the file before retrying. Creates are not idempotent and are never retried automatically.

Every canvas call requires the current session ID. Reconnecting generates a new ID. Changing pages disconnects the plugin, and the plugin checks the page again after asynchronous work such as font loading. Calls while disconnected, busy, or between polls fail with instructions to check readiness. `figma-status` describes this one local connection; it is not user authentication or an MCP session cache.

Keep both keys private. Anyone with `MCP_API_KEY` can issue the supported operations against the connected page. Missing or incorrect client/plugin keys return HTTP 401. The bridge allows the sandboxed plugin's `null` origin and `https://www.figma.com`, with a separate key on every request.

## Validate without Figma

```sh
pnpm --filter figma-http test
pnpm --filter figma-http typecheck
pnpm --filter figma-http build
pnpm --filter figma-http test:smoke
```

Unit tests exercise command routing, expiry, stale sessions, and plugin operations with a fake Figma API. The smoke test starts the built HTTP server and a simulated plugin to verify authentication, input validation, and the full request/result round trip. No real Figma document is modified. Live canvas rendering, fonts, and Desktop plugin installation still require manual validation in Figma.
