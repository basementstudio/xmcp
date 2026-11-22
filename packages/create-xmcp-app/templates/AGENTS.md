# Agent guidance

This is an [xmcp](https://xmcp.dev) project: a TypeScript MCP server. xmcp
registers every file under `src/tools`, `src/prompts` and `src/resources`
automatically, so there is no server to create and nothing to register by hand.

## Read the current docs first

xmcp and the MCP specification change often. Check the docs before writing
code instead of relying on memory:

- Index of every page: https://xmcp.dev/llms.txt
- Any page as markdown: add `.md` to its URL, for example
  https://xmcp.dev/docs/core-concepts/tools.md
- Docs MCP server, to search and read pages from your client:
  https://xmcp.dev/mcp

## Conventions

- One component per file. A tool exports `schema` (a map of Zod fields),
  `metadata`, and a default handler function.
- Resource folders define the URI: `src/resources/(users)/[userId]/profile.ts`
  is served as `users://{userId}/profile`.
- `src/middleware.ts` is optional and holds HTTP middleware, MCP middleware
  and the `authorize` policy.
- Server options live in `xmcp.config.ts`.
- HTTP is stateless. Do not keep per-client state in memory between requests;
  pass state back to the client as a tool result and accept it as an argument.

## Commands

- `xmcp dev` starts the server and reloads on change.
- `xmcp build` compiles to `dist`.
- `xmcp create tool <name>`, `xmcp create prompt <name>` and
  `xmcp create resource <name>` add a starter file in the right directory.
