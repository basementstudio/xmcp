import type { McpHostToolResult } from "xmcp/host-bridge";

export function extractToolText(result: McpHostToolResult): string | undefined {
  if (result.structuredContent) {
    return JSON.stringify(result.structuredContent);
  }
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text" && item.text) {
        return item.text;
      }
    }
  }
  return undefined;
}

export function parseToolResult<T = unknown>(result: McpHostToolResult): T | null {
  if (result.structuredContent != null) {
    return result.structuredContent as T;
  }
  const text = extractToolText(result);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
