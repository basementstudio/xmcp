# Stripe and Metronome example

Use Node 22.13+ (the SQLite API is experimental in Node 22). Set a demo API key and provider customer ID. Configure the matching meter/metric and contract in the provider dashboard, and set its event name and API key. Choose Metronome for a new billing setup or Stripe for existing Billing Meters. Use a separate database per provider.

From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler --filter=@xmcp-dev/billing
pnpm install --frozen-lockfile
cp examples/billing-http/.env.example examples/billing-http/.env
# Fill in .env before starting.
pnpm --filter billing-http build
pnpm --filter billing-http start
```

The MCP endpoint is `http://localhost:3001/mcp`.

Grant demo usage credits explicitly, then call `report` with `Authorization: Bearer <DEMO_API_KEY>` on every request. Each admitted report costs three credits; denied admissions do not run the tool. Failures/cancellation after admission do not refund credits. Run the worker to deliver at most 100 pending records, then exit:

```sh
pnpm --filter billing-http grant 9
pnpm --filter billing-http worker
```

Run the worker again to retry failed delivery using the stored event IDs. The worker stops on events older than 23 hours for manual reconciliation. The default SQLite file lives at `examples/billing-http/.data/billing.sqlite` when using these commands. Its transactional credits/outbox survive restarts and can be shared by processes on one host; use a shared database for multiple hosts. Do not change providers with pending events in this database. Demo grants are not a payment webhook: real purchases must be verified and processed idempotently.

Builds and automated tests do not require hosted credentials. Tests use local transports or fakes; live provider validation requires your own configured account.
