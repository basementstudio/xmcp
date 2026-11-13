# Paper Design + xmcp

A local STDIO xmcp server that discovers and calls Paper Design tools through `xmcp/client`. Paper owns the design operations and their schemas. This example adds a server-side allowlist and keeps each upstream connection scoped to one operation.

## Run

Install [Paper Desktop](https://paper.design/docs/mcp), open a design file, and copy the absolute Paper CLI path from its MCP panel. From the repository root, using Node 22 and pnpm:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/paper-stdio/.env.example examples/paper-stdio/.env
# Set PAPER_COMMAND to the CLI path.
pnpm --filter paper-stdio build
```

Configure your MCP client to run the built server locally:

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

Use Node 22's absolute executable path if your client cannot find `node`. You can also run `pnpm --filter paper-stdio start` from the repository root; STDIO waits for an MCP client, so it is not an interactive terminal prompt.

1. Call `list-paper-tools` with `{}`. It returns the installed Paper version's tools, input schemas, server instructions, and an `allowed` flag. Read these instructions before calling design tools.
2. Set `PAPER_ALLOWED_TOOLS` in `.env` to a comma-separated list of exact tool names you want to expose. Restart the xmcp server after changing `.env`.
3. Call `call-paper-tool` with `{"name":"the-upstream-name","arguments":{...}}`, matching the schema returned by discovery. Include any read/setup tools required by Paper's instructions.

An empty allowlist denies all delegated calls, including direct calls. Discovery remains available. The generic forwarding tool is marked as potentially destructive because enabled Paper tools may edit or delete design content. Tool annotations do not grant permission. Upstream errors and multimodal content are preserved.

This integration uses Paper's supported `paper mcp` STDIO transport. It requires a local desktop session and a currently open file for design operations. Operations apply to Paper's current file; verify the file with Paper's inspection tools before writes. It is not a hosted API or a multi-user service. No Paper token is copied into xmcp.

## Validate

```sh
pnpm --filter paper-stdio test
pnpm --filter paper-stdio typecheck
pnpm --filter paper-stdio build
```

Tests use a local fake MCP subprocess; they never open or modify a real Paper design. Live reads and writes require Paper Desktop and your chosen tool allowlist.
