# Inferred tool schemas

Expose an existing typed function as an MCP tool without writing its input schema again. `experimental.inferToolSchemas` generates Zod validation and descriptions from TypeScript and JSDoc at build time. Zod remains a runtime dependency.

From the repository root:

```sh
pnpm install
pnpm build
pnpm --filter inferred-tool-schemas build
pnpm --filter inferred-tool-schemas start
```

Connect an MCP client to `http://127.0.0.1:3001/mcp` and call `greet` with `{"name":"Ada","language":"es"}`. The result is `Hola, Ada!`. A numeric `name` is rejected before the function runs. `validate-email` shows how an explicit schema preserves email validation.

For STDIO, configure your client to run `node` with the absolute path to this example's `dist/stdio.js`. For development, run `pnpm --filter inferred-tool-schemas dev`; editing `src/lib/greet.ts` updates the inferred schema and descriptions.

The example enables strict TypeScript checking, including `strictNullChecks`. Inference supports JSON-compatible object inputs and fails on unsupported types. Use an explicit `schema` for refinements, transforms, recursive types, or inputs outside the supported subset. Existing explicit schemas always win, including `schema = {}` for a tool with no inputs.
