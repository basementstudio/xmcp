import { afterEach, describe, expect, it, vi } from "vitest";
import type { Dispatch } from "react";
import {
  executeAction,
  normalizeToolResult,
  resolveArgs,
  resolveTemplate,
} from "./executor.js";
import type { UiAction } from "../renderer/StateProvider.js";
import type { Action } from "../schema/types.js";

function createDispatchLog() {
  const actions: UiAction[] = [];
  const dispatch: Dispatch<UiAction> = (action) => {
    actions.push(action);
  };

  return { actions, dispatch };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("resolveTemplate", () => {
  it("resolves state paths and event values", () => {
    expect(
      resolveTemplate(
        "Search {{user.name}} for {{event.value}}",
        { user: { name: "Ada" } },
        "weather",
      ),
    ).toBe("Search Ada for weather");
  });

  it("resolves action arguments from state", () => {
    expect(resolveArgs({ q: "{{query}}" }, { query: "alpha" })).toEqual({
      q: "alpha",
    });
  });
});

describe("normalizeToolResult", () => {
  it("prefers structuredContent", () => {
    expect(
      normalizeToolResult({
        structuredContent: { rows: [{ name: "A" }] },
        content: [{ type: "text", text: "ignored" }],
      }),
    ).toEqual({ rows: [{ name: "A" }] });
  });

  it("parses JSON text content when present", () => {
    expect(
      normalizeToolResult({
        content: [{ type: "text", text: "{\"ok\":true}" }],
      }),
    ).toEqual({ ok: true });
  });
});

describe("executeAction", () => {
  it("applies set-state-batch entries with template values", async () => {
    const { actions, dispatch } = createDispatchLog();

    await executeAction(
      {
        type: "set-state-batch",
        entries: [
          { key: "query", value: "{{event.value}}" },
          { key: "status", value: "ready" },
        ],
      },
      {},
      { callTool: vi.fn() },
      dispatch,
      "updated",
    );

    expect(actions).toEqual([
      { type: "SET_STATE", key: "query", value: "updated" },
      { type: "SET_STATE", key: "status", value: "ready" },
    ]);
  });

  it("calls MCP tools with resolved args and stores normalized results", async () => {
    vi.useFakeTimers();
    const { actions, dispatch } = createDispatchLog();
    const callTool = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "[{\"name\":\"Ada\"}]" }],
    });

    await executeAction(
      {
        type: "call-tool",
        tool: "search",
        args: { q: "{{query}}" },
        resultKey: "results",
      },
      { query: "alpha" },
      { callTool },
      dispatch,
    );

    expect(callTool).toHaveBeenCalledWith({
      name: "search",
      arguments: { q: "alpha" },
    });
    expect(actions).toContainEqual({
      type: "SET_STATE",
      key: "results",
      value: [{ name: "Ada" }],
    });
    expect(actions).toContainEqual({
      type: "SET_ERROR",
      actionId: "results",
      error: null,
    });
    expect(actions.at(-1)).toEqual({
      type: "SET_LOADING",
      actionId: "results",
      loading: false,
    });
  });

  it("routes open-link actions through the runtime client", async () => {
    const { dispatch } = createDispatchLog();
    const openLink = vi.fn().mockResolvedValue(undefined);
    const action: Action = {
      type: "open-link",
      url: "https://example.com/{{slug}}",
    };

    await executeAction(
      action,
      { slug: "docs" },
      { callTool: vi.fn(), openLink },
      dispatch,
    );

    expect(openLink).toHaveBeenCalledWith("https://example.com/docs");
  });
});
