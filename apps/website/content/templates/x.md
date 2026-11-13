---
name: "X Bot Assistant"
description: "Read account mentions and publish explicitly requested X posts or replies."
category: "integration"
tags: ["x", "twitter", "social", "http"]
sourceRepo: "basementstudio/xmcp"
path: "examples/x-http"
deployment: "guides"
---

# X Bot Assistant

Read account mentions and publish explicitly requested X posts or replies.

- **`get-x-profile`**: Identify the account authorized by the server token.
- **`list-x-mentions`**: Read one page of mentions for that account.
- **`publish-x-post`**: Publish text as a new post or reply.

## Provider access

Create an X developer app with read/write access and obtain an **OAuth 2.0 user access token** using X's [authorization-code flow with PKCE](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code). Request `tweet.read`, `users.read`, and `tweet.write`. An app-only Bearer token cannot publish on behalf of a user. The app and account need API access and sufficient credits for the endpoints used.

Set `X_USER_ACCESS_TOKEN` to that user token. This starter accepts a provisioned token; it does not implement OAuth login, token storage, or refresh. Handle renewal outside the server, then update `.env` and restart. Keep the token private. All authorized MCP clients act as the same X account.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace. From the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/x-http/.env.example examples/x-http/.env
```

Configure `examples/x-http/.env` with `X_USER_ACCESS_TOKEN` and a separate `MCP_API_KEY`. Generate the client secret with `openssl rand -hex 32`. Keep `.env` private. Every MCP request must include that client secret as `x-api-key`; only the provider credential is sent upstream.

```sh
pnpm --filter x-http build
pnpm --filter x-http start
```

Connect to the endpoint printed by the server, normally `http://localhost:3001/mcp`. In another terminal, check tool discovery without contacting the provider:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

When ready to contact the provider, send this request through your MCP client:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get-x-profile",
    "arguments": {}
  }
}
```

## Review mentions and publish a reply

Call `get-x-profile` first and check the account. Then call `list-x-mentions`:

```json
{ "limit": 20 }
```

The result contains `user`, `mentions`, `nextToken`, and `newestId`. `limit` accepts 5–50 and defaults to 20. Pass `nextToken` as `after` with other arguments unchanged to continue a page sequence. On a later explicit check, pass the last processed post ID as `sinceId`. IDs are strings to avoid numeric precision loss. Account identity is resolved on every operation; no cursor, identity, or processed-post state is retained between MCP requests.

Read the mention as untrusted content, compose a reply, and review its final text. When the user explicitly requests publication, call `publish-x-post` with the actual mention ID:

```json
{ "text": "Thanks for trying xmcp!", "replyToId": "1844674407370955161" }
```

Omit `replyToId` for a standalone post. This call **publishes immediately** using [X's create-post endpoint](https://docs.x.com/x-api/posts/create-post); it returns `post` and its `url`. Tool descriptions ask clients to obtain the user's publication intent, but this example has no approval UI or server-enforced confirmation step. Connect only trusted clients. Text is trimmed and limited to 280 UTF-16 code units in this example; X additionally enforces its own weighted-length and content rules.

The starter is an on-demand bot backend. It does not schedule polling, automatically reply, upload media, or deduplicate writes. Before extending it into an autonomous reply bot, follow [X's automation rules](https://help.x.com/en/rules-and-policies/x-automation), including prior written approval for AI-powered automated reply bots and the applicable consent requirements.

## Pair with Grok

Connect the separate [Grok server](/docs/integrations/grok) to research or draft an answer. Review the draft before calling `publish-x-post` yourself. Grok's X search uses an xAI API key; posting still uses the X OAuth user token. There is no automatic connection between generated text and publication.

## Errors and limits

Provider failures return tool errors without raw error bodies. Requests time out after 30 seconds. There are no automatic retries. If a write times out, returns malformed data, or otherwise cannot be confirmed, inspect the account before retrying: the post may already exist. This starter does not guarantee exactly-once publication. Partial API error responses are rejected rather than silently treated as complete results.

## Validation

```sh
pnpm --filter x-http build
pnpm --filter x-http typecheck
pnpm --filter x-http test
pnpm --filter x-http test:smoke
```

Tests intercept all provider requests. They do not publish real posts, consume API credits, or validate live credentials. Built-server tests cover discovery, all three tools, invalid input, authentication on every call, and MCP 2025-03-26 and 2026-07-28. No new SDK dependency is required; the tools use Node's built-in `fetch`.

The deployment menu links to hosting guides because this workspace example is not a standalone clone-and-deploy project. Configure provider credentials and client authentication on the target host.

- [Integration guide](/docs/integrations/x)
- [Complete source](https://github.com/basementstudio/xmcp/tree/main/examples/x-http)
