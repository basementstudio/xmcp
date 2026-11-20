# Human in the loop

Tools that stop mid-call to ask the user something, using multi round-trip
requests from MCP revision `2026-07-28`. The tool returns an `input_required`
result, the client collects the answer, and the client calls the tool again with
the answer attached.

- `delete-project` asks for confirmation before a destructive action and treats
  a declined or cancelled prompt as "keep it".
- `invite-teammate` asks for an email and a role, validates the answer with Zod,
  and asks again when the answer is invalid.

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/human-in-the-loop
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`. If that port is taken, xmcp
uses the next free one and prints it.

## Run both rounds with the client script

`client.mjs` connects with `xmcp/client` and registers an elicitation handler.
The SDK shows the handler each question and retries the call with its answer:

```sh
pnpm client
pnpm client decline
```

The first command prints the server's question and `Deleted "atlas".` The second
answers no and prints `Kept "atlas".` Set `MCP_URL` to use another address.

## See each round with curl

Round one. The client declares that it can show a form, and the tool answers
with `"resultType":"input_required"` and the question under `inputRequests`:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/call' \
  -H 'Mcp-Name: delete-project' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"delete-project","arguments":{"project":"atlas"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"hitl-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{"elicitation":{"form":{}}}}}}'
```

Round two. The same call again, with the user's answer in `inputResponses`:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/call' \
  -H 'Mcp-Name: delete-project' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"delete-project","arguments":{"project":"atlas"},"inputResponses":{"confirmation":{"action":"accept","content":{"confirmed":true}}},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"hitl-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{"elicitation":{"form":{}}}}}}'
```

The result is `Deleted "atlas".` Send `{"action":"decline"}` as the confirmation
to get `Kept "atlas".`

A client that does not declare `elicitation` in its capabilities receives error
`-32021` in round one: the server will not ask a question the client cannot
show. A `2025-11-25` client over stateless HTTP gets a tool error for the same
reason, because that transport cannot deliver a question from the server.

## Notes

The server keeps nothing between rounds. Each round runs the handler from the
top, so do the work only after the answer arrives. Answers come from the client:
validate them before use, as `invite-teammate` does.
