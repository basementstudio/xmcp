# Sentry example

Set `SENTRY_DSN` to your Sentry project DSN. An empty DSN disables telemetry. Call `greet` and `fail` to compare successful and returned-error events. Arguments and results are not attached; thrown exceptions may contain application data.

From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler --filter=@xmcp-dev/sentry
pnpm install --frozen-lockfile
cp examples/sentry-http/.env.example examples/sentry-http/.env
# Fill in .env before starting.
pnpm --filter sentry-http build
pnpm --filter sentry-http start
```

The MCP endpoint is `http://localhost:3001/mcp`.

Builds and automated tests do not require hosted credentials. Tests use local transports or fakes; live provider validation requires your own configured account.
