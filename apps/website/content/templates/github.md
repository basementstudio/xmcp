---
name: "GitHub Repository Assistant"
description: "Read pull requests and repository files with a scoped GitHub token."
category: "integration"
tags: ["github", "repositories", "code-review", "http"]
sourceRepo: "basementstudio/xmcp"
path: "examples/github-http"
deployment: "guides"
---

# GitHub Repository Assistant

Read pull requests and repository files with a scoped GitHub token.

## Included workflow

- List pull requests with explicit pagination.
- Inspect a pull request's description, refs, commit SHAs, and merge status.
- Read a UTF-8 repository file at a branch, tag, or commit, up to 100,000 bytes.

Create a fine-grained token limited to the intended repositories with **Pull requests: read** and **Contents: read**. All tools are read-only. Review comments, diffs, and check results are outside this starter's scope.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace; run these commands from the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/github-http/.env.example examples/github-http/.env
```

Configure `examples/github-http/.env` with `GITHUB_TOKEN`, `MCP_API_KEY`. Generate the separate client secret with `openssl rand -hex 32`. Keep `.env` private. Every client request must include `MCP_API_KEY` as `x-api-key`; all clients share the provider account permissions.

```sh
pnpm --filter github-http build
pnpm --filter github-http start
```

Use the endpoint printed by the server, normally `http://localhost:3001/mcp`. In another terminal, check discovery without invoking a provider tool:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

When ready to use the provider, send this `tools/call` request through your MCP client:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "list-pull-requests",
    "arguments": {
      "owner": "basementstudio",
      "repo": "xmcp",
      "limit": 10
    }
  }
}
```

## Validate and customize

```sh
pnpm --filter github-http typecheck
pnpm --filter github-http test
pnpm --filter github-http test:smoke
```

Tests mock provider calls; they do not use live credentials or perform real provider actions. Add or adapt tools in `examples/github-http/src/tools/`.

The deployment menu links to setup guides because this workspace example is not a standalone clone-and-deploy project. Configure the provider variables and client authentication for your target host, and follow its transport setup.

- [Integration guide](/docs/integrations/github)
- [Complete setup and tool reference](https://github.com/basementstudio/xmcp/tree/main/examples/github-http#readme)
