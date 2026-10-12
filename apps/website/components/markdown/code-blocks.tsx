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
  return (
    <CodeBlock className={cn("not-fumadocs-codeblock", className)}>
      <preContext.Provider value={{ editor: true }}>
        {children}
      </preContext.Provider>
    </CodeBlock>
  );
}
