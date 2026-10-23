# Website guidance - xmcp

Use this file for `apps/website/**`.

## Standards

- All PRs target `main`.
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

## Blog

- Each `.mdx` in `content/blog/` becomes a post at `/blog/<filename>`. Frontmatter
  fields are defined in `source.config.ts` (the `blog` schema) and read by
  `utils/blog/index.ts`.
- Set `unlisted: true` to keep a post out of the curated `/blog` feed, home
  strip, and featured slot. Published posts remain in the sitemap; that permits
  discovery but does not guarantee indexing. Guides (including unlisted posts)
  appear in `/guides` and may be linked from relevant pages.
- Use `metadataTitle` for an optional complete docs search title; visible titles
  remain independent. Set `lastModified: "YYYY-MM-DD"` only after a substantive
  content update. Do not refresh dates for builds or cosmetic changes.
- Integration docs automatically appear in `/docs/integrations`, its Markdown
  mirror, and the sitemap. The hub uses the same content source as the docs.

## Checks

- Run `pnpm --filter website lint` for site code changes.
- Run `pnpm --filter website build` when routes, MDX, content loading, search,
  or rendered docs can be affected.
- If a docs change describes package behavior, run the relevant package or
  example check too.
