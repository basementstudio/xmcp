"use client";

import * as React from "react";

import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import js from "@shikijs/langs/javascript";
import ts from "@shikijs/langs/typescript";
import bash from "@shikijs/langs/bash";
import json from "@shikijs/langs/json";
import tsx from "@shikijs/langs/tsx";
import ayuDark from "@shikijs/themes/ayu-dark";
import { CopyButton } from "@/components/ui/copy-button";
import {
  ComponentProps,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/utils/cn";

const highlighter = createHighlighterCoreSync({
  langs: [js, ts, bash, json, tsx],
  themes: [ayuDark],
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

  let theme = "none";

  if (lang && lang !== "bash") {
    //theme = "github-dark-high-contrast";
    theme = "ayu-dark";
  }

  const codeHTML = highlighter.codeToHtml(children, {
    theme,
    lang: lang || "typescript",
  });
  return (
    <code
      className={`${className} [&>pre]:p-0 [&>pre]:!bg-transparent [&_*]:!text-sm`}
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
  const [codeText, setCodeText] = useState("");
  const [hasLanguage, setHasLanguage] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      const codeElement = preRef.current.querySelector("code");
      if (codeElement) {
        setCodeText(codeElement.textContent || "");

        const className = codeElement.className || "";
        const hasLangClass =
          className.includes("language-") &&
          !className.includes("language-text");
        setHasLanguage(hasLangClass);
      }
    }
  }, [children]);

  return (
    <pre
      ref={preRef}
      className={cn(
        "my-8 border relative w-auto overflow-auto bg-black p-4 [&_span]:!not-italic [&_span]:!font-normal max-h-[600px] font-mono border-[#333]",
        className
      )}
    >
      <preContext.Provider value={{ editor: true }}>
        {children}
      </preContext.Provider>
      {hasLanguage && (
        <CopyButton text={codeText} className="absolute top-3.5 right-6" />
      )}
    </pre>
  );
}
