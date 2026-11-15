---
"xmcp": patch
---

`createHTTPClient` and `createSTDIOClient` no longer advertise sampling, elicitation, and roots capabilities they cannot serve. They accept an optional `handlers` option, shared with the managed client, and advertise only the capabilities with a configured handler.
