import React from "react";
import {
  App,
  validateSchema,
  type AppSchema,
} from "@xmcp-dev/ui";
import { InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";

const DEFAULT_MCP_SERVER_URL = "http://localhost:6274";

export const metadata: ToolMetadata = {
  name: "renderJson",
  description:
    "Render a full @xmcp-dev/ui AppSchema for MCP Apps-compatible clients. The JSON must include at least title, mcpServerUrl, and a root component object.",
};

export const schema = {
  schemaJson: z
    .string()
    .optional()
    .describe(
      "Optional raw AppSchema JSON string to render directly. Required fields: title, mcpServerUrl, and root. Root must be a component object like { type: 'card', props: {}, children: [] }.",
    ),
};

function createDefaultJsonApp(): AppSchema {
  return {
    title: "JSON Renderer",
    description: "This app is rendered from a plain JSON object rather than the direct React component surface.",
    mcpServerUrl: DEFAULT_MCP_SERVER_URL,
    theme: "dark",
    themeTokens: {
      background: "215 36% 10%",
      card: "217 43% 12%",
      border: "199 52% 24%",
      input: "199 52% 24%",
      primary: "190 95% 54%",
      primaryForeground: "222 47% 11%",
      accent: "160 84% 39%",
      accentForeground: "210 40% 98%",
      ring: "190 95% 54%",
      radius: "1.15rem",
    },
    state: {
      mode: "Generative JSON",
      source: "Inline schema object",
      interactions: "None",
      status: "Static demo",
      notes: "JSON apps can now set app-level theme tokens and still use per-component overrides only where needed.",
      emailOptIn: true,
      compactMode: false,
      rows: [
        {
          component: "card",
          category: "layout",
          state: "stable",
          note: "Top-level content sections are declared directly in JSON.",
        },
        {
          component: "stat-card",
          category: "data",
          state: "stable",
          note: "Summary metrics can be driven by plain state keys.",
        },
        {
          component: "table",
          category: "data",
          state: "stable",
          note: "Structured rows render without any action wiring.",
        },
        {
          component: "text",
          category: "content",
          state: "stable",
          note: "Template strings read values directly from state.",
        },
      ],
    },
    root: {
      type: "grid",
      props: { columns: 1, gap: 24 },
      children: [
        {
          type: "card",
          props: {
            title: "Generated JSON App",
            description: "A direct schema object rendered by App.",
            className: "shadow-[0_20px_50px_rgba(8,47,73,0.28)]",
          },
          children: [
            {
              type: "text",
              props: {
                variant: "body",
                className: "text-slate-200",
                content:
                  "Pass a complete AppSchema JSON object to replace this built-in app. Required fields are title, mcpServerUrl, and root. The app-level brand colors here come from themeTokens.",
              },
            },
            {
              type: "badge",
              props: {
                label: "JSON First-Class",
                className: "bg-cyan-400 text-slate-950",
              },
            },
            {
              type: "separator",
              props: {
                className: "my-4 bg-[hsl(var(--border))]",
              },
            },
            {
              type: "text",
              props: {
                variant: "caption",
                className: "text-sky-300",
                content:
                  "This built-in demo is intentionally action-free so the schema shape is easier to inspect.",
              },
            },
            {
              type: "textarea",
              props: {
                label: "Schema Notes",
                stateKey: "notes",
                rows: 4,
                className: "border-cyan-800/70 bg-cyan-950/20 text-cyan-50",
              },
            },
            {
              type: "checkbox",
              props: {
                label: "Email me renderer updates",
                stateKey: "emailOptIn",
                className: "mt-1",
              },
            },
            {
              type: "switch",
              props: {
                label: "Compact mode",
                stateKey: "compactMode",
                className: "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3",
              },
            },
          ],
        },
        {
          type: "grid",
          props: { columns: 4, gap: 16 },
          children: [
            {
              type: "stat-card",
              props: {
                label: "Authoring Mode",
                valueKey: "mode",
                className: "shadow-[0_18px_40px_rgba(2,132,199,0.12)]",
              },
            },
            {
              type: "stat-card",
              props: {
                label: "Schema Input",
                valueKey: "source",
                className: "shadow-[0_18px_40px_rgba(2,132,199,0.12)]",
              },
            },
            {
              type: "stat-card",
              props: {
                label: "Interactions",
                valueKey: "interactions",
                className: "shadow-[0_18px_40px_rgba(2,132,199,0.12)]",
              },
            },
            {
              type: "stat-card",
              props: {
                label: "State",
                valueKey: "status",
                className: "shadow-[0_18px_40px_rgba(2,132,199,0.12)]",
              },
            },
          ],
        },
        {
          type: "table",
          props: {
            dataKey: "rows",
            className: "shadow-[0_20px_50px_rgba(8,47,73,0.2)]",
            columns: [
              { key: "component", label: "Component" },
              { key: "category", label: "Category" },
              { key: "state", label: "State" },
              { key: "note", label: "Note" },
            ],
          },
        },
      ],
    },
  };
}

function renderErrorState(title: string, body: string, details?: string) {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 font-sans text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-900/60 bg-red-950/30 p-8 shadow-2xl shadow-red-950/20">
        <p className="mb-2 text-sm uppercase tracking-[0.18em] text-red-300">
          JSON Renderer Error
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-6 text-sm leading-6 text-slate-300">{body}</p>
        {details ? (
          <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-200">
            {details}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export default function handler({
  schemaJson,
}: InferSchema<typeof schema>) {
  try {
    const parsedInput = schemaJson?.trim()
      ? JSON.parse(schemaJson)
      : createDefaultJsonApp();

    const validated = validateSchema(parsedInput);

    return (
      <App
        schema={validated}
        className="mx-auto max-w-6xl py-10"
      />
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return renderErrorState(
        "Invalid JSON",
        "The provided schemaJson input could not be parsed. Pass a valid AppSchema JSON object with title, mcpServerUrl, and root.",
        error.message,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return renderErrorState(
      "Invalid App Schema",
      "The JSON parsed successfully, but it did not match the @xmcp-dev/ui app schema contract. The most common missing fields are mcpServerUrl and root.",
      message,
    );
  }
}
