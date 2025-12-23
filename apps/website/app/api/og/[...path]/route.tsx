import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getBlogMetadata } from "@/utils/blog";
import { getDocsMetadata } from "@/utils/docs";
import { formatDate } from "@/utils/format-date";
import type { NextRequest } from "next/server";
import { getBaseUrl } from "@/lib/base-url";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export const runtime = "nodejs";

function readImageAsDataUrl(filePath: string, mimeType = "image/png") {
  try {
    const buffer = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error(`Failed to read image at ${filePath}:`, error);
    return null;
  }
}

const BG_IMAGE =
  readImageAsDataUrl(path.join(process.cwd(), "public", "og", "bg.png")) ??
  null;
const NOISE_IMAGE =
  readImageAsDataUrl(path.join(process.cwd(), "public", "og", "noise.png")) ??
  null;

const geistRegular = fetch(
  new URL(
    "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff"
  )
)
  .then((res) => res.arrayBuffer())
  .catch((error) => {
    console.error("Failed to fetch Geist font for OG image:", error);
    return null;
  });

const XmcpLogo = () => (
  <svg
    width="84"
    height="32"
    viewBox="0 0 63 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M52.5 18.1313V18.9556H58.5116V18.1313H56.794V14.2731H57.6526V15.1333H59.3703V15.9934H60.229V15.1333H61.9469V14.2731H62.8055V7.39184H61.9469V5.67147H61.0877V4.81129H59.3703V3.95117H57.6526V4.81129H55.9353V5.67147H55.0763V6.53165H52.5V7.39184H53.3587V18.1313H52.5ZM57.6526 14.2731V13.4129H56.794V5.67147H57.6526V6.53165H58.5116V7.39184H59.3703V14.2731H57.6526Z"
      fill="#F7F7F7"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M46.3668 16.9969H47.3703V15.9934H48.3739V14.9899H50.3809V15.9934H49.3775V16.9969H48.3739V18.0005H47.3703V19.004H44.3598V18.0005H42.3526V16.9969H41.3493V9.97232H40.3457V8.96879H41.3493V7.96527H42.3526V6.96175H43.3562V5.95822H45.3634V4.9547H47.3703V3.95117H48.3739V4.9547H49.3775V5.95822H50.3809V6.96175H51.3845V7.96527H50.3809V10.9758H49.3775V9.97232H48.3739V8.96879H47.3703V7.96527H46.3668V6.96175H45.3634V15.9934H46.3668V16.9969ZM50.3809 14.9899V13.9864H51.3845V14.9899H50.3809Z"
      fill="#F7F7F7"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M36.0598 3.95117V4.9547H35.0562V5.95822H34.0529V6.96175H32.0457V5.95822H31.0423V4.9547H30.0388V3.95117H29.0352V4.9547H28.0316V5.95822H27.0282V6.96175H25.021V5.95822H24.0175V4.9547H23.0141V3.95117H22.0105V4.9547H21.0069V5.95822H19V6.96175H21.0069V16.9969H20.0033V18.0005H22.0105V19.004H24.0175V18.0005H26.0246V16.9969H25.021V7.96527H27.0282V6.96175H28.0316V16.9969H27.0282V18.0005H29.0352V19.004H31.0423V18.0005H33.0493V16.9969H32.0457V7.96527H34.0529V6.96175H35.0562V16.9969H34.0529V18.0005H36.0598V19.004H38.067V18.0005H40.0739V16.9969H39.0703V7.96527H40.0739V6.96175H39.0703V5.95822H38.067V4.9547H37.0634V3.95117H36.0598Z"
      fill="#F7F7F7"
    />
    <path
      d="M0 5H1.00213V6H0V5ZM1.00213 22V19H2.00426V18H3.0064V17H5.01066V16H6.01279V15H7.01492V17H9.01919V18H10.0213V19H11.0235V20H10.0213V21H9.01919V22H8.01706V21H7.01492V20H5.01066V21H4.00853V23H5.01066V24H3.0064V23H2.00426V22H1.00213ZM1.00213 5V3H2.00426V2H3.0064V1H7.01492V2H9.01919V3H10.0213V5H11.0235V6H12.0256V7H13.0277V8H12.0256V9H17.0362V10H16.0341V11H14.0298V13H15.032V14H16.0341V15H17.0362V17H18.0384V18H19.0405V19H17.0362V20H16.0341V21H15.032V20H14.0298V18H13.0277V16H12.0256V15H11.0235V13H9.01919V12H2.00426V11H3.0064V10H4.00853V9H8.01706V8H7.01492V6H6.01279V4H5.01066V3H4.00853V4H2.00426V5H1.00213ZM7.01492 15V14H8.01706V15H7.01492ZM8.01706 14V13H9.01919V14H8.01706ZM11.0235 19V18H12.0256V19H11.0235ZM11.0235 5V4H12.0256V5H11.0235ZM12.0256 4V3H13.0277V1H15.032V2H17.0362V1H19.0405V4H18.0384V5H16.0341V6H15.032V5H14.0298V7H13.0277V4H12.0256ZM19.0405 18V17H20.0426V18H19.0405ZM19.0405 1V0H20.0426V1H19.0405Z"
      fill="#F7F7F7"
    />
  </svg>
);

interface OgContent {
  readonly title: string;
  readonly description: string;
  readonly summary: string | undefined;
  readonly date: string | undefined;
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
            title: "Blog - xmcp",
            description: "Latest updates, guides, and insights about xmcp.",
            summary: undefined,
            date: undefined,
          },
        };
      }

      const meta = getBlogMetadata(slug, baseUrl);
      if (!meta) {
        return {
          ok: false,
          response: new Response("Blog post not found", { status: 404 }),
        };
      }

      return {
        ok: true,
        content: {
          title: meta.title,
          description: meta.description,
          summary: meta.summary,
          date: meta.date,
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
            summary: undefined,
            date: undefined,
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
          description: meta.description,
          summary: meta.summary,
          date: undefined,
        },
      };
    }

    case "examples": {
      return {
        ok: true,
        content: {
          title: "Shaping the future of MCP tooling",
          description:
            "xmcp now supports building compatible UI resources and tools with the OpenAI Apps SDK, out of the box.",
          summary: undefined,
          date: "2025-12-11",
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
  _request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  try {
    const params = await props.params;
    const path = Array.isArray(params.path) ? params.path : [params.path];

    if (path.length === 0) {
      return new Response("Invalid path", { status: 400 });
    }

    const [type, ...rest] = path;
    const baseUrl = getBaseUrl();

    const result = resolveOgContent(type, rest, baseUrl);
    if (!result.ok) {
      return result.response;
    }

    const { title, description, summary, date } = result.content;

    const geistData = await geistRegular;

    return new ImageResponse(
      <div
        tw={`h-[${OG_HEIGHT}px] w-[${OG_WIDTH}px] flex bg-black relative overflow-hidden`}
        style={{
          padding: "64px",
          boxShadow: "0 0 250px 8px rgba(0, 0, 0, 0.80) inset",
        }}
      >
        {/* Background image */}
        <img
          src={BG_IMAGE ?? `${baseUrl}/og/bg.png`}
          alt="Background"
          width={OG_WIDTH}
          height={OG_HEIGHT}
          tw={`absolute top-0 left-0 w-[${OG_WIDTH}px] h-[${OG_HEIGHT}px]`}
          style={{ mixBlendMode: "plus-lighter", objectFit: "cover" }}
        />
        {/* Noise overlay */}
        <img
          src={NOISE_IMAGE ?? `${baseUrl}/og/noise.png`}
          alt="Noise"
          width={OG_WIDTH}
          height={OG_HEIGHT}
          tw={`absolute top-0 left-0 w-[${OG_WIDTH}px] h-[${OG_HEIGHT}px]`}
          style={{ mixBlendMode: "overlay", objectFit: "cover", opacity: 0.4 }}
        />
        {/* Logo - top right */}
        <div
          style={{
            position: "absolute",
            top: "64px",
            right: "64px",
            display: "flex",
          }}
        >
          <XmcpLogo />
        </div>
        {/* Date tag - top left */}
        {date && (
          <div
            style={{
              position: "absolute",
              top: "64px",
              left: "64px",
              display: "flex",
              alignItems: "center",
              padding: "4px 8px",
              border: "1px dashed #525252",
              backgroundColor: "rgba(245, 245, 245, 0.07)",
              color: "#A8A8A8",
              fontFamily: "Geist",
              fontStyle: "normal",
              fontSize: "24px",
              fontWeight: 500,
              lineHeight: "100%",
              letterSpacing: "1.92px",
              textTransform: "uppercase",
            }}
          >
            {formatDate(date)}
          </div>
        )}
        {/* Text content - bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: "64px",
            left: "64px",
            right: "64px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
          }}
        >
          <h1
            style={{
              display: "flex",
              color: "white",
              margin: 0,
              marginBottom: "16px",
              fontFamily: "Geist",
              fontSize: "74px",
              fontWeight: 400,
              lineHeight: "110%",
              letterSpacing: "-1.04px",
              textShadow: "0 0 52px rgba(255, 255, 255, 0.60)",
              textWrap: "balance",
            }}
          >
            {title}
          </h1>
          {((type === "blog" && summary) || (type !== "blog" && description)) && (
            <p
              key={type === "blog" ? summary : description}
              style={{
                display: "flex",
                margin: 0,
                fontFamily: "Geist",
                fontSize: "32px",
                fontWeight: 400,
                color: "#A8A8A8",
                lineHeight: "120%",
                letterSpacing: "0.26px",
                textShadow: "0 0 40px rgba(0, 0, 0, 0.50)",
                textWrap: "balance",
              }}
            >
              {type === "blog" ? summary : description}
            </p>
          )}
        </div>
      </div>,
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts:
          geistData !== null
            ? [
                {
                  name: "Geist",
                  data: geistData,
                  style: "normal",
                  weight: 400,
                },
              ]
            : [],
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
