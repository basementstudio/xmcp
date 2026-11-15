# Skills over HTTP

Serves an [Agent Skill](https://agentskills.io/) through the
[MCP Skills extension](https://modelcontextprotocol.io/extensions/skills).
`src/skills/release-notes/` holds a `SKILL.md` and one supporting file; xmcp
discovers the directory, validates it at build time and embeds it in the bundle.

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/skills-http
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`.

## Discover the extension

The server declares `io.modelcontextprotocol/skills` under
`capabilities.extensions`:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: server/discover' \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"skills-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

## List and get skills

`skills/list` returns the frontmatter of every skill with the digest and size of
each of its files:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: skills/list' \
  -d '{"jsonrpc":"2.0","id":2,"method":"skills/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"skills-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

`skills/get` returns one entry by the URI of its `SKILL.md`. Any other URI,
including the URI of a supporting file, is error `-32602`:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: skills/get' \
  -d '{"jsonrpc":"2.0","id":3,"method":"skills/get","params":{"uri":"skill://release-notes/SKILL.md","_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"skills-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

## Read a skill file

Every file is an ordinary resource at `skill://<skill-name>/<file-path>`:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: resources/read' \
  -H 'Mcp-Name: skill://release-notes/references/TEMPLATE.md' \
  -d '{"jsonrpc":"2.0","id":4,"method":"resources/read","params":{"uri":"skill://release-notes/references/TEMPLATE.md","_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"skills-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

The returned text hashes to the digest published for that file:

```sh
shasum -a 256 src/skills/release-notes/references/TEMPLATE.md
```

## Add a skill

Create `src/skills/<skill-name>/SKILL.md` with `name` and `description`
frontmatter, where `name` equals the directory name. `pnpm dev` picks up new and
edited skill files. The build fails with a message when a skill is invalid, for
example when the name and directory differ.
