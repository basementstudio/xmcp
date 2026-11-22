---
"@xmcp-dev/auth0": patch
---

Check tool permissions for every `tools/call` in a JSON-RPC batch, not only the first. Previously a user without `tool:<name>` could call a private tool by placing it after a public tool in the same batch request. Reported by Aleksandr Tynianov (@tynianov1).
