# External clients

This example includes generated clients and a direct managed-client script.

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
