---
"@xmcp-dev/auth0": patch
"@xmcp-dev/better-auth": patch
"@xmcp-dev/clerk": patch
"@xmcp-dev/commet": patch
"@xmcp-dev/descope": patch
"@xmcp-dev/polar": patch
"@xmcp-dev/scalekit": patch
"@xmcp-dev/workos": patch
"@xmcp-dev/x402": patch
---

Widen the `xmcp` peer range to `>=0.7.0 <1.0.0`. The published range was a
caret pinned to whichever core version happened to be current at the time, so it
went stale and rejected newer 0.x releases of xmcp that the plugin works with.
