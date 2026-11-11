---
"xmcp": minor
---

Add an optional `authorize` export to `src/middleware.ts`. One policy hides denied tools, prompts, resources, and resource templates from listings, rejects direct calls, prompt gets, and reads with the same errors as unknown components, and returns no completions for them, on HTTP and STDIO.
