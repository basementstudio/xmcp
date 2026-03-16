"use client";

import { cn } from "../../utils/cn";

interface LogLineProps {
  children: string;
  className?: string;
}

type Segment = { text: string; color: string };

/**
 * Parses an xmcp observability log line into colored segments.
 *
 * Expected format:
 *   <timestamp> <LEVEL> <event.action> <type/name> req=<id> dur=<ms> outcome=<result> | {json}
 *
 * Colors match the ANSI output from the runtime:
 *   - timestamp: dim gray
 *   - INFO: cyan bold, ERROR: red bold
 *   - event.action: blue
 *   - type/name: magenta
 *   - req value: yellow
 *   - dur value: green (<250), yellow (250-999), red (>=1000)
 *   - outcome value: green (success), red (failure), gray (-)
 *   - pipe + JSON: gray
 */
function parseLogLine(line: string): Segment[] {
  const pipeIdx = line.indexOf(" | ");
  const prefix = pipeIdx !== -1 ? line.slice(0, pipeIdx) : line;
  const json = pipeIdx !== -1 ? line.slice(pipeIdx) : "";

  const parts = prefix.split(" ");
  const segments: Segment[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i > 0) segments.push({ text: " ", color: "" });

    const part = parts[i];

    if (i === 0) {
      // timestamp
      segments.push({ text: part, color: "text-gray-500" });
    } else if (part === "INFO") {
      segments.push({ text: part, color: "text-cyan-400 font-bold" });
    } else if (part === "ERROR") {
      segments.push({ text: part, color: "text-red-400 font-bold" });
    } else if (part.includes(".start") || part.includes(".end")) {
      // event.action
      segments.push({ text: part, color: "text-blue-400" });
    } else if (part.includes("/")) {
      // type/name
      segments.push({ text: part, color: "text-purple-400" });
    } else if (part.startsWith("req=")) {
      const [label, value] = splitKV(part);
      segments.push({ text: label, color: "text-gray-500" });
      segments.push({ text: value, color: "text-yellow-400" });
    } else if (part.startsWith("dur=")) {
      const [label, value] = splitKV(part);
      segments.push({ text: label, color: "text-gray-500" });
      segments.push({ text: value, color: durationColor(value) });
    } else if (part.startsWith("outcome=")) {
      const [label, value] = splitKV(part);
      segments.push({ text: label, color: "text-gray-500" });
      segments.push({ text: value, color: outcomeColor(value) });
    } else {
      segments.push({ text: part, color: "text-white" });
    }
  }

  if (json) {
    segments.push({ text: json, color: "text-gray-600" });
  }

  return segments;
}

function splitKV(part: string): [string, string] {
  const eqIdx = part.indexOf("=");
  return [part.slice(0, eqIdx + 1), part.slice(eqIdx + 1)];
}

function durationColor(value: string): string {
  if (value === "-") return "text-gray-500";
  const num = parseInt(value, 10);
  if (isNaN(num)) return "text-white";
  if (num >= 1000) return "text-red-400";
  if (num >= 250) return "text-yellow-400";
  return "text-green-400";
}

function outcomeColor(value: string): string {
  if (value === "success") return "text-green-400";
  if (value === "failure") return "text-red-400";
  return "text-gray-500";
}

export function LogLine({ children, className }: LogLineProps) {
  const lines = children.trim().split("\n");

  return (
    <div className={cn("relative group", className)}>
      <div className="p-3 px-4 bg-black border border-white/20 overflow-x-auto">
        <pre className="font-mono text-sm whitespace-pre">
          <code>
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {lineIdx > 0 && "\n"}
                {parseLogLine(line).map((seg, segIdx) => (
                  <span key={segIdx} className={seg.color}>
                    {seg.text}
                  </span>
                ))}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
