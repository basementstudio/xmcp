# @xmcp-dev/x402

x402 payment protocol plugin for xmcp. Add paid tools with USDC on Base, or XNO on Nano.

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
  nano?: {
    wallet?: string; // nano_ address, falls back to `wallet`
    rpc?: string; // default: https://rpc.nano.to
  };
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

| Network | Asset |
|---------|-------|
| `base` | USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| `base-sepolia` | USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| `nano` | XNO (`nano:mainnet`) |

### Nano (XNO)

```typescript
// src/middleware.ts
export default x402Provider({
  wallet: process.env.X402_WALLET!,
  nano: { wallet: process.env.X402_NANO_WALLET },
});

// src/tools/word-count.ts - 0.001 XNO per call
export default paid({ network: "nano", price: 0.001 }, handler);
```

On `nano`, `price` is in XNO (no USD conversion). There is no facilitator: the
payer publishes a send block to `nano.wallet` and sends its hash as
`payload.blockHash`. The plugin reads the block from the Nano node RPC and
accepts it when it is a confirmed send of at least the price to `nano.wallet`
that has not paid for an earlier call. No key is held and nothing is broadcast.

By default the block hash is a bearer proof, and used hashes are kept in
memory, so they are forgotten on restart and not shared between instances.
Two opt-in settings close those gaps:

```typescript
export default x402Provider({
  wallet: process.env.X402_WALLET!,
  nano: {
    wallet: process.env.X402_NANO_WALLET,
    // Append every used block hash to this file (flushed before the call runs)
    claimsFile: "/var/lib/my-server/nano-claims.txt",
    // Bind each payment to one 402 offer
    requireBinding: true,
  },
});
```

- `claimsFile`: each block hash that pays for a call is appended to the file
  and flushed to disk before the tool runs, and the file is read back on
  start, so a block is still refused after a restart. A hash released because
  the tool failed is removed again. One file belongs to one server process.
- `requireBinding`: the 402 offer carries `extra.binding: "xno-binding/v1/rep"`
  and a fresh random `extra.orderId`. The payer sets the representative of its
  send block to the order commitment, the `nano_` encoding of
  `SHA-256("xno-binding/v1/rep|" + orderId + "|" + payTo + "|" + amount)` with
  `amount` in raw, sends exactly the price, and pays with
  `payload: { blockHash, orderId }`. A block seen on the public ledger then
  cannot be presented by anyone who does not hold its order id, and one block
  pays for one order.

## License

MIT
