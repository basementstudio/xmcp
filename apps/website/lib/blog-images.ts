import type { ImageProps, StaticImageData } from "next/image";
import appsSdk from "@public/blog/apps-sdk.png";
import cliTypedClients from "@public/blog/cli-typed-clients.png";
import everythingBento from "@public/blog/everything-bento.png";
import mcpApp from "@public/blog/mcp-app.png";
import reactClientComponents from "@public/blog/react-client-components.png";
import release from "@public/blog/release-0.3.0.png";
import secureServer from "@public/blog/secure-your-mcp-server.png";
import betterAuth from "@public/blog/xmcp-better-auth.png";
import polar from "@public/blog/xmcp-polar.png";
import v1 from "@public/blog/xmcp-v1.png";
import vercel from "@public/blog/xmcp-vercel.png";
import texture1 from "@public/textures/text1.png";
import texture2 from "@public/textures/text2.png";
import texture3 from "@public/textures/text3.png";
import texture4 from "@public/textures/text4.png";
import texture6 from "@public/textures/text6.png";

// Keep frontmatter URLs stable for feeds and social cards while retaining
// Next.js dimensions, blur previews and content-hashed caching in the UI.
const BLOG_IMAGES: Record<string, StaticImageData> = {
  "/blog/apps-sdk.png": appsSdk,
  "/blog/cli-typed-clients.png": cliTypedClients,
  "/blog/everything-bento.png": everythingBento,
  "/blog/mcp-app.png": mcpApp,
  "/blog/react-client-components.png": reactClientComponents,
  "/blog/release-0.3.0.png": release,
  "/blog/secure-your-mcp-server.png": secureServer,
  "/blog/xmcp-better-auth.png": betterAuth,
  "/blog/xmcp-polar.png": polar,
  "/blog/xmcp-v1.png": v1,
  "/blog/xmcp-vercel.png": vercel,
  "/textures/text1.png": texture1,
  "/textures/text2.png": texture2,
  "/textures/text3.png": texture3,
  "/textures/text4.png": texture4,
  "/textures/text6.png": texture6,
};

export function getBlogImageProps(
  source: string
): Pick<ImageProps, "src" | "placeholder"> {
  const image = BLOG_IMAGES[source];
  return image
    ? { src: image, placeholder: "blur" }
    : { src: source, placeholder: "empty" };
}
