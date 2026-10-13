import { ContentTable } from "./markdown/table";
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

// Every article uses the same 700px column and 20px mobile gutters.
const DOCS_IMAGE_SIZES = "(min-width: 740px) 700px, calc(100vw - 40px)";
export const BLOG_IMAGE_SIZES = DOCS_IMAGE_SIZES;

export function getMDXComponents(
  components?: MDXComponents,
  imageSizes = DOCS_IMAGE_SIZES
): MDXComponents {
  const MdxImage = defaultMdxComponents.img!;
  return {
    ...defaultMdxComponents,
    table: ContentTable,
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
