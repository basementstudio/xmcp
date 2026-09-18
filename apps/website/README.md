# xmcp website

Use Node 22 and pnpm. From the repository root:

```bash
pnpm install
pnpm --filter @xmcp-dev/compiler... build
pnpm --filter website dev
```

Open http://localhost:3000. Docs and blog posts live in `content/docs/` and
`content/blog/` as MDX. Testimonials and showcase entries are local Markdown;
editing any of these files goes through a pull request and deployment.
No CMS account or token is needed. Templates continue to use the
[`xmcp-dev/templates`](https://github.com/xmcp-dev/templates) repository.

## Showcase submissions

1. Fork the repository and create a branch.
2. Add your logo to `apps/website/public/showcase/`. Use a PNG, JPG, WebP, or
   SVG image; a square image works best.
3. Add `apps/website/content/showcase/your-server.md`, following this format:

   ```md
   ---
   name: "Your server"
   connection: "https://example.com/mcp"
   repositoryUrl: "https://github.com/your-org/your-server"
   tag: "Developer tools"
   logo: "/showcase/your-server.png"
   ---

   A short description of what your MCP server does.
   ```

4. Run the checks below and open a pull request against `main` for review.

`name`, `connection`, `logo`, and the description body are required.
`connection` may be an HTTP endpoint or a STDIO command. `repositoryUrl` and
`tag` are optional; omit them when they do not apply. Repository links must be
HTTP or HTTPS URLs. There is no need to include a contact email.

The filename identifies the entry. The body is a short plain-text tagline,
rendered as text in the card and its structured data; do not add headings,
formatting, or JSX. Logos use site-relative paths to files under `public/`,
not remote image URLs.

## Testimonials

Add one `.md` file per testimonial in `apps/website/content/testimonials/` and
place its image in `apps/website/public/testimonials/`:

```md
---
name: "Example developer"
handle: "@example"
position: "Engineer at Example"
logo: "/testimonials/example.jpg"
---

xmcp helped us ship our MCP server.
```

`name`, `handle`, and the body are required. `name` is the image's alternative
text. Handles may include or omit the leading `@`. `position` and `logo` are
optional. The body is the plain-text quote; the card adds quotation marks.

## Ordering and validation

Both collections accept an optional integer `order` in frontmatter. Entries
with an order appear first, in ascending order; ties and unordered entries are
sorted by filename. Omit `order` on a submission unless its position matters.

The server loads and validates the files when rendering the pages, including
during the production build. Invalid frontmatter, empty required fields or
bodies, and missing or remote logo files fail with the content filename in
the error. Optional fields should be omitted rather than left empty.

## Checks

Run from the repository root:

```bash
pnpm --filter website lint
pnpm --filter website build
```

Check `/` and `/showcase` locally for text, images, ordering, carousel behavior,
connection copy buttons, and links. The website itself is the runnable example
for content changes; no framework example is needed.
