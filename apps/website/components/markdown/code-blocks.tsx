"use client";

import * as React from "react";

import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import js from "@shikijs/langs/javascript";
import ts from "@shikijs/langs/typescript";
import bash from "@shikijs/langs/bash";
import json from "@shikijs/langs/json";
import tsx from "@shikijs/langs/tsx";
import sql from "@shikijs/langs/sql";
import { CodeBlock } from "../codeblock";
import { ComponentProps, createContext, useContext } from "react";
import { cn } from "../../utils/cn";
import {
  XMCP_SHIKI_THEME_NAME,
  xmcpAyuDarkTheme,
  xmcpLightTheme,
} from "@/lib/shiki-theme";

const highlighter = createHighlighterCoreSync({
  langs: [js, ts, bash, json, tsx, sql],
  themes: [xmcpAyuDarkTheme, xmcpLightTheme],
  engine: createJavaScriptRegexEngine(),
});

const preContext = createContext<{ editor: boolean }>({ editor: false });

export function Code({
  children,
  className,
  ...props
}: Omit<ComponentProps<"code">, "children"> & {
  children: string;
}) {
  const { editor } = useContext(preContext);

  if (!editor) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const lang = className?.split("-")[1];

  const codeHTML = highlighter.codeToHtml(children, {
    themes: { light: xmcpLightTheme.name!, dark: XMCP_SHIKI_THEME_NAME },
    defaultColor: false,
    lang: lang || "typescript",
  });
  return (
    <section
      className={className}
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      {...props}
    />
  );
}

export function Pre({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const nodes = React.Children.toArray(children);
  const code = nodes.length === 1 ? nodes[0] : undefined;
  const source = React.isValidElement<{ children?: React.ReactNode }>(code)
    ? code.props.children
    : undefined;
  // Reserve the final command height in the server HTML, before hydration.
  // CodeBlock still observes rendered source for tab and content changes.
  const singleLine =
    typeof source === "string" &&
    source.trimEnd().length > 0 &&
    !source.trimEnd().includes("\n");

  return (
    <CodeBlock
      className={cn("not-fumadocs-codeblock", className)}
      data-single-line={singleLine ? "" : undefined}
      language={
        React.isValidElement<{ className?: string }>(code)
          ? code.props.className?.match(/language-([\w-]+)/)?.[1]
          : undefined
      }
    >
      <preContext.Provider value={{ editor: true }}>
        {children}
      </preContext.Provider>
    </CodeBlock>
  );
}
