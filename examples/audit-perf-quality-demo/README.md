# Audit Perf & Quality Demo

Every tool in this example intentionally violates an `xmcp audit` rule — performance or quality. It is **not** a working server template; it is a fixture for trying the auditor.

## Run it

```bash
pnpm install
pnpm audit                 # all rules, both concerns
pnpm audit:perf            # performance only
pnpm audit:quality         # quality only
pnpm audit:json | jq       # JSON output for piping
```

## What's inside

`src/tools/` has one targeted file per rule (named after the rule it triggers), plus a `sprawl/` directory of 45 trivial tools that pushes the project past the 50-tool soft cap (`XMCP-PERF-003`).

`src/resources/[userId].ts` violates `XMCP-RESOURCE-001` — the `[userId]` path segment doesn't match the exported schema key.

To learn what a rule means, run `xmcp audit:explain <RULE-ID>` from this directory.
