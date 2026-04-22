# Audit Clean Playground

This example is intentionally boring. It exists to validate the happy path for
`xmcp audit` and to give the CLI a clean project to present.

## Public Usage

```bash
npx xmcp audit
npx xmcp audit:list-rules
npx xmcp audit:explain XMCP-HANDLER-001
```

If `xmcp` is already installed in the project, the equivalent command is:

```bash
xmcp audit
```

## Monorepo Shortcuts

Inside this repository, use the package scripts only when you want to exercise
the local workspace build instead of the published npm package:

```bash
pnpm install
pnpm run audit
pnpm run audit:json
pnpm run audit:rules
pnpm run audit:explain
```
