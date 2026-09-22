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

## Image and animation performance

The homepage starts its particle animation on hydration. Its lossless
`/xmcp.webp` texture is preloaded by the homepage for its GPU renderer;
keep their URLs and anonymous CORS mode aligned to avoid
duplicate downloads. `/x.webp` is the footer texture. Both retain the original
PNG dimensions and decoded pixels. The PNGs remain error fallbacks.
The hero shows the canvas directly, without a still-image loading placeholder;
static hero artwork only mounts for reduced motion or a rendering failure.

The hero uses a dedicated WebGPU renderer on supported devices in secure contexts
(HTTPS or localhost). It renders the same 148,225 particles with WGSL shaders and
instanced quads, preserving the point sizing, camera, cursor trail, motion and
ACES/sRGB color pipeline. WebGPU cannot draw variable-sized point primitives, so
small rasterization differences from WebGL are expected. Keep `webgpu-shader.ts`
and the GLSL equations in `particles-cursor-animation.tsx` aligned when changing
the effect. The native path uses existing WebGPU type declarations and adds no
runtime dependency.

Missing adapters, initialization errors, GPU validation errors and device loss
load the original WebGL hero as a fallback. Three.js and React Three Fiber are
downloaded only for that fallback or the deferred footer. If both renderers
fail, the static artwork remains available. Native buffers, textures and devices
are released on teardown; resize replaces only the canvas attachments. `?debug`
works with either hero renderer. Inspect `canvas[data-renderer="webgpu"]` and its
`data-ready` attribute to confirm the native path is rendering.

The shared footer imports its scene as it approaches the viewport. Both scenes
stop rendering offscreen or in a hidden tab. Reduced motion and unavailable
WebGL use static artwork in the same reserved space. `?debug` loads the Leva
controls separately; normal visits do not download them. The AI dialog similarly
loads on first open (or warms on button focus/hover), then stays mounted to retain
conversation state.

Shared Home links disable automatic prefetch: prefetching the homepage also
pulls its eager WebGL assets into unrelated routes. Navigation still uses Next.js
links; other routes retain their existing prefetch behavior.

WebGL drawing-buffer preservation remains enabled: disabling it caused surrounding
text and buttons to disappear in Chromium visual checks. Recheck visual output
before changing that renderer option.

Use static image imports where possible to retain dimensions and blur metadata.
Match `sizes` to the image's actual grid and maximum width; homepage and blog
listing cards have different breakpoints. Keep lower-page images lazy and use
preload only for a principal above-the-fold image. Local raster template previews
use Next.js optimization; SVG artwork keeps direct loading. Image quality uses
the existing Next.js default of 75.

Blog covers use `lib/blog-images.ts` to map frontmatter URLs to static imports.
Register new covers there to include blur previews in the initial HTML and use
content-hashed image URLs; unregistered images still load through Next.js.
Keep the frontmatter URLs unchanged for feeds and social cards. The featured
cover is preloaded, and the first three listing cards load eagerly so the first
desktop row starts downloading before layout. Remaining listing cards and the
homepage blog strip stay lazy. This preserves AVIF/WebP delivery and quality
while avoiding empty image slots during loading.

Template listings likewise load their first three previews eagerly, including
after pagination or filtering; lower cards and related templates remain lazy.
Shared card/detail textures and the listing header use static imports with blur
previews. Decorative textures and shadows have low fetch priority so they do not
compete with the main preview. Detail pages preload only the principal preview.
Local SVG provider artwork stays vector-based and does not need a blur preview;
remote raster covers keep Next.js optimization without inventing blur metadata.
Template README code snippets also use the docs theme variables and shared
black code-block background.

For performance checks, build and run production, not the development server:

```bash
pnpm --filter website build
pnpm --filter website start
```

Compare three fresh-browser runs of `/`, `/blog`, `/blog/xmcp-v1`, `/templates`,
`/templates/express`, and `/docs` at the same viewport, network and CPU settings.
Record transferred script/image bytes, LCP, CLS, and long-task blocking, plus
time to the first textured hero frame: canvas animation is not represented by
LCP. Keep image-optimizer cache state comparable and do not benchmark while a
build is running. Template metadata and detail content are local; template pages must remain
populated even when GitHub is unavailable.

Check the waterfall for one early hero texture request, no initial Leva or chat
chunk, and no footer WebGL on a long page until it approaches the viewport.
Also check mobile/desktop resizing, cursor interaction, scrolling away/back,
hidden-tab resume, reduced motion, blocked textures/WebGL, and reopening chat.
For WebGPU, additionally test a missing adapter, rejected device/pipeline,
device loss and unmount during initialization. Compare native and WebGL fallback
on the same browser and hardware; headless browsers may expose `navigator.gpu`
without offering an adapter. Record the actual backend and GPU adapter, and
measure first textured submission/frame separately from steady-state animation.
This website is the runnable example for these loading behaviors; no framework
API or separate example package changes are required.

## Templates

The template catalog and detail-page READMEs live in `content/templates/*.md`.
The website loads these local files at build time; listing, search, categories,
HTML and Markdown detail pages, sitemap and LLM indexes do not fetch GitHub or
require a `GITHUB_TOKEN`. Changes appear on the next deployment. The runnable
template source code remains in `xmcp-dev/templates`, linked from each page.

To add or update an entry, edit a Markdown file named after its URL slug:

```md
---
name: "Express Starter"
description: "An Express MCP server using xmcp's adapter"
category: "framework"
tags: ["express", "adapter", "http"]
---

# Express Starter

Your setup guide and runnable code snippets go here.
```

`name`, `description`, and a nonempty Markdown body are required. The filename
sets `/templates/<slug>`; use lowercase letters, numbers and hyphens. `category`
and `tags` drive filtering, search, related templates and the existing local
provider artwork. An optional `previewUrl` must point to an existing file under
`public` (for example, `/templates/my-template.webp`); supported raster images
retain Next.js optimization and the listing's eager/lazy loading rules.

Source links default to `xmcp-dev/templates`, branch `main`, and a folder matching
the slug. Override `sourceRepo`, `sourceBranch` or `path` when needed. Optional
`websiteUrl`, `demoUrl`, `deployUrl` and `replitUrl` accept HTTP(S) URLs. Keep the
body aligned with the runnable template source when changing setup instructions.
Invalid metadata, missing preview files, empty bodies, or an empty catalog fail
the build instead of silently publishing an empty template listing.

The initial 13 entries were copied from `xmcp-dev/templates` at commit
`04a745014c289042d4673e86a9c08dd51069d0d7`. They are maintained here going forward; there is no
runtime synchronization. GitHub credentials configured for other services do
not affect this catalog and do not need to be copied into the website code.

Run the loader regression tests from the repository root with the existing
workspace test tooling:

```bash
pnpm --filter xmcp exec tsx --test ../../apps/website/app/templates/utils/content.test.ts
```

The website is the runnable example. Check `/templates`, search with and without
matches, a category, `/templates/express` and `/templates/express.md`. These
routes should keep working with GitHub API and raw-content requests blocked.

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
