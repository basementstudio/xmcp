---
name: "Paper Design Assistant"
description: "Discover and call selected Paper Design tools from a local stdio MCP server."
category: "integration"
tags: ["paper", "design", "desktop", "stdio"]
sourceRepo: "basementstudio/xmcp"
path: "examples/paper-stdio"
deployment: "none"
---

# Paper Design Assistant

Discover and call selected Paper Design tools from a local stdio MCP server.

## Included workflow

- Discover the installed Paper version's tools, schemas, and server instructions.
- Allow selected upstream tools by exact name on the server.
- Forward allowed design operations through `xmcp/client`, preserving results and errors.

Install [Paper Desktop](https://paper.design/docs/mcp), open a design file, and copy the absolute Paper CLI path from its MCP panel into `PAPER_COMMAND`. Leave `PAPER_ALLOWED_TOOLS` empty until you have inspected discovery results. Empty denies all delegated calls. Paper operations act on the current file; verify it before writes.

## Run locally

Use Node 22 and pnpm. This starter lives in the xmcp workspace; run these commands from the repository root:

```sh
git clone --depth 1 https://github.com/basementstudio/xmcp.git
cd xmcp
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/paper-stdio/.env.example examples/paper-stdio/.env
```

Configure `examples/paper-stdio/.env` with `PAPER_COMMAND`, `PAPER_ALLOWED_TOOLS`.

```sh
pnpm --filter paper-stdio build
```

Configure a local MCP client with absolute paths:

```json
{
  "mcpServers": {
    "xmcp-paper": {
      "command": "node",
      "args": [
        "--env-file=/absolute/path/to/xmcp/examples/paper-stdio/.env",
        "/absolute/path/to/xmcp/examples/paper-stdio/dist/stdio.js"
      ]
    }
  }
}
```

Use an absolute Node 22 executable path if your client cannot find `node`. Call `list-paper-tools` with `{}`, read the returned server instructions and schemas, then set `PAPER_ALLOWED_TOOLS` to the exact tool names needed. Restart the server after changing `.env`. Call `call-paper-tool` with `name` and `arguments` matching discovery. Enabled design tools can edit or delete content. This starter requires a local Paper Desktop session and has no hosted HTTP endpoint.

## Validate and customize

```sh
pnpm --filter paper-stdio typecheck
pnpm --filter paper-stdio test
```

Tests use a fake MCP subprocess and never modify a real Paper file. Add or adapt tools in `examples/paper-stdio/src/tools/`.

- [Integration guide](/docs/integrations/paper)
- [Complete setup and tool reference](https://github.com/basementstudio/xmcp/tree/main/examples/paper-stdio#readme)
