# Website guidance - xmcp

Use this file for `apps/website/**`.

## Standards

- Docs/site-only PRs target `main`; code/package/example changes target
  `canary`.
- Docs must match the current code and package APIs. Check source before
  documenting behavior.
- User-facing feature changes in packages, examples, templates, transports, or
  plugins should include docs updates and link to or align with a runnable
  example.
- Keep code snippets copy-pasteable and aligned with existing examples.
- Do not invent configuration fields, package names, or CLI flags.
- Preserve the existing visual system and component patterns.
- Avoid adding client-side interactivity or new dependencies unless the page
  needs it.

## Checks

- Run `pnpm --filter website lint` for site code changes.
- Run `pnpm --filter website build` when routes, MDX, content loading, search,
  or rendered docs can be affected.
- If a docs change describes package behavior, run the relevant package or
  example check too.
