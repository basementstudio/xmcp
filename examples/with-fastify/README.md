# with-fastify

## Build validation

Use Node.js 26 (recommended; minimum 22.12) and pnpm. Run `pnpm build` in this directory. The xmcp compiler writes adapter declarations before checking application types, including on a clean checkout. The host build or `tsc --noEmit` also validates the application against the generated adapter.
