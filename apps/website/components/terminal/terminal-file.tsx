"use client";

import { cn } from "../../utils/cn";
import { CopyButton } from "../ui/copy-button";
import { useMemo } from "react";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "@shikijs/langs/bash";
import json from "@shikijs/langs/json";
import typescript from "@shikijs/langs/typescript";
import javascript from "@shikijs/langs/javascript";
import ayuDark from "@shikijs/themes/ayu-dark";
import { Icons } from "../icons";

const highlighter = createHighlighterCoreSync({
  langs: [bash, json, typescript, javascript],
  themes: [ayuDark],
  engine: createJavaScriptRegexEngine(),
});

interface TerminalFileProps {
  filename: string;
  children?: string;
  code?: string;
  className?: string;
}

function getLangFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    json: "json",
    js: "javascript",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
    sh: "bash",
    bash: "bash",
  };
  return langMap[ext || ""] || "bash";
}

function dedent(str: string): string {
  // Remove leading and trailing empty lines
  const lines = str.split("\n");

  // Find the first and last non-empty lines
  let firstNonEmpty = 0;
  let lastNonEmpty = lines.length - 1;

  while (firstNonEmpty < lines.length && lines[firstNonEmpty].trim() === "") {
    firstNonEmpty++;
  }

  while (lastNonEmpty >= 0 && lines[lastNonEmpty].trim() === "") {
    lastNonEmpty--;
  }

  const trimmedLines = lines.slice(firstNonEmpty, lastNonEmpty + 1);

  // Find minimum indentation
  const minIndent = trimmedLines.reduce((min, line) => {
    if (line.trim() === "") return min;
    const indent = line.match(/^ */)?.[0].length ?? 0;
    return Math.min(min, indent);
  }, Infinity);

  // Remove the minimum indentation from each line
  if (minIndent === Infinity || minIndent === 0) {
    return trimmedLines.join("\n");
  }

  return trimmedLines.map((line) => line.slice(minIndent)).join("\n");
}

// TODO Fix parsing here, indentation is broken
export function TerminalFile({
  filename,
  children,
  code,
  className,
}: TerminalFileProps) {
  const defaultLang = getLangFromFilename(filename);

  // Parse code fence format if children is provided
  let content = code ?? children ?? "";
  let lang = defaultLang;

  if (!code && children) {
    // Check if children is in code fence format (```lang\ncode\n```)
    const codeFenceMatch = children.match(/^```(\w+)?\s*\n([\s\S]*?)\n```\s*$/);
    if (codeFenceMatch) {
      lang = codeFenceMatch[1] || defaultLang;
      content = codeFenceMatch[2];
    }
  }

  const highlightedContent = useMemo(() => {
    // Dedent the content to remove common leading whitespace
    const dedentedContent = dedent(content);
    return highlighter.codeToHtml(dedentedContent, {
      theme: "ayu-dark",
      lang,
    });
  }, [content, lang]);

  return (
    <div className={cn("relative", className)}>
      {/* Header with filename and icon */}
      <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/20 border-b-0">
        <div className="flex-shrink-0">
          <Icons.paper className="text-gray-300" />
        </div>
        <span className="text-sm font-mono text-gray-300">{filename}</span>
      </div>

      {/* Terminal content */}
      <div className="py-3 bg-black border border-white/20 relative">
        <div
          className="font-mono text-sm [&>pre]:!bg-transparent [&>pre]:p-0 [&>pre]:m-0 [&_*]:!text-sm"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
      </div>

      <CopyButton
        text={dedent(content)}
        className="size-4 absolute top-10 right-4"
      />
    </div>
  );
}
