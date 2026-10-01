---
"xmcp": minor
---

Extend MCP middleware to prompts, resource reads, completion, and component listings, sharing request context across each operation. Check `ctx.method` before accessing operation-specific parameters in existing tool middleware.
