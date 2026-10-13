"use client";

import { cn } from "../../utils/cn";
import { CodeBlock } from "../codeblock";
import { useState, useMemo, useId } from "react";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "@shikijs/langs/bash";
import {
  XMCP_SHIKI_THEME_NAME,
  xmcpAyuDarkTheme,
  xmcpLightTheme,
} from "@/lib/shiki-theme";

const highlighter = createHighlighterCoreSync({
  langs: [bash],
  themes: [xmcpAyuDarkTheme, xmcpLightTheme],
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
  const id = useId();
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);
  const activeContent =
    tabs.find((tab) => tab.value === activeTab)?.content || "";

  const highlightedContent = useMemo(() => {
    return highlighter.codeToHtml(activeContent, {
      themes: { light: xmcpLightTheme.name!, dark: XMCP_SHIKI_THEME_NAME },
      defaultColor: false,
      lang: "bash",
    });
  }, [activeContent]);

  return (
    <div className={cn("site-terminal", className)}>
      <div
        className="site-terminal-tabs"
        role="tablist"
        aria-label="Package manager"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${id}-${tab.value}`}
            aria-controls={`${id}-panel`}
            aria-selected={activeTab === tab.value}
            tabIndex={activeTab === tab.value ? 0 : -1}
            onClick={() => setActiveTab(tab.value)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : undefined;
              if (next === undefined) return;
              event.preventDefault();
              setActiveTab(tabs[next].value);
              (
                event.currentTarget.parentElement?.children[
                  next
                ] as HTMLButtonElement
              )?.focus();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CodeBlock
        viewportProps={{
          id: `${id}-panel`,
          role: "tabpanel",
          "aria-labelledby": `${id}-${activeTab}`,
          tabIndex: 0,
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
      </CodeBlock>
    </div>
  );
}
