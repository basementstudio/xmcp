---
"xmcp": minor
"@xmcp-dev/compiler": minor
---

Accept complete Zod schemas for a tool's `schema` and `outputSchema` alongside field maps. Complete output schemas can describe arrays, primitives, and unions, and tools with one can return the data directly as shorthand for `{ structuredContent: data }`. `InferSchema` infers both forms.
