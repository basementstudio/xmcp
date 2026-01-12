# @xmcp-dev/x402

x402 payment protocol plugin for xmcp. Add paid tools with USDC on Base.

## Installation

```bash
pnpm add @xmcp-dev/x402
```

## Usage

### Middleware

```typescript
// src/middleware.ts
import { x402Middleware } from "@xmcp-dev/x402";

export default x402Middleware({
  wallet: process.env.X402_WALLET!,
  defaults: {
    price: 0.01,
    network: "base-sepolia",
  },
});
```

### Paid tools

```typescript
// src/tools/my-tool.ts
import { paid } from "@xmcp-dev/x402";

export default paid(async ({ input }) => {
  return { content: [{ type: "text", text: `Result: ${input}` }] };
});
```

```typescript
// src/tools/premium-tool.ts
import { paid } from "@xmcp-dev/x402";

export default paid({ price: 0.10 }, async ({ input }) => {
  return { content: [{ type: "text", text: `Premium: ${input}` }] };
});
```

### Payment context

```typescript
import { paid, payment } from "@xmcp-dev/x402";

export default paid(async ({ input }) => {
  const { payer, amount, network } = payment();
  return { content: [{ type: "text", text: `Paid by ${payer}` }] };
});
```

## API

### `x402Middleware(config)`

```typescript
interface X402Config {
  wallet: string;
  facilitator?: string;
  debug?: boolean;
  defaults?: {
    price?: number;
    currency?: string;
    network?: string;
    maxPaymentAge?: number;
  };
}
```

### `paid(options?, handler)`

```typescript
interface X402ToolOptions {
  price?: number;
  currency?: string;
  network?: string;
  maxPaymentAge?: number;
  description?: string;
}
```

### `payment()`

```typescript
interface X402PaymentContext {
  payer: string;
  amount: string;
  network: string;
  asset: string;
  toolName: string;
  transactionHash?: string;
}
```

## Networks

| Network | USDC Address |
|---------|--------------|
| `base` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| `base-sepolia` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

## License

MIT
