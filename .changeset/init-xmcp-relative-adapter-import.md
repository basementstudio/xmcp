---
"init-xmcp": patch
---

Print a relative `.xmcp/adapter/index.js` import in the Express and Fastify setup hints. The `@xmcp/adapter` alias is not rewritten by `tsc`, so a server compiled with `tsc` and started with Node could not find it.
