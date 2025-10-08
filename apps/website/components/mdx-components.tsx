import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { TerminalPrompt } from "./terminal/terminal-prompt";
import { TerminalTabs } from "./terminal/terminal-tabs";
import { TerminalFile } from "./terminal/terminal-file";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TerminalPrompt,
    TerminalTabs,
    TerminalFile,
    ...components,
  };
}
