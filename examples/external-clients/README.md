# External clients

This example includes CLI discovery, execution, and installation, generated clients, and a direct managed-client script.

## Client installation

Preview a Cursor project config without starting a server or writing a file:

```sh
pnpm install:preview
```

This reads `local` from `discovery.clients.ts` and prints the proposed
`.cursor/mcp.json`. Set `MCP_URL` to select another server. To write the config:

```sh
pnpm exec xmcp-dev-cli install local --clients discovery.clients.ts --client cursor --config .cursor/mcp.json
```

Existing settings and other servers are preserved. A conflicting `local` entry
requires `--replace`; running the same command again leaves the file untouched.
Restart or refresh the client after installation. Start your server before using
it from the client.

Omit the destination options to print generic MCP JSON only:

```sh
pnpm exec xmcp-dev-cli install local --clients discovery.clients.ts
```

## CLI discovery

Start `pnpm --dir examples/http-transport dev` from the repository root, then
run these commands from this directory:

```sh
pnpm inspect
pnpm list:server --json
```

The scripts read the `local` client in `discovery.clients.ts`, which defaults to
`http://localhost:3001/mcp`. Set `MCP_URL` to select another server. They require
no credentials for Context7 or Playwright. Inspection prints server details;
listing returns the catalog of tools, prompts, resources, and templates without
invoking them.

You can also connect directly to a local STDIO build:

```sh
pnpm exec xmcp-dev-cli list --json --stdio node /path/to/server/dist/stdio.js
```

## CLI execution

With the same `examples/http-transport` server running, execute tools, read
resources, or render prompts from this directory:

```sh
pnpm call:server greet --arg name=Ada
pnpm call:server greet --args-file greet.args.json
printf '{"name":"Ada"}\n' | pnpm call:server greet --stdin
pnpm read:server 'config://app'
pnpm prompt:server team-greeting --arg department=engineering --arg name=Ada
```

These scripts also use `discovery.clients.ts` and `MCP_URL`. Results are complete
JSON objects; use `pnpm --silent run call:server ...` to suppress pnpm's own
script banner in pipelines. Tool `--arg` values parse as JSON when possible;
prompt `--arg` values stay strings. Choose one input source per invocation.

Exit `0` means success, `1` means a tool/server/connection failure, and `2` means
invalid input. A tool's `isError: true` response is still printed as JSON; errors
without a result are reported on stderr. Connections close after each command.

## Managed client

Start a local server, for example `pnpm --dir examples/http-transport dev` from
the repository root. Then run from this directory:

```sh
pnpm managed
```

The script lists tools at `http://localhost:3001/mcp` and closes its connection.
Set `MCP_URL` to connect to another server:

```sh
MCP_URL=https://your-server.example/mcp pnpm managed
```

The managed script does not need credentials for the generated clients below.

## Generated clients

`src/clients.ts` configures Context7 and Playwright. Set `CONTEXT7_API_KEY` in
your environment, then run `pnpm generate` to regenerate their typed clients.
Run `pnpm build` and `pnpm start` to serve the tools that use these integrations.
