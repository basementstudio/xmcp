"use client";

import { cn } from "../../utils/cn";
import { CopyButton } from "../ui/copy-button";

interface TerminalPromptProps {
  children: string;
  className?: string;
}

/**
 * Parses terminal prompt text and returns styled segments
 * First ? on each line = green
 * ❯ = light blue
 * ◉ = green (list dots)
 * text after ❯ (until newline) = light blue
 * <text> = light blue (angle brackets content, takes priority over parentheses)
 * (content) = gray
 * text = white
 */
function parsePrompt(text: string) {
  const segments: Array<{ text: string; color: string }> = [];
  let i = 0;
  let questionMarkSeenOnLine = false;

  while (i < text.length) {
    // Reset question mark flag on newline
    if (text[i] === "\n") {
      segments.push({ text: "\n", color: "text-white" });
      questionMarkSeenOnLine = false;
      i++;
      continue;
    }

    // Check for question mark (only first one per line is green)
    if (text[i] === "?") {
      if (!questionMarkSeenOnLine) {
        segments.push({ text: "?", color: "text-green-400" });
        questionMarkSeenOnLine = true;
      } else {
        segments.push({ text: "?", color: "text-white" });
      }
      i++;
      continue;
    }

    // Check for list dot
    if (text[i] === "◉") {
      segments.push({ text: "◉", color: "text-green-400" });
      i++;
      continue;
    }

    // Check for arrow (selected item indicator)
    if (text[i] === "❯") {
      segments.push({ text: "❯", color: "text-cyan-400" });
      i++;

      // Color the text after the arrow (until newline) in light blue
      let endIdx = i;
      while (endIdx < text.length && text[endIdx] !== "\n") {
        endIdx++;
      }
      if (endIdx > i) {
        segments.push({
          text: text.slice(i, endIdx),
          color: "text-cyan-400",
        });
        i = endIdx;
      }
      continue;
    }

    // Check for angle brackets content (light blue) - priority over parentheses
    if (text[i] === "<") {
      const endIdx = text.indexOf(">", i);
      if (endIdx !== -1) {
        segments.push({
          text: text.slice(i, endIdx + 1),
          color: "text-cyan-400",
        });
        i = endIdx + 1;
        continue;
      }
    }

    // Check for parenthetical content (gray, but parse angle brackets inside)
    if (text[i] === "(") {
      const endIdx = text.indexOf(")", i);
      if (endIdx !== -1) {
        // Parse the content inside parentheses to handle <> tags
        const parenContent = text.slice(i, endIdx + 1);
        parseParentheses(parenContent, segments);
        i = endIdx + 1;
        continue;
      }
    }

    // Regular text (white)
    let endIdx = i + 1;
    while (
      endIdx < text.length &&
      text[endIdx] !== "?" &&
      text[endIdx] !== "(" &&
      text[endIdx] !== "<" &&
      text[endIdx] !== "❯" &&
      text[endIdx] !== "◉"
    ) {
      endIdx++;
    }
    segments.push({
      text: text.slice(i, endIdx),
      color: "text-white",
    });
    i = endIdx;
  }

  return segments;
}

/**
 * Helper function to parse parentheses content with angle bracket support
 */
function parseParentheses(
  text: string,
  segments: Array<{ text: string; color: string }>
) {
  let i = 0;

  while (i < text.length) {
    // Check for angle brackets (light blue)
    if (text[i] === "<") {
      const endIdx = text.indexOf(">", i);
      if (endIdx !== -1) {
        segments.push({
          text: text.slice(i, endIdx + 1),
          color: "text-cyan-400",
        });
        i = endIdx + 1;
        continue;
      }
    }

    // Regular text in parentheses (gray)
    let endIdx = i + 1;
    while (endIdx < text.length && text[endIdx] !== "<") {
      endIdx++;
    }
    segments.push({
      text: text.slice(i, endIdx),
      color: "text-gray-500",
    });
    i = endIdx;
  }
}

export function TerminalPrompt({ children, className }: TerminalPromptProps) {
  const segments = parsePrompt(children);

  return (
    <div className={cn("relative group", className)}>
      <div className="p-3 px-4 bg-black border border-white/20">
        <pre className="font-mono text-sm">
          <code>
            {segments.map((segment, idx) => (
              <span key={idx} className={segment.color}>
                {segment.text}
              </span>
            ))}
          </code>
        </pre>
      </div>
      <CopyButton
        text={children}
        className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />
    </div>
  );
}
