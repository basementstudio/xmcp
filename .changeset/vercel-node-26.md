---
"@xmcp-dev/compiler": patch
---

Target the Node.js 26 runtime in Vercel build output (`nodejs26.x`) instead of `nodejs22.x`, ahead of Node 22's end of life. On Node 26, Vercel Functions' built-in `fetch` negotiates HTTP/2, so `response.statusText` is empty for HTTP/2 responses; set `VERCEL_FETCH_DISABLE_H2=1` to keep HTTP/1.1.
