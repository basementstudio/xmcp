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

Create a `src/clients.ts` file to define multiple MCP servers or STDIO packages:

```ts
export const clients = {
  remote: {
    url: "https://my-remote-mcp.app/mcp",
  },
  figma: {
    url: "https://mcp.figma.com/mcp",
    headers: [{ name: "x-api-key", env: "FIGMA_TOKEN" }],
  },
  playwright: {
    npm: "@playwright/mcp@latest",
    args: ["--browser", "chromium"],
    env: { DEBUG: "pw:api,pw:browser*" },
  },
};
```

- Entries with a `url` use the HTTP transport (optional `headers` are supported, just like before).
- Entries with `npm` (optionally `command`, `args`, `env`, `cwd`, `stderr`) use STDIO. The CLI will run `command` (defaults to `npx`) with `[npm, ...args]` to connect to the server and discover its tools.
- STDIO packages must already be installed in the environment the CLI runs in (global install, workspace dependency, or cached `npx` package).

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

- **`--url` overrides `clients.ts`** — When provided, only a single HTTP client is generated using the specified URL, ignoring all entries in the config file.
- **Server/process must be available** — The CLI connects over HTTP or spawns the STDIO package to fetch tool definitions. Ensure the remote server is reachable or the npm package is installed and executable in your environment.
- **`MCP_URL` env var** — Falls back to this if no `--url` or `clients.ts` is found.
