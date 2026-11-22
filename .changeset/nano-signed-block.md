---
"@xmcp-dev/x402": minor
---

Nano: accept a payment sent as a signed send block (`payload.block`, the form clients of the x402 Nano `exact` scheme send) beside `payload.blockHash`. The block is checked against the offer before anything is sent, published through `nano.rpc`, and verified and claimed by its hash once the node confirms it. If the node has not confirmed a published block in time, the 402 error names its hash so the client can retry with it instead of paying again.

Accept the PaymentPayload as a JSON object in `_meta["x402/payment"]`, as the x402 MCP transport sends it, beside the base64-encoded string.
