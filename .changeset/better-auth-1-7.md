---
"@xmcp-dev/better-auth": major
---

Upgrade to better-auth 1.7 and `@better-auth/mcp` to fix GHSA-965c-763c-88jm (critical), GHSA-q84f-53jg-9ppm, GHSA-r4xp-prcw-77qf and GHSA-44jh-23m7-hpcf. Breaking: it requires `xmcp` 1.10.3 or later, which serves the consent page on Vercel; run the database upgrade script in the README (it replaces the OAuth tables, so MCP clients must reconnect), users now approve each client on a new consent page, and the session no longer includes `refreshToken` or `refreshTokenExpiresAt`.
