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
import { x402Provider } from "@xmcp-dev/x402";

export default x402Provider({
  wallet: process.env.X402_WALLET!,
  defaults: {
    price: 0.01,
    network: "base-sepolia",
  },
});
```

### Paid tools

```typescript
// src/tools/greet.ts
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { paid } from "@xmcp-dev/x402";

export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user (paid tool - $0.01)",
};

export default paid(async function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
});
```

```typescript
// src/tools/hash-string.ts
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { paid } from "@xmcp-dev/x402";

export const schema = {
  input: z.string().min(1).describe("The string to hash"),
};

export const metadata: ToolMetadata = {
  name: "hash-string",
  description: "Hash a string using SHA-256 (paid tool - $0.05)",
};

export default paid(
  { price: 0.05 },
  async function hashString({ input }: InferSchema<typeof schema>) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
);
```

### Payment context

```typescript
// src/tools/premium-analysis.ts
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { paid, payment } from "@xmcp-dev/x402";

export const schema = {
  data: z.string().describe("Data to analyze"),
};

export const metadata: ToolMetadata = {
  name: "premium-analysis",
  description: "Premium data analysis tool",
};

export default paid(
  { price: 0.10 },
  async function premiumAnalysis({ data }: InferSchema<typeof schema>) {
    const { payer, amount, network, transactionHash } = payment();

    return {
      analysis: `Analyzed: ${data}`,
      payment: {
        paidBy: payer,
        amount: amount,
        network: network,
        txHash: transactionHash,
      },
    };
  }
);
```

## API

### `x402Provider(config)`

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
