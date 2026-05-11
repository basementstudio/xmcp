// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Rendered } from "../preview/index.js";
import {
  createRenderJsonTool,
  renderJsonMetadata,
  renderJsonSchema,
} from "./render-json.js";

afterEach(() => {
  cleanup();
});

const validSchema = JSON.stringify({
  title: "Render JSON Demo",
  mcpServerUrl: "https://example.com",
  state: {
    message: "Ready",
  },
  root: {
    type: "card",
    props: { title: "Status" },
    children: [
      {
        type: "text",
        props: { content: "{{message}}", variant: "body" },
      },
    ],
  },
});

describe("createRenderJsonTool", () => {
  it("exposes stable renderJson metadata and schema guidance", () => {
    expect(renderJsonMetadata.name).toBe("renderJson");
    expect(renderJsonSchema.schemaJson.description).toContain(
      "set-state-batch",
    );
    expect(renderJsonSchema.schemaJson.description).toContain("open-link");
    expect(renderJsonSchema.schemaJson.description).toContain(
      "javascript: URLs",
    );
  });

  it("passes config to Rendered", () => {
    const renderJsonTool = createRenderJsonTool({
      previewMode: "raw",
      themeMode: "dark",
      themePreset: "slate",
      defaultMcpServerUrl: "https://mcp.example.com",
      transportMode: "host",
    });

    const element = renderJsonTool.handler({ schemaJson: validSchema });

    expect(React.isValidElement(element)).toBe(true);
    const props = (element as React.ReactElement).props as Record<
      string,
      unknown
    >;
    expect(props.schemaJson).toBe(validSchema);
    expect(props.previewMode).toBe("raw");
    expect(props.themeMode).toBe("dark");
    expect(props.themePreset).toBe("slate");
    expect(props.defaultMcpServerUrl).toBe("https://mcp.example.com");
    expect(props.transportMode).toBe("host");
  });
});

describe("Rendered", () => {
  it("renders valid AppSchema JSON", () => {
    render(<Rendered schemaJson={validSchema} transportMode="host" />);

    expect(screen.getByText("Render JSON Demo")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("shows incoming JSON in raw mode", () => {
    render(<Rendered schemaJson={validSchema} previewMode="raw" />);

    expect(screen.getByText("Raw stream")).toBeTruthy();
    expect(screen.getByText(/Render JSON Demo/)).toBeTruthy();
  });

  it("reports validation errors in strict mode", () => {
    render(
      <Rendered
        schemaJson={JSON.stringify({
          title: "Invalid",
          root: { type: "card", props: {} },
        })}
        previewMode="strict"
      />,
    );

    expect(screen.getByText("Invalid App Schema")).toBeTruthy();
    expect(screen.getAllByText(/mcpServerUrl/).length).toBeGreaterThan(0);
  });

  it("progressively renders a partial schema with a default MCP URL", () => {
    const partialSchema =
      "{\"title\":\"Partial\",\"root\":{\"type\":\"card\",\"props\":{\"title\":\"Card\"},\"children\":[{\"type\":\"text\",\"props\":{\"content\":\"Almost\"}}]";

    render(
      <Rendered
        schemaJson={partialSchema}
        defaultMcpServerUrl="https://default.example.com"
      />,
    );

    expect(screen.getByText("Partial")).toBeTruthy();
    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText("Almost")).toBeTruthy();
  });
});
