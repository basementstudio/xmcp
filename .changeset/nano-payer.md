---
"@xmcp-dev/x402": minor
---

Nano: add `planNanoPayment` and `nanoPaymentPayload` for clients that pay tools on `nano`. The plan reads a 402 offer (v1 or v2) and gives the exact raw amount, the `payTo` account (checksum checked, optionally against an allow list) and, for an offer bound with `xno-binding/v1/rep`, the order-commitment representative the send must carry; an offer above the caller's `maxAmountRaw` is refused. The payload builds the `_meta["x402/payment"]` value from the hash of the send the payer's wallet published. Nothing signs or holds a key. Servers are unchanged.
