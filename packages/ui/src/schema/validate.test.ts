import { describe, expect, it } from "vitest";
import { validateSchema } from "./validate.js";

const validSchema = {
  title: "Operations",
  description: "Live operational view",
  mcpServerUrl: "https://example.com",
  mcpHeaders: [{ name: "authorization", value: "Bearer token" }],
  theme: "light",
  themeTokens: {
    background: "0 0% 100%",
    foreground: "0 0% 4%",
  },
  state: {
    query: "",
    results: [],
    status: "Ready",
    progress: 25,
  },
  root: {
    type: "grid",
    props: { columns: 2, gap: 16 },
    children: [
      {
        type: "card",
        props: { title: "Search", padding: 24 },
        children: [
          {
            type: "input",
            props: { stateKey: "query", label: "Query" },
            actions: {
              onChange: {
                type: "set-state",
                key: "query",
                value: "{{event.value}}",
              },
            },
          },
          {
            type: "button",
            props: { label: "Run", variant: "primary" },
            actions: {
              onClick: {
                type: "call-tool",
                tool: "search",
                args: { q: "{{query}}" },
                resultKey: "results",
              },
            },
          },
          {
            type: "button",
            props: { label: "Reset", variant: "secondary" },
            actions: {
              onClick: {
                type: "set-state-batch",
                entries: [
                  { key: "query", value: "" },
                  { key: "results", value: [] },
                ],
              },
            },
          },
          {
            type: "button",
            props: { label: "Docs" },
            actions: {
              onClick: {
                type: "open-link",
                url: "https://example.com/docs?q={{query}}",
              },
            },
          },
          {
            type: "alert",
            props: { messageKey: "status", variant: "info" },
          },
          {
            type: "progress",
            props: { valueKey: "progress", max: 100 },
          },
        ],
      },
      {
        type: "table",
        props: {
          dataKey: "results",
          columns: [{ key: "name", label: "Name", width: "180px" }],
        },
      },
    ],
  },
};

describe("validateSchema", () => {
  it("accepts a representative renderJson AppSchema", () => {
    const parsed = validateSchema(validSchema);

    expect(parsed.title).toBe("Operations");
    expect(parsed.root.type).toBe("grid");
    expect(parsed.mcpHeaders).toEqual([
      { name: "authorization", value: "Bearer token" },
    ]);
  });

  it("rejects unsupported component types", () => {
    expect(() =>
      validateSchema({
        title: "Bad",
        mcpServerUrl: "https://example.com",
        root: {
          type: "stack",
          props: {},
        },
      }),
    ).toThrow(/Invalid app schema/);
  });

  it("rejects javascript URLs in open-link actions", () => {
    expect(() =>
      validateSchema({
        title: "Bad link",
        mcpServerUrl: "https://example.com",
        root: {
          type: "button",
          props: { label: "Open" },
          actions: {
            onClick: {
              type: "open-link",
              url: "javascript:alert(1)",
            },
          },
        },
      }),
    ).toThrow(/javascript: URLs are not allowed/);
  });
});
