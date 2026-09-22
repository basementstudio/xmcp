import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { TerminalPrompt } from "./terminal/terminal-prompt";
import { TerminalTabs } from "./terminal/terminal-tabs";
import { ConceptBoxes, ConceptBox } from "./concept-boxes";
import { Callout } from "./ui/callout";
import { Quote } from "./ui/quote";
import { Video } from "./video";
import { McpConnect } from "./mcp-connect";
import { OAuthPlugins } from "./oauth-plugins";
import { MonetizationPlugins } from "./monetization-plugins";

// Account for the docs sidebar, optional table of contents, and article padding.
const DOCS_IMAGE_SIZES =
  "(min-width: 1440px) 796px, (min-width: 1280px) calc(100vw - 650px), (min-width: 1160px) 796px, (min-width: 768px) calc(100vw - 364px), calc(100vw - 32px)";
export const BLOG_IMAGE_SIZES =
  "(min-width: 1440px) 790px, (min-width: 1280px) calc(100vw - 650px), (min-width: 1024px) 796px, (min-width: 768px) calc(100vw - 112px), calc(100vw - 64px)";

export function getMDXComponents(
  components?: MDXComponents,
  imageSizes = DOCS_IMAGE_SIZES
): MDXComponents {
  const MdxImage = defaultMdxComponents.img!;
  return {
    ...defaultMdxComponents,
    img: (props) => <MdxImage sizes={imageSizes} {...props} />,
    TerminalPrompt,
    TerminalTabs,
    ConceptBoxes,
    ConceptBox,
    Callout,
    Quote,
    Video,
    McpConnect,
    OAuthPlugins,
    MonetizationPlugins,
    ...components,
  };
}
