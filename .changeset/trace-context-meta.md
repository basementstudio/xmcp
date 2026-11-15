---
"xmcp": minor
---

Read W3C trace context from MCP request `_meta` in execution logs, so `trace.id` and `parent.id` are recorded on STDIO as well as HTTP. `_meta.traceparent` takes precedence over the HTTP `traceparent` header. `getRequestContext()` now exposes a read-only copy of the current request's `_meta`.
