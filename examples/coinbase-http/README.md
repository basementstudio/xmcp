# Coinbase agent payments example

Set CDP API key ID/secret and `PAY_TO` (the seller’s receiving address). The buyer also needs `CDP_WALLET_SECRET`. All payments in this example use Base Sepolia testnet USDC. Never fund this demo with mainnet assets.

From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler --filter=@xmcp-dev/coinbase
pnpm install --frozen-lockfile
cp examples/coinbase-http/.env.example examples/coinbase-http/.env
# Fill in .env before starting.
pnpm --filter coinbase-http build
pnpm --filter coinbase-http start
```

The MCP endpoint is `http://localhost:3001/mcp`.

In another terminal, retrieve/provision the managed buyer wallet and fund its printed address with testnet USDC yourself. Then buy a report:

```sh
pnpm --filter coinbase-http buyer --address
pnpm --filter coinbase-http buyer
```

The buyer only pays the configured recipient on Base Sepolia with testnet USDC, up to 0.01 USDC per call and 0.05 USDC in 24 hours. The SDK’s default cumulative budget is process-local; do not rely on it across restarts or replicas. Production needs durable budget enforcement and wallet policies. The buyer uses x402 HTTP headers and a payment-aware fetch; a plain MCP client receives HTTP 402 on the paid tool. Discovery is free.

Builds and automated tests do not require hosted credentials. Tests use local transports or fakes; live provider validation requires your own configured account.
