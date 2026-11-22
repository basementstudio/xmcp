# Agent guidance

This is an [xmcp](https://xmcp.dev) project: a TypeScript MCP server. xmcp
registers the files in its component directories automatically, so there is no
server to create and nothing to register by hand.

## Read the current docs first

xmcp and the MCP specification change often. Check the docs before writing
code instead of relying on memory:

- Index of every page: https://xmcp.dev/llms.txt
- Any page as markdown: add `.md` to its URL, for example
  https://xmcp.dev/docs/core-concepts/tools.md
- Docs MCP server, to search and read pages from your client:
  https://xmcp.dev/mcp

## Conventions

- `paths` in `xmcp.config.ts` decides which directories are loaded:
  `src/tools`, `src/prompts` and `src/resources`. A path set to `false` is off,
  so enable it there before adding files to that directory.
- One component per file. The default export is the handler. The `metadata`
  and `schema` exports are optional, and `schema` can be a map of Zod fields or
  a complete Zod schema.
- A tool in a `.tsx` file renders a React widget.
- Resource folders define the URI: `src/resources/(users)/[userId]/profile.ts`
  is served as `users://{userId}/profile`.
- `src/middleware.ts` is optional and holds HTTP middleware, MCP middleware
  and the `authorize` policy.
- HTTP is stateless. Do not keep per-client state in memory between requests;
  pass state back to the client as a tool result and accept it as an argument.

## Commands

Run the package scripts with the project's package manager:

- `dev` starts the server and reloads on change.
- `build` compiles to `dist`.

`npx xmcp create tool <name>` adds a starter file in the right directory. It
also accepts `prompt`, `resource` and `widget`.
