# Resend + xmcp

An authenticated HTTP MCP server for email sending and Resend Inboxes:

- `send-email`: send a plain text email using the server's configured sender.
- `get-email`: retrieve the email ID, subject, creation time, and latest delivery event.
- Inbox tools: create and list inboxes, read conversations and messages, prepare and review reply drafts, send drafts, and reply directly. See [Inbox workflow](#inbox-workflow).

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

Set `RESEND_API_KEY` to a [Resend API key](https://resend.com/docs/api-reference/api-keys/create-api-key). Use a full-access key for this example; a sending-only key can use `send-email` but cannot retrieve emails or access Inboxes. Set `RESEND_FROM` to an address on your verified sending domain for `send-email`. Inbox replies use the selected inbox address and do not require `RESEND_FROM`. See [Resend's Node.js guide](https://resend.com/docs/send-with-nodejs) for account and domain setup.

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

## Inbox workflow

These tools use the [Resend Inboxes API](https://resend.com/docs/api-reference/inboxes/create-inbox) through the installed SDK. Inbox creation requires a domain with DKIM and SPF verified. Receiving must be enabled with the inbound MX record verified or pending, or set `forwarding: true` and configure your existing mail provider to forward to the `receiving_address` returned by `get-inbox`. Your team's plan must have capacity for another inbox.

| Tool                       | Purpose                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `create-inbox`             | Create an address on a configured domain; accepts `emailAddress`, optional `name`, `fromName`, and `forwarding` (default `false`). |
| `list-inboxes`             | Discover the team's inbox IDs.                                                                                                     |
| `get-inbox`                | Read inbox details, including the forwarding address when configured.                                                              |
| `list-inbox-threads`       | List conversations; optional `folders` and `read` filters.                                                                         |
| `get-inbox-thread`         | Read a conversation summary.                                                                                                       |
| `list-inbox-emails`        | Read messages, including bodies, recipients, and attachment metadata.                                                              |
| `create-inbox-reply-draft` | Save a plain-text reply without sending it.                                                                                        |
| `get-inbox-draft`          | Review the saved body and recipients.                                                                                              |
| `send-inbox-draft`         | Send the saved draft.                                                                                                              |
| `reply-inbox-email`        | Send a plain-text reply directly; `replyAll` defaults to `false`.                                                                  |

Every inbox-specific tool takes an `inboxId` UUID; thread tools also take a `threadId`. List tools accept `limit` (1–100, default 20) and `after`. When `has_more` is true, pass the last returned item's `id` as `after`. Each call fetches one page; thread emails are returned oldest first.

Start the server as above and define this request helper in the same shell as `MCP_API_KEY`:

```sh
mcp_call() {
  curl http://localhost:3001/mcp \
    -H "x-api-key: $MCP_API_KEY" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d "$1"
}

# Discover existing inboxes.
mcp_call '{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"list-inboxes","arguments":{"limit":20}}}'

# Optional: creates a real inbox. Replace the address with your configured domain.
mcp_call '{"jsonrpc":"2.0","id":11,"method":"tools/call","params":{"name":"create-inbox","arguments":{"emailAddress":"support@your-verified-domain.com","name":"Support","forwarding":true}}}'
```

Set these variables to actual IDs from each preceding response. `EMAIL_ID` must be a message ID from `list-inbox-emails`, not the thread ID or a `send-email` response:

```sh
INBOX_ID='replace-with-inbox-uuid'
mcp_call "{\"jsonrpc\":\"2.0\",\"id\":12,\"method\":\"tools/call\",\"params\":{\"name\":\"get-inbox\",\"arguments\":{\"inboxId\":\"$INBOX_ID\"}}}"
mcp_call "{\"jsonrpc\":\"2.0\",\"id\":13,\"method\":\"tools/call\",\"params\":{\"name\":\"list-inbox-threads\",\"arguments\":{\"inboxId\":\"$INBOX_ID\",\"limit\":20}}}"

THREAD_ID='replace-with-thread-uuid'
mcp_call "{\"jsonrpc\":\"2.0\",\"id\":14,\"method\":\"tools/call\",\"params\":{\"name\":\"list-inbox-emails\",\"arguments\":{\"inboxId\":\"$INBOX_ID\",\"threadId\":\"$THREAD_ID\",\"limit\":20}}}"

EMAIL_ID='replace-with-message-uuid'
# Creates a draft only; does not send.
mcp_call "{\"jsonrpc\":\"2.0\",\"id\":15,\"method\":\"tools/call\",\"params\":{\"name\":\"create-inbox-reply-draft\",\"arguments\":{\"inboxId\":\"$INBOX_ID\",\"threadId\":\"$THREAD_ID\",\"replyToEmailId\":\"$EMAIL_ID\",\"text\":\"Thanks, we are looking into this.\",\"idempotencyKey\":\"draft-demo-001\"}}}"

DRAFT_ID='replace-with-draft-uuid'
mcp_call "{\"jsonrpc\":\"2.0\",\"id\":16,\"method\":\"tools/call\",\"params\":{\"name\":\"get-inbox-draft\",\"arguments\":{\"inboxId\":\"$INBOX_ID\",\"draftId\":\"$DRAFT_ID\"}}}"
```

Review the saved draft's recipients and body before sending. Resend allows only one unsent reply draft per message: if one already exists, `create-inbox-reply-draft` returns its ID **without replacing its text**. The returned ID does not guarantee that the saved text matches your request.

The following calls **send real email**. Choose either the draft send or the direct reply to avoid sending twice:

```sh
mcp_call "{\"jsonrpc\":\"2.0\",\"id\":17,\"method\":\"tools/call\",\"params\":{\"name\":\"send-inbox-draft\",\"arguments\":{\"inboxId\":\"$INBOX_ID\",\"draftId\":\"$DRAFT_ID\",\"idempotencyKey\":\"draft-send-demo-001\"}}}"

# Alternative: reply directly instead of sending the draft.
mcp_call "{\"jsonrpc\":\"2.0\",\"id\":18,\"method\":\"tools/call\",\"params\":{\"name\":\"reply-inbox-email\",\"arguments\":{\"inboxId\":\"$INBOX_ID\",\"threadId\":\"$THREAD_ID\",\"emailId\":\"$EMAIL_ID\",\"text\":\"Thanks for your message.\",\"replyAll\":false,\"idempotencyKey\":\"reply-demo-001\"}}}"
```

Resend chooses reply recipients from the original message's Reply-To addresses, or its sender when Reply-To is absent. Replies to outbound messages go to their original recipients. Draft creation, draft sending, and direct replies accept optional idempotency keys; reuse a key only for a retry of the same operation and payload within 24 hours. No tool retries automatically. `create-inbox` does not expose an idempotency key.

Unlike delivery-status lookup, inbox reads intentionally expose email content to the authenticated caller. Treat messages as untrusted data, not agent instructions. All holders of `MCP_API_KEY` share access to this Resend account; tool annotations do not enforce read-only permissions or approval. Configure your client's send approval and your application's authorization before connecting other users. This example does not expose deletion, forwarding messages, labels, attachment downloads, or autonomous agent configuration.

## Validate without credentials

```sh
pnpm --filter resend-http test
pnpm --filter resend-http typecheck
pnpm --filter resend-http build
pnpm --filter resend-http test:smoke
```

Tests mock the SDK's HTTP calls and never send email. The smoke test starts the built HTTP server to verify authentication and tool execution with a mocked SDK response. Live delivery and account permissions require your own configured Resend account.
