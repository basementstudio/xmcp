---
"@xmcp-dev/compiler": patch
"xmcp": patch
---

Fix Vercel deployments logging `Vercel Runtime Timeout Error: Task timed out after 300 seconds` on every cold start. The build copied `dist/http.js` into the function, and that entry starts a server of its own and exports nothing. Vercel's Node launcher fell back to serving the port the entry listened on, and the listening socket kept the instance's event loop alive: the invocation that booted the server never settled and was killed once the function's maximum duration was reached, even though the response had already been sent in milliseconds. The instance died with it, so the next request cold started and repeated the cycle.

`--vercel` builds now use a runtime that exports a request handler and never listens, so the platform owns the server and each invocation ends with its response. Standalone (`dist/http.js`), adapter, and Cloudflare builds are unchanged.
