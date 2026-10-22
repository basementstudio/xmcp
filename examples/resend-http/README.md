# Resend + xmcp

An authenticated HTTP MCP server with two tools:

- `send-email`: send a plain text email using the server's configured sender.
- `get-email`: retrieve the email ID, subject, creation time, and latest delivery event.

## Run

Use Node 22 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/resend-http/.env.example examples/resend-http/.env
# Fill in .env before starting.
pnpm --filter resend-http build
pnpm --filter resend-http start
```

Set `RESEND_API_KEY` to a [Resend API key](https://resend.com/docs/api-reference/api-keys/create-api-key). Both tools together require full access; a sending-only key can use `send-email` but cannot retrieve emails. Set `RESEND_FROM` to an address on your verified sending domain. See [Resend's Node.js guide](https://resend.com/docs/send-with-nodejs) for account and domain setup.

Set `MCP_API_KEY` to a separate random secret (for example, generate one with `openssl rand -hex 32`). Clients send it as `x-api-key` on **every** MCP request. Missing or incorrect keys return HTTP 401. This example grants trusted clients access to a single Resend account; the MCP key is not a Resend key and does not create per-user isolation. Do not share it with untrusted clients. Keep `.env` private.

The endpoint is `http://localhost:3001/mcp`. In another terminal, set `MCP_API_KEY` to the same value and list the tools:

```sh
export MCP_API_KEY='your-mcp-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

The following request **sends an email**. It uses Resend's [delivery test address](https://resend.com/docs/dashboard/emails/send-test-emails); test messages still count against sending quotas.

```sh
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"send-email","arguments":{"to":"delivered@resend.dev","subject":"Hello from xmcp","text":"A test message from the Resend integration.","idempotencyKey":"xmcp-demo-001"}}}'
```

Reuse the same `idempotencyKey` with the same payload when retrying an uncertain send. Resend deduplicates matching requests for [24 hours](https://resend.com/docs/dashboard/emails/idempotency-keys). Use a new key for a new email. The tool does not retry sends automatically, and sending without a key can duplicate emails.

Copy the returned email ID into a status request:

```sh
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get-email","arguments":{"id":"replace-with-returned-email-id"}}}'
```

A successful send means Resend accepted the email, not that it was delivered. `lastEvent` reports the latest event available when queried. Provider failures return `isError: true`; provider error messages, email bodies, and recipients are not echoed in status responses.

## Validate without credentials

```sh
pnpm --filter resend-http test
pnpm --filter resend-http typecheck
pnpm --filter resend-http build
pnpm --filter resend-http test:smoke
```

Tests mock the SDK's HTTP calls and never send email. The smoke test starts the built HTTP server to verify authentication and tool execution with a mocked SDK response. Live delivery and account permissions require your own configured Resend account.
