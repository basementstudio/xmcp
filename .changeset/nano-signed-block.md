---
"@xmcp-dev/x402": minor
---

Nano: accept a payment sent as a signed send block (`payload.block`, the form clients of the x402 Nano `exact` scheme send) beside `payload.blockHash`. The block is checked against the offer before anything is sent, published through `nano.rpc`, and verified and claimed by its hash once the node confirms it.
