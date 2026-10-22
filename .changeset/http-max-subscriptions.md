---
"@xmcp-dev/compiler": minor
"xmcp": minor
---

Add optional `http.maxSubscriptions` to limit concurrent subscription streams
per HTTP handler across standalone HTTP, Vercel, Cloudflare, and all HTTP
adapters. Set it to `0` to reject `subscriptions/listen` before opening a stream;
omitting it preserves the SDK default. This does not limit stream duration or
change ordinary requests, tool-call streaming, or STDIO behavior.
