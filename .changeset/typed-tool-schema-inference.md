---
"@xmcp-dev/compiler": minor
"xmcp": minor
---

Add opt-in `experimental.inferToolSchemas` to generate tool input validation and descriptions from TypeScript types and JSDoc. Resolve imported types and re-exported handlers, refresh schemas during development, and preserve explicit schema overrides. Unsupported inputs fail compilation with actionable diagnostics.

Support property JSDoc constraints for numeric bounds, string lengths, regular expressions, and email/URI/UUID formats, with source-located errors for invalid tags. Emit compact string enums with actionable validation errors and native boolean schemas.
