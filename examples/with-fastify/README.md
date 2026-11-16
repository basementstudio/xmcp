# with-fastify

## Build validation

Use Node.js 26 (recommended; minimum 22.12) and pnpm. Run `pnpm build` in this directory. The xmcp compiler generates the adapter first with `typescript.skipTypeCheck`; the host build or `tsc --noEmit` then checks the application against the generated types.
