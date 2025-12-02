# @xmcp-dev/cli

CLI tool for generating typed clients from xmcp MCP servers external connections.

## Usage

```bash
npx @xmcp-dev/cli generate [options]
```

## Options

| Flag                   | Description         | Default          |
| ---------------------- | ------------------- | ---------------- |
| `-u, --url <url>`      | MCP server URL      | —                |
| `-o, --out <path>`     | Output directory    | `src/generated`  |
| `-c, --clients <path>` | Clients config file | `src/clients.ts` |

## Client Configuration

Create a `src/clients.ts` file to define multiple MCP servers:

```ts
export const clients = {
  remote: { url: "https://my-remote-mcp.app/mcp" },
  // Example for Figma cloud MCP server:
  figma: { url: "https://mcp.figma.com/mcp" },
  // Example for custom staging server:
  staging: { url: "https://staging.mycorp.com/mcp" },
};
```

Run `npx @xmcp-dev/cli generate` to produce the typed client files.

## Generated Output

For each client defined in `clients.ts`, the CLI generates a `client.{name}.ts` file containing:

- Zod schemas for each tool's arguments
- Type exports (e.g., `GreetArgs`)
- Tool metadata objects
- `createRemoteToolClient()` factory function
- Pre-instantiated client export

An index file (`client.index.ts`) is always generated with a unified `generatedClients` object:

```ts
import { generatedClients } from "./generated/client.index";

await generatedClients.local.greet({ name: "World" });
await generatedClients.production.randomNumber();
```

## Caveats

- **`--url` overrides `clients.ts`** — When provided, only a single client is generated using the specified URL, ignoring all entries in the config file.
- **Server must be running** — The CLI fetches tool definitions via HTTP; the target MCP server(s) must be accessible at generation time.
- **`MCP_URL` env var** — Falls back to this if no `--url` or `clients.ts` is found.
