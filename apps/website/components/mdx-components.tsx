import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { TerminalPrompt } from "./terminal/terminal-prompt";
import { TerminalTabs } from "./terminal/terminal-tabs";
import { TerminalFile } from "./terminal/terminal-file";
import { ConceptBoxes, ConceptBox } from "./concept-boxes";
import { Callout } from "./ui/callout";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TerminalPrompt,
    TerminalTabs,
    TerminalFile,
    ConceptBoxes,
    ConceptBox,
    Callout,
    ...components,
  };
}
