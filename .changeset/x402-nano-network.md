---
"@xmcp-dev/x402": minor
---

Add the `nano` network. Paid tools can now accept XNO on `nano:mainnet` next to USDC on Base. Nano payments are verified directly against a Nano node RPC (confirmed send block to the configured `nano.wallet`, amount at least the price, no replay) instead of a facilitator. Prices on `nano` are in XNO. Base and Base Sepolia requirements are unchanged.
