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

## Changelog

`/changelog` and `/changelog.md` display stable framework releases from
[GitHub Releases](https://github.com/basementstudio/xmcp/releases), including
legacy `v…` tags and current `xmcp@…` tags. Companion packages, drafts, and
prereleases are excluded. Notes stay as published on GitHub; releases without
notes still appear.

The website build and development commands first fetch every API page into the
ignored `.generated/releases.json` snapshot. Production serves static HTML and
Markdown without contacting GitHub. New releases and edits appear on the next
deployment. The website Turbo build cache is disabled to refresh even on an
unchanged redeploy; dependency builds retain their caches.

Production builds also remove the previous `.next` output before compiling.
This prevents restored deployment artifacts from serving an older stylesheet
after a successful build. Package-manager and dependency build caches are kept.

Public releases need no credentials. Optionally set `GITHUB_TOKEN` in the build
or shell environment for authenticated API limits. This script reads the process
environment, not Next.js `.env` files; never use a `NEXT_PUBLIC_` token. Network,
API, or malformed-data failures stop startup/build and remove the old snapshot.
Retry after resolving the failure; an existing deployment remains available.

To refresh during local development:

```bash
pnpm --filter website changelog:refresh
```

Run the loader tests and Markdown rendering checks:

```bash
pnpm --filter website test:changelog
pnpm --filter xmcp exec tsx --test ../../apps/website/components/changelog/release-notes.test.tsx
```

Check `/changelog`, a version permalink, and `/changelog.md` on desktop and mobile.
Sending `Accept: text/markdown` to `/changelog` returns the same Markdown document.
The website is the runnable example; no framework API or separate example is needed.

## Website design system

This local visual test adapts the website components and tokens from
[SF Interface Numbers](https://numbers.sfinterface.com): serif page titles,
Roman-numeral section labels, specimen styling, left-aligned install commands, pill
controls, and white code cards with a fine outline and shallow shadow. These
patterns use the existing xmcp components; the Numbers package exports the number
animation, not the site's component library, so no package was added.

`app/design-system.css` owns the shared `--site-*` tokens: a 700px maximum reading
column, 168px navigation rail, 48px gap between columns, 56px section spacing,
12px card radii, and Geist body text at 14px/20.5px. Adhesion supplies page titles from `app/fonts/Adhesion-Regular.woff2`, loaded through `next/font/local`
with font swapping and -2px title letter spacing. EB Garamond supplies the numbers in section labels, the table of contents,
accordions, and showcase steps.
All pages use `site-page-grid`, including home, blogs, docs, templates, showcase,
FAQ, changelog, telemetry, and the terminal playground: twelve
columns inside the 700px reading column with a shared 24px gap. Their two-column
card grids use the same 640px breakpoint; mobile pages share 20px outer gutters.
Articles use `site-article-content`, and docs/blog share the `site-page-toc` rail.
Docs, navigation, listings and controls share these styles in both themes. The
xmcp wordmark and content remain; dark mode uses pure black.

Use the shared type roles instead of page-specific sizes: `site-description`
for 14px/160% introductions, `site-section-title` for 14px section headings,
`site-card-title` for 12.5px card titles, and `site-card-description` for 12.5px/160%
card copy. Blog cards, featured posts, templates, showcase entries and homepage
features use these same roles. Article subheadings never grow larger deeper in
the hierarchy. `site-card-surface` supplies the shared card and theme-aware hover.

Shared component rules live in `app/components.css`. Docs, blog posts and homepage
examples use the same `CodeBlock`: a single frame, 18px horizontal padding,
wrapping source, and an always-visible Copy control that reads the current code
when pressed. Copy feedback also reports clipboard failures. Terminal tabs follow
the same `CodeBlock` and support Arrow keys, Home and End; syntax colors follow the
theme. Inline code wraps without creating a horizontal scroll strip.
The homepage install command, Getting started steps, CLI prompts, showcase URLs
and template READMEs all use this component at 12px/19px. Command/output examples
copy only the runnable command, while code examples copy their full source.
Every code block has a shared header with a language badge, filename or language
label, and Copy. Filenames and declared fence languages take precedence;
recognizable unlabelled commands, URLs, JSON and code signatures can supply a
label. Ambiguous snippets use “Code” rather than an invented filename.
All Shell headers use the shared Lucide Animated terminal `CodeIcon`, overriding supplied Markdown icons so
commands, shell files, and terminal tabs share the same icon.
Single-line source scrolls horizontally below the header, including after tab
changes. Header space is reserved in server HTML to avoid hydration shifts.
Run the language checks with
`node --experimental-strip-types --test apps/website/lib/code-language.test.mjs`
from the repository root (Node 22).
Markdown commands receive their single-line layout in the server HTML so the
homepage install block does not shrink and move content when JavaScript loads.

`ContentTable` preserves table markup and adds column labels for stacked mobile
rows. Search keeps the existing engine, shortcuts and result navigation, using
the same surfaces and pill selection. Docs and blog TOCs share Roman-numeral
labels and an active pill that follows the section, with motion disabled for
reduced-motion preferences. Page actions remain below the TOC.
On desktop docs and blog articles, hovering over the reading column dims both
sidebars with a soft
800ms ease-in-out fade in both directions. The active TOC number, label, and
highlight stay fully visible so the current section remains easy to find. Leaving
the column or focusing a sidebar control with the keyboard restores them. This
uses CSS without changing layout or disabling controls, stays off on touch and
mobile layouts, and skips the fade when reduced motion is enabled.

Check `/` (open every Getting started step), `/docs/configuration/transports`,
`/docs/configuration/server-info`, `/docs/getting-started/installation`, a blog
post and `/templates` in light/dark themes and at 320px. Verify Copy and Copied
feedback, search with Cmd/Ctrl+K, Arrow/Enter/Escape, empty search results,
terminal-tab keyboard navigation, long code chips, mobile tables, and TOC links.

## Themes and homepage illustration

The website follows the system theme on first visit. The header uses a single visible sun/moon icon to switch between light and dark,
then persists that preference across navigation and reloads. Until a choice is
made, changes to the system appearance also update the site. The search icon opens the existing search dialog, also available with Cmd/Ctrl+K. Keep
both themes equally legible: shared surfaces, text, borders and focus states use
tokens in `app/globals.css`. Dark mode uses pure black (`#000000`); light mode
uses paper white (`#fdfdfc`). The site uses Geist for interface/body text and Adhesion for page titles. EB Garamond keeps the section indexes legible.
Shiki uses separate light and dark palettes.

All six homepage feature images share the prefooter X’s cursor-responsive
particle renderer through `components/particles/image.tsx`. Each supplies its own
texture; scenes load near the viewport and stop animating while offscreen or
when the page is hidden. Reduced motion and GPU failure retain static artwork.
The image container reserves its dimensions before the renderer loads.

To try the runnable examples, run `pnpm --filter website dev`. Open `/` for the
original cursor-responsive particle hero, displayed without a frame or control footer. WebGPU retains the WebGL fallback. Light mode inverts the finished
monochrome canvas and fallback artwork, preserving the original glow and motion
without rebuilding GPU resources on theme changes. Reduced motion uses the static
artwork, and offscreen or hidden pages suspend animation. Check both renderers,
GPU-unavailable fallback, theme changes, and narrow viewports.

The website is the runnable example. No framework API changes or separate
example package are needed.

## Image performance

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
Cards and detail pages frame monochrome provider artwork on a theme-aware
surface. Detail pages preload only the principal preview.
Local SVG provider artwork stays vector-based and does not need a blur preview;
remote raster covers keep Next.js optimization without inventing blur metadata.
Template README code snippets also use the docs theme variables and shared
semantic code-block background.

For performance checks, build and run production, not the development server:

```bash
pnpm --filter website build
pnpm --filter website start
```

Compare three fresh-browser runs of `/`, `/blog`, `/blog/xmcp-v1`, `/templates`,
`/templates/express`, and `/docs` at the same viewport, network and CPU settings.
Record transferred script/image bytes, LCP, CLS, and long-task blocking. Keep
image-optimizer cache state comparable and do not benchmark while a build is
running. Template metadata and detail content remain local. Check that the
docs do not load the homepage particle renderer, and that the AI dialog
loads only on first open or focus/hover. Verify both themes on desktop and mobile.

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

## Docs navigation

Docs use the same centered 700px maximum content column and left site navigation
as every other page. Documentation and its arrow form one toggle on every page. The docs tree opens
directly beneath it, starts expanded on docs routes, and keeps its toggle pinned
while the list scrolls. Site links and docs share one scrollable navigation
area, with search and theme controls outside it at the foot of the rail. Focus
indicators are inset so keyboard navigation stays visible at the scroll edges.
Both rails use rounded hover pills and single-line labels with ellipses; page
links retain their full accessible names and show their full labels on hover.
The table of contents lives in the right margin and tracks headings at their
native anchor scroll position on both docs and blog pages. Below 1200px, the site switches to its compact header and the docs
tree is available through **Browse docs**.

Docs sections and nested folders open by default. Readers can collapse them;
navigating to a page reopens its ancestors while preserving other section choices.
On small screens, **Browse docs** opens the keyboard-accessible navigation drawer.
The navigation fills the available viewport below the header. Scroll-edge fades soften rows entering the viewport; padding keeps the first
and last links fully visible. The mobile drawer fades only edges with more
content beyond them.

Page icons live in `components/layout/docs-icons.tsx`. Add a mapping when adding
a docs page; unmapped pages use a document icon and explicit page icons take
precedence. Check `/docs`, a deep link, and mobile navigation after changes.

Run the sidebar tree regression checks with Node 22:

```bash
pnpm --filter website exec node --experimental-strip-types --test scripts/docs-sidebar.test.mjs
pnpm --filter website exec tsx --test components/layout/docs-icons.test.tsx
```

## Footer navigation

The shared prefooter restores the interactive particle X and “One framework to
rule them all” headline above the footer. It follows the shared 700px column and
Adhesion title styling at 24px on all screens, inverts the monochrome artwork in light mode, and uses
the existing deferred renderer with static artwork for reduced motion or GPU
failure. The separate “Start building” call-to-action is omitted.

The shared footer pairs the wordmark with a short framework description, then
shows three labeled navigation groups. On phones, the community links span two
columns below Build and Explore. Keep labels descriptive and use crawlable links rendered in the initial
HTML.
The existing site-wide Organization and WebSite structured data remains the
source of entity metadata; the footer does not add duplicate schema.

Internal links stay in the same tab. External links open in a new tab with
`noopener noreferrer`, a visual indicator, and a screen-reader notice. Community
links pair their text labels with decorative SVG icons. All links have visible
keyboard focus and compact 32px link rows. Check keyboard navigation, text contrast, narrow screens,
and the mobile assistant button when editing the footer. The website is the
runnable example; no framework API or example package changes are needed.

## Corner radii

Use the website system’s `--site-radius` (12px) for content cards and code
blocks, 8px for compact controls, and fully rounded pills for category filters.
Inline code uses 6px corners. Clip images to their card’s rounded edges; connected
terminal tabs share rounded outer corners.
Keep divider lines straight and circular controls circular. Preview the docs,
showcase, templates, blog, and FAQ on desktop and mobile when changing these styles.

## Dialog motion

Search docs and Ask AI share a 200ms ease-in-out fade with a small vertical
movement and desktop scale animation. The backdrop fades at the same pace.
Reduced-motion preferences disable these animations. Keep panel and backdrop
classes paired, and verify opening, dismissal, and keyboard focus on desktop
and mobile when changing dialog motion.

## Link hover

Sidebar links use the same rounded hover treatment as the table of contents.
Text links have no underlines at rest, on hover, or during keyboard focus.
They keep their color feedback and visible focus outlines. The existing
`link-underline` class names now supply only color transitions, including when
the label is inside `link-underline-group`. Search matches use font weight rather
than underlines. Footer link icons, including brand marks and external-link
arrows, are explicitly 15 × 15px.

## Typography

All website routes, Markdown/MDX content, template READMEs, cards, and dialogs
share the typography tokens in `app/design-system.css`. The compact type scale
and light-theme text palette follow [Anatomy's website](https://skills.wheresryan.sh/anatomy).
Keep the existing layout and pure-black dark background.

| Role                  | Font        | Size / line height                 | Weight  |
| --------------------- | ----------- | ---------------------------------- | ------- |
| Page headline         | Adhesion    | 40px / 1.12; 34px on small screens | 500     |
| Body paragraph        | Geist       | 14px / 160%                        | 450     |
| Section heading       | Geist       | 14px / 20.5px                      | 550     |
| Card title            | Geist       | 12.5px / 18px                      | 500     |
| Card description      | Geist       | 12.5px / 160%                      | 450     |
| Navigation and labels | Geist       | 13px / 20px                        | 450     |
| Captions and controls | Geist       | 12px / 18px                        | 400–500 |
| Code block            | Geist Mono  | 12px / 19px                        | 400     |
| Inline code           | Geist Mono  | 12.5px                             | 400     |
| Section numbers       | EB Garamond | Context-sized                      | 400     |

All paragraphs and prose lists use `--site-paragraph-leading: 1.6` (160%),
including introductions, cards, quotes, template READMEs, and footer copy.
Navigation, headings, and code keep their own line-height roles.

Use `site-page-title` for page headlines, `site-section-title` for section
headings, and the shared card/body roles rather than new per-page font sizes.
Headline tracking stays at -2px. Markdown headings use Geist; they do not
inherit the page headline's display font.

Use semantic text colors: `--site-ink` for primary text, `--site-text` for
secondary copy, `--site-muted` for annotations, and `--site-faint` for quiet
indicators. The light values are #171717, #525252, #8f8f8f, and #bdbdbd;
dark equivalents are #ededed, #a3a3a3, #8f8f8f, and #525252. Existing brand
text utilities map to these roles. Syntax highlighting and status colors
remain distinct because they convey code structure or state.

The runnable example is the website itself: `pnpm --filter website dev`.
Review `/`, `/docs/getting-started/installation`, `/blog`, a blog article,
`/templates`, a template detail page, `/showcase`, `/faq`, `/changelog`,
`/telemetry`, and `/terminal` in both themes when changing these tokens.

## Icons and hover motion

Import common UI icons from `components/ui/site-icons.tsx`. It maps the site's
existing icon names to [Lucide Animated](https://lucide-animated.com/) components
at 15 × 15px. Provider glyphs retain their artwork and the same `site-icon` size.
Keep illustrations and wordmarks at their intended size; keep button hit areas
large enough for touch. Information, warning, trash, and status-dot glyphs use
static Lucide equivalents where the animated collection has no matching icon.

The vendored components in `components/ui/lucide-animated` retain the author's
paths, variants, and timings, using the existing `framer-motion` dependency.
See that directory's README and MIT license for provenance and local adaptations.
`icon-interaction.ts` connects their animation handles to the nearest button or
link's hover and keyboard focus. Touch, disabled controls, and reduced-motion
preferences do not trigger hover animations. Loading spinners keep their existing
loading behavior. Cleanup resets icons immediately, including when reduced motion
is enabled during an animation. There is no global transform applied to icons.

Run `pnpm --filter website dev` and open `/` and
`/docs/getting-started/installation`. Hover and keyboard-focus search, theme,
GitHub, sidebar links, and code-copy buttons. Check both themes, the 15px sizing,
copy feedback, and reduced-motion behavior.

## Persistent homepage scene

`PersistentHero` lives in the root layout. On the first homepage visit it lazily
loads the particle scene into a permanent layer. The canvas and its ancestors
stay connected to the same DOM parents across routes: there is no portal
reparenting, hidden route subtree, or renderer remount on navigation.

The homepage slot reserves the scene's space. A layout effect and resize/scroll
observers align the fixed layer with that slot before paint, including font
loading and responsive changes. On other routes the layer is invisible and
noninteractive, retains its dimensions and GPU resources, and stops rendering.
Returning home reveals the same scene; WebGPU presents a frame before paint.
Direct visits to other pages do not load the hero. A hard refresh initializes a
new scene. Reduced-motion and GPU-error artwork fallbacks remain available.

Run `pnpm --filter website dev`, visit `/`, navigate to `/blog` and `/docs`, and
return using the logo or browser history. Check that the canvas and every one of
its ancestors retain their identities, the initial return frame contains the
scene, scrolling/resizing keeps it aligned with its slot, and off-page GPU
rendering stays paused. Test both themes and reduced motion.

The latest-version link displays Roman numeral semver segments using the same
10.5px EB Garamond typesetting as the table-of-contents numbers
(e.g. `1.7.1` → `I.VII.I`; zero is `N`). Its accessible label and tooltip retain
the standard version, and prerelease suffixes remain unchanged.
