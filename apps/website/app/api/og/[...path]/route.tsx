import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";
import { getBlogPostBySlug, type BlogCategory } from "@/utils/blog";
import { getDocsMetadata } from "@/utils/docs";
import { GUIDE_TOPIC_LABELS } from "@/lib/guide-topics";
import { getBaseUrl } from "@/lib/base-url";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const SAFE_X = 84;
const SAFE_TOP = 80;
const SAFE_BOTTOM = 92;
const DESCRIPTION_LIMIT = 96;

export const runtime = "nodejs";

type OgTheme = "light" | "dark";

interface OgPalette {
  readonly background: string;
  readonly ink: string;
  readonly text: string;
  readonly well: string;
}

const PALETTES: Record<OgTheme, OgPalette> = {
  light: {
    background: "#f4f3ee",
    ink: "#171717",
    text: "#525252",
    well: "rgba(17, 17, 17, 0.055)",
  },
  dark: {
    background: "#121211",
    ink: "#ededed",
    text: "#a3a3a3",
    well: "rgba(237, 237, 237, 0.08)",
  },
};

const FIGURES = [
  "silk",
  "fine",
  "swirl",
  "edge",
  "rain",
  "tangle",
  "corner",
] as const;

const CATEGORY_PILLS: Record<BlogCategory, string> = {
  changelog: "Changelog",
  guides: "Guide",
  engineering: "Engineering",
};

const CATEGORY_THEMES: Record<BlogCategory, OgTheme> = {
  changelog: "light",
  guides: "dark",
  engineering: "light",
};

const X_MARK_PATH =
  "M0 5H1.00213V6H0V5ZM1.00213 22V19H2.00426V18H3.0064V17H5.01066V16H6.01279V15H7.01492V17H9.01919V18H10.0213V19H11.0235V20H10.0213V21H9.01919V22H8.01706V21H7.01492V20H5.01066V21H4.00853V23H5.01066V24H3.0064V23H2.00426V22H1.00213ZM1.00213 5V3H2.00426V2H3.0064V1H7.01492V2H9.01919V3H10.0213V5H11.0235V6H12.0256V7H13.0277V8H12.0256V9H17.0362V10H16.0341V11H14.0298V13H15.032V14H16.0341V15H17.0362V17H18.0384V18H19.0405V19H17.0362V20H16.0341V21H15.032V20H14.0298V18H13.0277V16H12.0256V15H11.0235V13H9.01919V12H2.00426V11H3.0064V10H4.00853V9H8.01706V8H7.01492V6H6.01279V4H5.01066V3H4.00853V4H2.00426V5H1.00213ZM7.01492 15V14H8.01706V15H7.01492ZM8.01706 14V13H9.01919V14H8.01706ZM11.0235 19V18H12.0256V19H11.0235ZM11.0235 5V4H12.0256V5H11.0235ZM12.0256 4V3H13.0277V1H15.032V2H17.0362V1H19.0405V4H18.0384V5H16.0341V6H15.032V5H14.0298V7H13.0277V4H12.0256ZM19.0405 18V17H20.0426V18H19.0405ZM19.0405 1V0H20.0426V1H19.0405Z";

const pillDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function fetchGeist(weight: 400 | 500) {
  return fetch(
    `https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-${weight}-normal.woff`
  )
    .then((res) => res.arrayBuffer())
    .catch((error) => {
      console.error(`Failed to fetch Geist ${weight} for OG image:`, error);
      return null;
    });
}

const geistRegular = fetchGeist(400);
const geistMedium = fetchGeist(500);

const figureCache = new Map<string, string | null>();

function figureDataUrl(theme: OgTheme, key: string) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const file = `${theme}-${FIGURES[hash % FIGURES.length]}.png`;

  if (!figureCache.has(file)) {
    try {
      const buffer = fs.readFileSync(
        path.join(process.cwd(), "public", "og", "figures", file)
      );
      figureCache.set(
        file,
        `data:image/png;base64,${buffer.toString("base64")}`
      );
    } catch (error) {
      console.error(`Failed to read OG figure ${file}:`, error);
      figureCache.set(file, null);
    }
  }

  return figureCache.get(file) ?? null;
}

function truncate(text: string, limit: number) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:]$/, "")}…`;
}

function titleSize(title: string) {
  if (title.length <= 30) return 76;
  if (title.length <= 50) return 64;
  return 54;
}

function parseTheme(value: string | null): OgTheme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}

interface OgContent {
  readonly title: string;
  readonly description: string;
  readonly pills: readonly string[];
  readonly theme: OgTheme;
}

type ResolveResult =
  | { readonly ok: true; readonly content: OgContent }
  | { readonly ok: false; readonly response: Response };

function resolveOgContent(
  type: string,
  rest: string[],
  baseUrl: string
): ResolveResult {
  switch (type) {
    case "blog": {
      const slug = rest.join("/");
      if (!slug) {
        return {
          ok: true,
          content: {
            title: "Blog",
            description: "Latest updates, guides, and insights about xmcp.",
            pills: ["Blog"],
            theme: "light",
          },
        };
      }

      const post = getBlogPostBySlug(slug);
      if (!post) {
        return {
          ok: false,
          response: new Response("Blog post not found", { status: 404 }),
        };
      }

      const detail =
        post.category === "guides"
          ? post.topic && GUIDE_TOPIC_LABELS[post.topic]
          : post.date && pillDate.format(new Date(post.date));

      return {
        ok: true,
        content: {
          title: post.title,
          description: post.summary ?? post.description ?? "",
          pills: detail
            ? [CATEGORY_PILLS[post.category], detail]
            : [CATEGORY_PILLS[post.category]],
          theme: CATEGORY_THEMES[post.category],
        },
      };
    }

    case "docs": {
      const slug = rest.length === 0 ? undefined : rest;
      if (!slug) {
        return {
          ok: true,
          content: {
            title: "xmcp Documentation",
            description: "The framework for building & shipping MCP servers.",
            pills: ["Docs"],
            theme: "dark",
          },
        };
      }

      const meta = getDocsMetadata(slug, baseUrl);
      if (!meta) {
        return {
          ok: false,
          response: new Response("Documentation page not found", {
            status: 404,
          }),
        };
      }

      return {
        ok: true,
        content: {
          title: meta.title,
          description: meta.summary ?? meta.description,
          pills: ["Docs"],
          theme: "dark",
        },
      };
    }

    case "templates": {
      return {
        ok: true,
        content: {
          title: "Templates",
          description:
            "Quickstart with xmcp using real-world templates and best practices.",
          pills: ["Templates"],
          theme: "light",
        },
      };
    }

    default:
      return {
        ok: false,
        response: new Response("Invalid content type", { status: 400 }),
      };
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  try {
    const params = await props.params;
    const segments = Array.isArray(params.path) ? params.path : [params.path];

    if (segments.length === 0) {
      return new Response("Invalid path", { status: 400 });
    }

    const [type, ...rest] = segments;
    const result = resolveOgContent(type, rest, getBaseUrl());
    if (!result.ok) {
      return result.response;
    }

    const { title, description, pills } = result.content;
    const theme =
      parseTheme(request.nextUrl.searchParams.get("theme")) ??
      result.content.theme;
    const palette = PALETTES[theme];
    const figure = figureDataUrl(theme, segments.join("/"));
    const size = titleSize(title);

    const [regular, medium] = await Promise.all([geistRegular, geistMedium]);
    const fonts = [
      regular && { name: "Geist", data: regular, weight: 400 as const },
      medium && { name: "Geist", data: medium, weight: 500 as const },
    ].filter((font) => font !== null);

    return new ImageResponse(
      <div
        style={{
          width: OG_WIDTH,
          height: OG_HEIGHT,
          display: "flex",
          position: "relative",
          backgroundColor: palette.background,
          fontFamily: "Geist",
        }}
      >
        {figure && (
          <img
            src={figure}
            alt=""
            width={OG_WIDTH}
            height={OG_HEIGHT}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: SAFE_TOP,
            left: SAFE_X,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="36" height="41" viewBox="0 0 21 24">
            <path d={X_MARK_PATH} fill={palette.ink} />
          </svg>
          {pills.map((pill) => (
            <div
              key={pill}
              style={{
                display: "flex",
                alignItems: "center",
                height: 42,
                marginLeft: pill === pills[0] ? 21 : 9,
                padding: "0 20px",
                borderRadius: 21,
                backgroundColor: palette.well,
                color: palette.text,
                fontSize: 21,
                fontWeight: 500,
                letterSpacing: -0.15,
              }}
            >
              {pill}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: SAFE_X,
            bottom: SAFE_BOTTOM,
            display: "flex",
            flexDirection: "column",
            width: 680,
          }}
        >
          <div
            style={{
              display: "flex",
              color: palette.ink,
              fontSize: size,
              fontWeight: 500,
              lineHeight: `${Math.round(size * 1.02)}px`,
              letterSpacing: -size * 0.045,
              marginLeft: -size * 0.05,
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                maxWidth: 600,
                color: palette.text,
                fontSize: 27,
                fontWeight: 400,
                lineHeight: "36px",
              }}
            >
              {truncate(description, DESCRIPTION_LIMIT)}
            </div>
          )}
        </div>
      </div>,
      { width: OG_WIDTH, height: OG_HEIGHT, fonts }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
