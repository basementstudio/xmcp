# @xmcp-dev/cli

CLI tool for inspecting MCP servers, installing client configs, generating typed clients, and scaffolding xmcp primitives.

## Usage

```bash
npx @xmcp-dev/cli generate [options]
npx @xmcp-dev/cli create <tool|resource|prompt> [name] [options]
npx @xmcp-dev/cli inspect <url|client-name> [--json]
npx @xmcp-dev/cli list <url|client-name> [--json]
npx @xmcp-dev/cli list --json --stdio <command> [args...]
npx @xmcp-dev/cli install <url|client-name> [--client cursor|claude-desktop] [--config <path>]
```

## Inspecting servers

`inspect` reports server identity, the negotiated protocol version, capabilities,
and instructions. `list` retrieves tools, prompts, resources, and resource
templates, including their metadata and schemas in JSON mode. List methods follow
the server's pagination; unadvertised capabilities appear as empty arrays.

```bash
npx @xmcp-dev/cli inspect http://localhost:3001/mcp
npx @xmcp-dev/cli list http://localhost:3001/mcp --json
npx @xmcp-dev/cli inspect context7 --clients src/clients.ts --json
npx @xmcp-dev/cli list --json --stdio node ./dist/stdio.js
```

Client names use the same configuration loader as `generate`: by default it
searches `src/clients.ts`, then `clients.ts`. Use `-c, --clients <path>` for a
different file. Configured HTTP headers and STDIO command, args, environment,
working directory, and stderr settings are preserved.

Put CLI options **before `--stdio`**. Everything after its executable is passed
unchanged to that subprocess, including `--help`, `--json`, and quoted arguments.
Direct STDIO commands run from the current directory.

`--json` writes one JSON object plus a newline. Inspection uses the keys
`serverInfo`, `protocolVersion`, `capabilities`, and `instructions`; listing uses
`tools`, `prompts`, `resources`, and `resourceTemplates`. Normal output is a
readable summary. Stdout contains results only; config/dependency logs and errors
go to stderr. A configuration, connection, or listing failure exits nonzero and
writes no partial result. Both commands close the managed connection before
printing, including on failure, and STDIO cleanup stops the spawned server.

The commands automatically negotiate modern or legacy MCP. They query metadata
without invoking tools, reading resource contents, or rendering prompts.

## Installing client configs

`install` prints one `mcpServers` JSON document to stdout. It never connects to
the server or launches the STDIO command. Without `--client` or `--config`, it
only prints JSON. Named clients use the same `--clients` source file as discovery.

```sh
npx @xmcp-dev/cli install http://localhost:3001/mcp --name my-project
npx @xmcp-dev/cli install http://localhost:3001/mcp --name my-project --client cursor --dry-run
npx @xmcp-dev/cli install local --clients src/clients.ts --client cursor --config .cursor/mcp.json
npx @xmcp-dev/cli install --name my-project --client claude-desktop --stdio node /absolute/path/dist/stdio.js
```

- `--client cursor` writes `~/.cursor/mcp.json` on macOS, Linux, and Windows.
- `--client claude-desktop` writes `~/Library/Application Support/Claude/claude_desktop_config.json`
  on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows. Use `--config`
  on other systems or when the default path cannot be determined.
- `--config <path>` overrides the destination; without `--client`, it uses the
  generic format. `--clients` selects the input definitions, `--config` the output.
- `--name` overrides the entry name; defaults are the named client, URL hostname,
  or `stdio` for a direct command. Hostname placeholders use `server` for naming.
- `--dry-run` prints the proposed merged JSON without writing files or directories.
- `--replace` permits replacing a conflicting entry of the same name. It is also
  required when previewing a replacement. Identical entries leave the file untouched.

Writes preserve unrelated keys and replace the file via a temporary file and
rename. Invalid JSON or an invalid `mcpServers` object is rejected, even with
`--replace`. Status messages and config-module diagnostics go to stderr; failures
exit nonzero without a JSON result. New files use owner-only permissions on POSIX;
existing file permissions and symlinks are preserved.

HTTP entries contain `url` and optional `headers`. STDIO entries contain `command`,
`args`, and optional `env`/`cwd`. Claude Desktop's local config accepts STDIO entries;
for HTTP, explicitly supply a bridge such as `--stdio npx -y mcp-remote <url>`.
Claude Desktop entries with `cwd` are rejected: use absolute paths or a launch script.
Put all install options before `--stdio`.

Literal `${ENV}` strings are copied unchanged. Header definitions using `env: "TOKEN"`
become `${TOKEN}` in generic output and `${env:TOKEN}` for Cursor; environment values
are never read by the installer. Interpolation support depends on the receiving
client. A TypeScript config still executes when loaded, so a `process.env.TOKEN`
expression in that file supplies its evaluated value; use literal strings to
retain references. Installation does not install npm packages or start servers.

See `examples/external-clients` for a runnable preview.

## Scaffolding

Create starter files that follow xmcp conventions:

```bash
npx @xmcp-dev/cli create tool get-weather
npx @xmcp-dev/cli create tool weather-widget --preset react
npx @xmcp-dev/cli create resource app-config
npx @xmcp-dev/cli create prompt review-code
```

### Create options

- `-d, --dir <path>`: Override the output directory
- `-p, --preset <preset>`: Template preset (`standard` or `react`)

Defaults:

- tools -> `src/tools`
- resources -> `src/resources`
- prompts -> `src/prompts`

Notes:

- If `name` is omitted in interactive mode, the CLI prompts for it.
- In non-interactive mode, omitting `name` exits with an error.
- If `--preset` is omitted, the CLI uses `standard`.
- `react` is supported only for `tool` scaffolds and generates a `.tsx` file.
- Existing files are not overwritten; the CLI skips them instead.

## Client Configuration

Define everything in `src/clients.ts` to use the full feature set:

```ts
export const clients = {
  figma: {
    url: "https://mcp.figma.com/mcp",
    headers: [{ name: "x-api-key", env: "FIGMA_TOKEN" }],
  },
  playwright: {
    npm: "@playwright/mcp@latest",
    args: ["--browser", "chromium"],
    env: { DEBUG: "pw:api,pw:browser*" },
  },
  firecrawl: {
    npm: "firecrawl-mcp",
    env: { FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ?? "" },
  },
  context7: {
    command: "bunx",
    args: [
      "-y",
      "@upstash/context7-mcp",
      "--api-key",
      process.env.CONTEXT7_KEY!,
    ],
  },
};
```

- Entries with a `url` use the HTTP transport (optional `headers` are supported, just like before).
- Entries with `npm` (optionally `command`, `args`, `env`, `cwd`, `stderr`) use STDIO. The CLI runs `command` (defaults to `npx`) with `[npm, ...args]` and passes through `env`.
- API keys can be provided either as CLI args (e.g., `["--api-key", process.env.CONTEXT7_KEY!]`) or via the `env` map. Prefer `env` for secrets.
- STDIO packages must already be installed in the environment the CLI runs in (global install, workspace dependency, or cached `npx` package).

Run `npx @xmcp-dev/cli generate` to produce the typed client files.

### Optional CLI flags

- `-c, --clients <path>`: Custom path to `clients.ts` (default `src/clients.ts`).
- `-o, --out <path>`: Output directory (default `src/generated`).

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

await generatedClients.client1.greet({ name: "World" });
await generatedClients.client2.randomNumber();
```

## Caveats

- **Server/process must be available** — The CLI connects over HTTP or spawns the STDIO package to fetch tool definitions. Ensure the remote server is reachable or the npm package is installed and executable in your environment.
- **clients.ts required** — The CLI generates clients only from the definitions you provide (or the path you pass with `--clients`).
