---
"xmcp": minor
---

Add an optional `authorize` export to `src/middleware.ts`. One policy hides denied tools, prompts, resources, resource templates, and skills from listings, rejects direct calls, prompt gets, and reads with the same errors as unknown components, and rejects denied completions like unknown references, on HTTP and STDIO.

Tool authorization receives raw arguments before SDK validation and shares request-local values with tool middleware and handlers. Skill catalogs authorize their SKILL.md resource before returning entries or pagination.
