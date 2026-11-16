---
"xmcp": minor
"@xmcp-dev/compiler": minor
---

Add optional `cacheHints` config and a per-resource `cacheHint` metadata field for MCP 2026-07-28 cache hints. Configured listing and read results carry the given `ttlMs` and `cacheScope`; unset methods keep the SDK defaults (`ttlMs: 0`, `cacheScope: "private"`).
