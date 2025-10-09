"use client";

import { cn } from "../../utils/cn";
import { CopyButton } from "../ui/copy-button";
import { useState, useMemo } from "react";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "@shikijs/langs/bash";
import ayuDark from "@shikijs/themes/ayu-dark";

const highlighter = createHighlighterCoreSync({
  langs: [bash],
  themes: [ayuDark],
  engine: createJavaScriptRegexEngine(),
});

interface TerminalTab {
  label: string;
  value: string;
  content: string;
}

interface TerminalTabsProps {
  tabs: TerminalTab[];
  defaultTab?: string;
  className?: string;
}

export function TerminalTabs({
  tabs,
  defaultTab,
  className,
}: TerminalTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);
  const activeContent =
    tabs.find((tab) => tab.value === activeTab)?.content || "";

  const highlightedContent = useMemo(() => {
    return highlighter.codeToHtml(activeContent, {
      theme: "ayu-dark",
      lang: "bash",
    });
  }, [activeContent]);

  return (
    <div className={cn("relative", className)}>
      {/* Tab buttons */}
      <div className="flex gap-1 border border-brand-neutral-400 border-b-0 bg-black/50">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-mono transition-colors relative",
              "hover:bg-white/5",
              activeTab === tab.value
                ? "bg-black text-brand-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-neutral-200"
                : "text-brand-neutral-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Terminal content */}
      <div className="py-3 bg-black border border-brand-neutral-400 relative">
        <div
          className="font-mono text-sm [&>pre]:!bg-transparent [&>pre]:p-0 [&>pre]:m-0 [&_*]:!text-sm"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
      </div>

      <CopyButton
        text={activeContent}
        className="size-4 absolute top-14 right-4"
      />
    </div>
  );
}
