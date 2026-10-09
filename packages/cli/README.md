# @xmcp-dev/cli

CLI tool for inspecting MCP servers, generating typed clients, and scaffolding xmcp primitives.

## Usage

```bash
npx @xmcp-dev/cli generate [options]
npx @xmcp-dev/cli create <tool|resource|prompt> [name] [options]
npx @xmcp-dev/cli inspect <url|client-name> [--json]
npx @xmcp-dev/cli list <url|client-name> [--json]
npx @xmcp-dev/cli list --json --stdio <command> [args...]
npx @xmcp-dev/cli import-openapi ./openapi.json [--operations getPet,listPets]

npx @xmcp-dev/cli call <url|client-name> <tool> [--arg key=value]
npx @xmcp-dev/cli read-resource <url|client-name> <uri>
npx @xmcp-dev/cli get-prompt <url|client-name> <prompt> [--arg key=value]
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

## Importing OpenAPI

Generate ordinary xmcp GET tools from a local OpenAPI 3.0/3.1 JSON document:

```sh
npx @xmcp-dev/cli import-openapi ./openapi.json
npx @xmcp-dev/cli import-openapi ./openapi.json --operations getPet,listPets --out src/tools/api
npx @xmcp-dev/cli import-openapi ./openapi.json --base-url https://api.example.com/v1
```

All GET operations are selected by default. `--operations` selects exact
`operationId` values, or `GET /path/{parameter}` when an ID is absent. Tool names
use filename normalization; colliding names fail. `--out` defaults to `src/tools`.
Existing `.ts`/`.tsx` files are never overwritten, and all selected inputs are
validated before writing. The command does not connect to the API.

Supported inputs include scalar path/query parameters, scalar query arrays with
form/explode serialization, local parameter/schema references, and common scalar
constraints. Generated handlers preserve the server's base path, encode inputs,
forward MCP cancellation to fetch, return response text, and surface unsuccessful
HTTP statuses as tool errors. Response schemas are not converted or validated.

Unsupported constructs fail clearly: request bodies, headers/cookies, credentials,
object/nullable/composed schemas, unsupported schema keywords/formats, external or
recursive references, and non-default serialization styles. Server variables and
relative URLs require an explicit `--base-url`. Generation supports JSON only.

See [the import guide](https://xmcp.dev/docs/guides/import-openapi) for the exact
subset and `examples/openapi-import` for a runnable local API and generated tool.

## Calling tools, reading resources, and rendering prompts

The execution commands share the connection and config options above. They
always print the complete MCP result as JSON, preserving content blocks,
structured content, prompt messages, resource contents, and metadata. `--json`
is accepted for consistency but is optional.

```sh
npx @xmcp-dev/cli call http://localhost:3001/mcp greet --arg name=Ada
npx @xmcp-dev/cli call local add --arg a=2 --arg b=3
npx @xmcp-dev/cli call local add --args-file args.json
printf '{"a":2,"b":3}\n' | npx @xmcp-dev/cli call local add --stdin
npx @xmcp-dev/cli read-resource local 'config://app'
npx @xmcp-dev/cli get-prompt local team-greeting --arg department=engineering --arg name=Ada
npx @xmcp-dev/cli call add --arg a=2 --arg b=3 --stdio node ./dist/stdio.js
```

For STDIO, omit the connection target and put the tool/prompt name or resource
URI before `--stdio`; everything after the executable belongs to the server.
`read-resource` takes a complete URI, including resolved template parameters,
and does not accept argument options.

For `call` and `get-prompt`, choose one input source:

- Repeat `--arg key=value`. Tool values parse as JSON when possible, otherwise
  as literal strings. Quote a JSON string to preserve a numeric-looking string:
  `--arg 'id="123"'`. Prompt `--arg` values always remain literal strings.
- `--args-file path` reads a JSON object. Nested objects and arrays are preserved.
- `--stdin` or `--args-file -` reads a JSON object from stdin. Piped stdin is also
  read automatically when no argument option is present; empty automatic stdin
  means no arguments. Explicit stdin requires a nonempty JSON object.

Input sources cannot be mixed, and duplicate `--arg` keys are rejected. Prompt
JSON values must be strings. Tools are validated against their advertised JSON
Schema before invocation; prompts validate required names and string values.
Both catalogs follow pagination when resolving the selected component.

| Exit code | Meaning                                                | Stdout                     |
| --------- | ------------------------------------------------------ | -------------------------- |
| `0`       | Successful operation                                   | Complete JSON result       |
| `1`       | Tool returned `isError: true`                          | Complete JSON error result |
| `1`       | Config, connection, server, or unknown-component error | Empty                      |
| `2`       | Invalid CLI options, JSON, argument file, or arguments | Empty                      |

Diagnostics go to stderr. Connections and STDIO subprocesses close on success,
tool errors, validation errors, and protocol errors. Tools that request client
interaction still require a client with the appropriate handlers; these commands
do not configure sampling or elicitation handlers.

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
