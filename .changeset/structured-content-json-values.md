---
"xmcp": minor
---

Allow any JSON value in a tool's `structuredContent`, as permitted by MCP 2026-07-28. Arrays, strings, numbers, booleans, and `null` are no longer rejected; the MCP SDK wraps non-object values as `{ result }` for clients on earlier protocol revisions.
