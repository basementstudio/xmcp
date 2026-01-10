# @xmcp-dev/x402

x402 payment protocol integration for xmcp. Enables paid tools that require USDC payments on Base network.

## Installation

```bash
npm install @xmcp-dev/x402
# or
pnpm add @xmcp-dev/x402
```

## Quick Start

### 1. Configure middleware

Create `src/middleware.ts`:

```typescript
import { x402Middleware } from "@xmcp-dev/x402";

export default x402Middleware({
  wallet: process.env.X402_WALLET, // Your wallet address to receive payments
  facilitator: "https://x402.org/facilitator",
  defaults: {
    price: "0.01",      // Default price in USD
    currency: "USDC",
    network: "base-sepolia", // or "base" for mainnet
  },
});
```

### 2. Create paid tools

Wrap your tool handlers with `paid()`:

```typescript
// src/tools/my-tool.ts
import { paid } from "@xmcp-dev/x402";

// Uses default price from middleware ($0.01)
export default paid(async function myTool({ input }) {
  return `Result: ${input}`;
});
```

With custom pricing:

```typescript
// src/tools/premium-tool.ts
import { paid } from "@xmcp-dev/x402";

export default paid(
  { price: "0.10" }, // Override default price
  async function premiumTool({ input }) {
    return `Premium result: ${input}`;
  }
);
```

### 3. Access payment context

Inside paid tool handlers, you can access payment information:

```typescript
import { paid, payment } from "@xmcp-dev/x402";

export default paid(async function myTool({ input }) {
  const ctx = payment();
  console.log(`Paid by: ${ctx.payer}`);
  console.log(`Amount: ${ctx.amount}`);
  console.log(`Network: ${ctx.network}`);
  
  return `Thanks for your payment!`;
});
```

## API Reference

### `x402Middleware(config)`

Configures x402 payments for all paid tools.

```typescript
interface X402Config {
  wallet: string;           // Wallet address to receive payments
  facilitator?: string;     // Facilitator URL (default: https://x402.org/facilitator)
  defaults?: {
    price?: string;         // Default price (default: "0.01")
    currency?: string;      // Currency (default: "USDC")
    network?: string;       // Network: "base" or "base-sepolia"
    maxPaymentAge?: number; // Payment timeout in seconds (default: 300)
  };
}
```

### `paid(handler)` / `paid(options, handler)`

Marks a tool as requiring payment.

```typescript
interface X402ToolOptions {
  price?: string;           // Override default price
  currency?: string;        // Override default currency
  network?: string;         // Override default network
  maxPaymentAge?: number;   // Override default timeout
  description?: string;     // Payment description
}
```

### `payment()`

Returns the current payment context inside a paid tool handler.

```typescript
interface X402PaymentContext {
  payer: string;            // Address that made the payment
  amount: string;           // Amount in atomic units
  network: string;          // Blockchain network
  asset: string;            // Token contract address
  toolName: string;         // Name of the tool
  transactionHash?: string; // Available after settlement
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `X402_WALLET` | Your wallet address to receive payments |
| `X402_FACILITATOR` | Custom facilitator URL (optional) |

## Supported Networks

- `base` - Base mainnet (USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- `base-sepolia` - Base Sepolia testnet (USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)

## How It Works

1. Client calls a paid tool without payment → Server returns payment requirements
2. Client signs payment authorization using x402 protocol
3. Client resends request with payment in `_meta["x402/payment"]`
4. Server verifies payment with facilitator
5. Tool executes, payment is settled
6. Response includes settlement info in `_meta["x402/payment-response"]`

## License

MIT
