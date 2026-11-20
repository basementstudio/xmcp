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
- Give every guide a `topic` so it shows up under a `/guides` filter. Allowed
  values live in `lib/guide-topics.ts`; the blog schema rejects anything else.
- Use `metadataTitle` for an optional complete docs search title; visible titles
  remain independent. Set `lastModified: "YYYY-MM-DD"` only after a substantive
  content update. Do not refresh dates for builds or cosmetic changes.
- Integration docs automatically appear on the standalone `/integrations` hub,
  its Markdown mirror (`/integrations.md`), and the sitemap. The hub reads the
  same content source as the docs; `content/docs/integrations` has no index page.

## Checks

- Run `pnpm --filter website lint` for site code changes.
- Run `pnpm --filter website build` when routes, MDX, content loading, search,
  or rendered docs can be affected.
- If a docs change describes package behavior, run the relevant package or
  example check too.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
