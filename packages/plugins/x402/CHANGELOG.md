# @xmcp-dev/x402

## 1.5.0

### Minor Changes

- 546c859: Nano: add `planNanoPayment` and `nanoPaymentPayload` for clients that pay tools on `nano`. The plan reads a 402 offer (v1 or v2) and gives the exact raw amount, the `payTo` account (checksum checked, optionally against an allow list) and, for an offer bound with `xno-binding/v1/rep`, the order-commitment representative the send must carry; an offer above the caller's `maxAmountRaw` is refused. The payload builds the `_meta["x402/payment"]` value from the hash of the send the payer's wallet published. Nothing signs or holds a key. Servers are unchanged.

## 1.4.0

### Minor Changes

- 3f200e3: Nano: add opt-in `nano.x402Version`. With `2`, the 402 offer for an unpaid call to a tool on `nano` is x402 v2 (network `nano:mainnet`, `amount`, a top-level `resource`), the terms x402 v2 Nano `exact` clients read. The default stays v1. Payments of either version are accepted, and tools on Base are unchanged.

## 1.3.0

### Minor Changes

- 6a981f4: Nano: accept a payment sent as a signed send block (`payload.block`, the form clients of the x402 Nano `exact` scheme send) beside `payload.blockHash`. The block is checked against the offer before anything is sent, published through `nano.rpc`, and verified and claimed by its hash once the node confirms it. If the node has not confirmed a published block in time, the 402 error names its hash so the client can retry with it instead of paying again.

  Accept the PaymentPayload as a JSON object in `_meta["x402/payment"]`, as the x402 MCP transport sends it, beside the base64-encoded string.

## 1.2.0

### Minor Changes

- 9246a41: Nano: add opt-in `nano.claimsFile` so used block hashes survive a restart, and `nano.requireBinding` to bind each payment to the order id of its 402 offer (xno-binding v1 representative commitment, exact amount).

## 1.1.1

### Patch Changes

- f48c55e: Update dependencies to their latest versions.

## 1.1.0

### Minor Changes

- bcd78bb: Add the `nano` network. Paid tools can now accept XNO on `nano:mainnet` next to USDC on Base. Nano payments are verified directly against a Nano node RPC (confirmed send block to the configured `nano.wallet`, amount at least the price, no replay) instead of a facilitator. Prices on `nano` are in XNO. Base and Base Sepolia requirements are unchanged.

## 1.0.0

### Patch Changes

- Updated dependencies [10bdd57]
  - xmcp@1.0.0

## 0.1.1

### Patch Changes

- 836b9b3: Widen the `xmcp` peer range to `>=0.7.0 <1.0.0`. The published range was a
  caret pinned to whichever core version happened to be current at the time, so it
  went stale and rejected newer 0.x releases of xmcp that the plugin works with.
