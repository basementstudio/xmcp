import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { TerminalPrompt } from "./terminal/terminal-prompt";
import { TerminalTabs } from "./terminal/terminal-tabs";
import { ConceptBoxes, ConceptBox } from "./concept-boxes";
import { Callout } from "./ui/callout";
import { Video } from "./video";
import { McpConnect } from "./mcp-connect";
import { OAuthPlugins } from "./oauth-plugins";
import { MonetizationPlugins } from "./monetization-plugins";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TerminalPrompt,
    TerminalTabs,
    ConceptBoxes,
    ConceptBox,
    Callout,
    Video,
    McpConnect,
    OAuthPlugins,
    MonetizationPlugins,
    ...components,
  };
}
