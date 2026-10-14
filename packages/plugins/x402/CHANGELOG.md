# @xmcp-dev/x402

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
