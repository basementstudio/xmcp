# Audit Findings Playground

This example is intentionally noisy. It exists to exercise the terminal output,
manual demos, and future tuning for the audit rules.

## Public Usage

```bash
npx xmcp audit
npx xmcp audit:list-rules
npx xmcp audit:explain XMCP-MCP-006
```

This playground is intentionally noisy, so the plain audit command should fail
in strict mode when the project contains high-severity findings.

## Monorepo Shortcuts

Inside this repository, use the package scripts only when you want to exercise
the local workspace build of `xmcp`:

```bash
pnpm install
pnpm run audit:demo
pnpm run audit:strict
pnpm run audit:json
```

Use `audit:demo` for screenshots and manual review. It prints the findings but
keeps the exit code at `0` by disabling the one critical rule in the demo path.
