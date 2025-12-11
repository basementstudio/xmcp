import { ImageResponse } from "@vercel/og";
import { getBlogPostBySlug } from "@/utils/blog";
import { source } from "@/lib/source";
import { NextRequest } from "next/server";
import { getBaseUrl } from "@/lib/base-url";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month} ${day}.${year}`;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  try {
    const params = await props.params;
    const path = Array.isArray(params.path) ? params.path : [params.path];

    if (path.length === 0) {
      return new Response("Invalid path", { status: 400 });
    }

    const [type, ...rest] = path;
    let title: string;
    let description: string;
    let date: string | undefined;

    switch (type) {
      case "blog": {
        const slug = rest.join("/");
        const blogPost = getBlogPostBySlug(slug);

        if (!blogPost) {
          return new Response("Blog post not found", { status: 404 });
        }

        title = blogPost.title;
        description = blogPost.description || "";
        date = blogPost.date;
        break;
      }

      case "docs": {
        const slug = rest.length === 0 ? undefined : rest;
        const page = source.getPage(slug);

        if (!page) {
          return new Response("Documentation page not found", { status: 404 });
        }

        title = page.data.title;
        description = page.data.description || "";
        break;
      }

      case "examples": {
        title = "Examples & templates";
        description =
          "Explore examples and templates to get started with xmcp. Learn from real-world implementations and best practices.";
        break;
      }

      default:
        return new Response("Invalid content type", { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "630px",
            width: "1200px",
            display: "flex",
            flexDirection: "row",
            backgroundColor: "#000000",
            position: "relative",
            overflow: "hidden",
            padding: "5px",
          }}
        >
          {/* Background image with rotation and blend mode */}
          <img
            src={`${getBaseUrl()}/og/bg.png`}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
              mixBlendMode: "plus-lighter",
            }}
          />
          {/* Noise overlay with opacity and blend mode */}
          <img
            src={`${getBaseUrl()}/og/noise.png`}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
              opacity: 0.4,
              mixBlendMode: "overlay",
            }}
          />
          {/* Left section - Logo (span 2 of 6) */}
          <div
            style={{
              flex: "0 0 33.33%",
              height: "100%",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              position: "relative",
              padding: "80px 40px",
              filter: "drop-shadow(0 0 52px rgba(255, 255, 255, 0.4))",
              background: "radial-gradient(circle, hsla(0, 0%, 85%, 0.12) 0%, hsla(0, 0%, 45%, 0) 100%)",
            }}
          >
            {/* Code snippets confined to the logo column (|-X|, |X-|, |-X|) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "32px 24px",
                pointerEvents: "none",
              }}
            >
              {/* Row 1: empty | code (|-X|) */}
              <div style={{ display: "flex", flexDirection: "row", width: "100%", gap: "8px" }}>
                <div style={{ flex: "1 1 50%" }} />
                <div
                  style={{
                    flex: "1 1 50%",
                    display: "flex",
                    justifyContent: "flex-end",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#757575",
                    lineHeight: "1.6",
                    opacity: 0.6,
                  }}
                >
                  <pre style={{ margin: 0, fontFamily: "monospace" }}>
                    {`export const clients = {
  local: {
    url: "http://127.0.0.1:3002/mcp",
  },
  remote: {
    url: "https://test-0-5-2-canary.vercel.app/mcp",
    headers: [
      {
        value: "12345",
        name: "x-api-key",
      },
    ],
  },
};`}
                  </pre>
                </div>
              </div>
              {/* Row 2: code | empty (|X-|) */}
              <div style={{ display: "flex", flexDirection: "row", width: "100%", gap: "8px" }}>
                <div
                  style={{
                    flex: "1 1 50%",
                    display: "flex",
                    justifyContent: "flex-start",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#757575",
                    lineHeight: "1.6",
                    opacity: 0.6,
                  }}
                >
                  <pre style={{ margin: 0, fontFamily: "monospace" }}>
                    {`export const clients = {
  local: {
    url: "http://127.0.0.1:3002/mcp",
  },
  remote: {
    url: "https://test-0-5-2-canary.vercel.app/mcp",
    headers: [
      {
        value: "12345",
        name: "x-api-key",
      },
    ],
  },
};`}
                  </pre>
                </div>
                <div style={{ flex: "1 1 50%" }} />
              </div>
              {/* Row 3: empty | code (|-X|) */}
              <div style={{ display: "flex", flexDirection: "row", width: "100%", gap: "8px" }}>
                <div style={{ flex: "1 1 50%" }} />
                <div
                  style={{
                    flex: "1 1 50%",
                    display: "flex",
                    justifyContent: "flex-end",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#757575",
                    lineHeight: "1.6",
                    opacity: 0.6,
                  }}
                >
                  <pre style={{ margin: 0, fontFamily: "monospace" }}>
                    {`export const clients = {
  local: {
    url: "http://127.0.0.1:3002/mcp",
  },
  remote: {
    url: "https://test-0-5-2-canary.vercel.app/mcp",
    headers: [
      {
        value: "12345",
        name: "x-api-key",
      },
    ],
  },
};`}
                  </pre>
                </div>
              </div>
            </div>
            <svg
              width="126"
              height="48"
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
          </div>
          {/* Right section - Dynamic content (span 4 of 6) */}
          <div
            style={{
              flex: "1 1 0%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              position: "relative",
              padding: "80px 40px 80px 0",
            }}
          >
            {/* Date badge */}
            {date && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    border: "1px dashed #757575",
                    backgroundColor: "#262626",
                    borderRadius: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#dbdbdb",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {formatDate(date)}
                  </span>
                </div>
              </div>
            )}
            <h1
              style={{
                fontSize: "64px",
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: "110%",
                margin: 0,
                letterSpacing: "-2%",
                marginBottom: "24px",
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: "28px",
                  color: "#dbdbdb",
                  lineHeight: "120%",
                  letterSpacing: "1%",
                  margin: 0,
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
}

