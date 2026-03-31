import type { Action, CallToolAction, SetStateAction, OpenLinkAction, SetStateBatchAction } from "../schema/types.js";
import type { Dispatch } from "react";
import type { UiAction } from "../renderer/StateProvider.js";
import { getByPath } from "../state/path.js";

/**
 * Replace `{{key}}` patterns in a template string with values from state.
 * Supports `{{event.value}}` via an optional eventValue parameter.
 */
export function resolveTemplate(
  template: string,
  state: Record<string, unknown>,
  eventValue?: unknown,
): string {
  return template.replace(/\{\{(.+?)\}\}/g, (_match, key: string) => {
    const trimmed = key.trim();
    if (trimmed === "event.value") {
      return String(eventValue ?? "");
    }
    const value = getByPath(state, trimmed);
    return value !== undefined ? String(value) : "";
  });
}

/**
 * Resolve all template expressions in an args object.
 */
export function resolveArgs(
  args: Record<string, string>,
  state: Record<string, unknown>,
  eventValue?: unknown,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(args)) {
    resolved[key] = resolveTemplate(value, state, eventValue);
  }
  return resolved;
}

function extractTextContent(content: unknown): string | undefined {
  if (!Array.isArray(content)) return undefined;
  for (const item of content) {
    if (
      item &&
      typeof item === "object" &&
      (item as Record<string, unknown>).type === "text" &&
      typeof (item as Record<string, unknown>).text === "string"
    ) {
      return (item as Record<string, string>).text;
    }
  }
  return undefined;
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (
    !(trimmed.startsWith("{") && trimmed.endsWith("}")) &&
    !(trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export function normalizeToolResult(result: unknown): unknown {
  if (result && typeof result === "object") {
    const resultObj = result as Record<string, unknown>;

    if ("structuredContent" in resultObj && resultObj.structuredContent != null) {
      return resultObj.structuredContent;
    }

    if ("content" in resultObj) {
      const text = extractTextContent(resultObj.content);
      if (text !== undefined) {
        return tryParseJson(text);
      }
      return resultObj.content;
    }
  }

  return tryParseJson(result);
}

/**
 * Execute an action: either a tool call via the MCP client or a local state update.
 */
export async function executeAction(
  action: Action,
  state: Record<string, unknown>,
  client: { callTool: (params: { name: string; arguments: Record<string, string> }) => Promise<{ content: unknown }> },
  dispatch: Dispatch<UiAction>,
  eventValue?: unknown,
): Promise<void> {
  switch (action.type) {
    case "call-tool": {
      const callAction = action as CallToolAction;
      const actionId = callAction.resultKey;

      dispatch({ type: "SET_LOADING", actionId, loading: true });

      try {
        const resolvedArgs = resolveArgs(callAction.args, state, eventValue);
        const result = await client.callTool({
          name: callAction.tool,
          arguments: resolvedArgs,
        });

        dispatch({
          type: "SET_STATE",
          key: callAction.resultKey,
          value: normalizeToolResult(result),
        });
        if (getByPath(state, "errorMessage") !== undefined) {
          dispatch({ type: "SET_STATE", key: "errorMessage", value: null });
        }
        dispatch({ type: "SET_LOADING", actionId, loading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        dispatch({ type: "SET_ERROR", actionId, error: message });
        if (getByPath(state, "errorMessage") !== undefined) {
          dispatch({ type: "SET_STATE", key: "errorMessage", value: message });
        }
        dispatch({ type: "SET_LOADING", actionId, loading: false });
      }

      break;
    }

    case "set-state": {
      const setAction = action as SetStateAction;
      const resolvedValue =
        typeof setAction.value === "string"
          ? resolveTemplate(setAction.value, state, eventValue)
          : setAction.value;

      dispatch({ type: "SET_STATE", key: setAction.key, value: resolvedValue });
      break;
    }

    case "open-link": {
      const linkAction = action as OpenLinkAction;
      const resolvedUrl = resolveTemplate(linkAction.url, state, eventValue);
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
      break;
    }

    case "set-state-batch": {
      const batchAction = action as SetStateBatchAction;
      for (const entry of batchAction.entries) {
        const resolvedValue =
          typeof entry.value === "string"
            ? resolveTemplate(entry.value, state, eventValue)
            : entry.value;
        dispatch({ type: "SET_STATE", key: entry.key, value: resolvedValue });
      }
      break;
    }
  }
}
