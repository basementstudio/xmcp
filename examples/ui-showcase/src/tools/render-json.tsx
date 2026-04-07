import React from "react";
import {
  App,
  validateSchema,
  type AppSchema,
} from "@xmcp-dev/ui";
import { InferSchema, type ToolMetadata } from "xmcp";
import { z } from "zod";

const DEFAULT_MCP_SERVER_URL = "http://localhost:6274";
type PreviewMode = "strict" | "progressive" | "raw";
type StrictFallback = "spinner" | "raw";

export const metadata: ToolMetadata = {
  name: "renderJson",
  description:
    "Render a full @xmcp-dev/ui AppSchema for MCP Apps-compatible clients. Before generating the schema, read the skill://xmcp-ui/schema-reference resource for the full component catalog and schema format. The JSON must include at least title, mcpServerUrl, and a root component object.",
};

export const schema = {
  schemaJson: z
    .string()
    .optional()
    .describe(
      `AppSchema JSON string. For the full reference, read the skill://xmcp-ui/schema-reference resource.

Root shape: { title, mcpServerUrl, root: Component }
Component: { type, props, children?, actions? }

VALID TYPES ONLY: grid, card, tabs, table, stat-card, text, image, link, input, textarea, select, button, badge, separator, checkbox, switch, alert, loader, progress.

Key props per type:
- grid: columns?, gap? (children: yes)
- card: title?, description? (children: yes)
- tabs: tabs[{label,value}], stateKey (children: yes)
- table: dataKey, columns[{key,label}]
- stat-card: label, valueKey
- text: content, variant?("h1"|"h2"|"h3"|"body"|"caption")
- input: stateKey, label?, type?
- button: label, variant?("primary"|"secondary"|"danger") (actions: {onClick})
- badge: label, variant?("default"|"secondary"|"destructive"|"outline")
- separator: orientation?
- select: stateKey, options[{value,label}]
- checkbox: stateKey, label?
- switch: stateKey, label?
- alert: messageKey, variant?("info"|"success"|"warning"|"error")
- loader: loadingKey, label?
- progress: valueKey, max?
- image: src OR srcKey, alt?
- link: href, label, external?

Actions: { type:"call-tool", tool, args, resultKey } | { type:"set-state", key, value }
Templates: {{stateKey}} resolves from state, {{event.value}} for onChange.

Important typing rules:
- Numeric props must be JSON numbers, never strings.
- Use "gap": 16, not "gap": "16".
- Use "columns": 3, not "columns": "3".
- Use "padding": 24, "rows": 4, and "max": 100 as numbers when provided.
- Only use strings for text content, className, URLs, labels, and similar text fields.

Valid example:
{
  "title": "Example App",
  "mcpServerUrl": "https://mcp.openai.com",
  "root": {
    "type": "grid",
    "props": { "columns": 1, "gap": 24 },
    "children": [
      {
        "type": "card",
        "props": { "title": "Weather", "padding": 24 },
        "children": [
          { "type": "text", "props": { "content": "Hello", "variant": "body" } }
        ]
      }
    ]
  }
}

DO NOT use types like "page", "stack", "divider", "list", "hero" — they do not exist and will cause errors.`,
    ),
};

function createDefaultJsonApp(): AppSchema {
  return {
    title: "Preview",
    mcpServerUrl: DEFAULT_MCP_SERVER_URL,
    theme: "dark",
    state: {},
    root: {
      type: "grid",
      props: { columns: 1, gap: 0 },
      children: [],
    },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(target: T, source: unknown): T {
  if (Array.isArray(target) && Array.isArray(source)) {
    return source as T;
  }

  if (isPlainObject(target) && isPlainObject(source)) {
    const merged: Record<string, unknown> = { ...target };

    for (const [key, value] of Object.entries(source)) {
      const targetValue = merged[key];
      if (Array.isArray(value)) {
        merged[key] = value;
      } else if (isPlainObject(value) && isPlainObject(targetValue)) {
        merged[key] = deepMerge(targetValue, value);
      } else {
        merged[key] = value;
      }
    }

    return merged as T;
  }

  return source as T;
}

function completeJsonCandidate(input: string) {
  let output = input;
  const stack: string[] = [];
  let inString = false;
  let escaping = false;

  for (const char of input) {
    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }

      if (char === "\\") {
        escaping = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      stack.push("}");
      continue;
    }

    if (char === "[") {
      stack.push("]");
      continue;
    }

    if (char === "}" || char === "]") {
      if (stack[stack.length - 1] === char) {
        stack.pop();
      }
    }
  }

  if (inString) {
    output += '"';
  }

  output = output.replace(/[\s,:]+$/, "");
  output += stack.reverse().join("");
  return output;
}

function tryParseProgressiveJson(input: string): unknown {
  for (let cut = input.length; cut > 0; cut -= 1) {
    const candidate = completeJsonCandidate(input.slice(0, cut));
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

function tryBuildPreviewSchema(parsedInput: unknown): AppSchema | null {
  if (!isPlainObject(parsedInput)) {
    return null;
  }

  const root = parsedInput.root;
  if (!isPlainObject(root) || typeof root.type !== "string") {
    return null;
  }

  const hasUserStructure =
    Array.isArray(root.children) && root.children.length > 0;

  if (!hasUserStructure) {
    return null;
  }

  try {
    return validateSchema(deepMerge(createDefaultJsonApp(), parsedInput));
  } catch {
    return null;
  }
}

function renderErrorState(title: string, body: string, details?: string) {
  return (
    <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-8 shadow-2xl shadow-red-950/20">
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
  );
}

function renderLoading() {
  return (
    <div className="flex min-h-[28rem] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 font-sans text-slate-100">
      <div className="flex flex-col items-center gap-4">
        <svg className="h-8 w-8 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-slate-400">Building your UI...</p>
      </div>
    </div>
  );
}

function renderRawState(schemaJson: string) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-100">Raw stream</p>
          <p className="text-xs text-slate-400">
            Showing the incoming schema text exactly as received.
          </p>
        </div>
        <span className="rounded-full border border-cyan-800/70 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-200">
          {schemaJson.length} chars
        </span>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-200">
        {schemaJson}
      </pre>
    </div>
  );
}

function renderFrame(
  children: React.ReactNode,
) {
  return (
    <div className="bg-slate-950 px-6 py-10 font-sans text-slate-100">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

export default function handler({
  schemaJson,
}: InferSchema<typeof schema>) {
  const [mode, setMode] = React.useState<PreviewMode>("progressive");
  const [strictFallback, setStrictFallback] =
    React.useState<StrictFallback>("spinner");
  const [lastProgressiveSnapshot, setLastProgressiveSnapshot] = React.useState<{
    source: string;
    schema: AppSchema;
  } | null>(null);

  const trimmedSchemaJson = schemaJson?.trim() ?? "";

  let parsedInput: unknown;
  let parseError = false;

  if (trimmedSchemaJson) {
    try {
      parsedInput = JSON.parse(trimmedSchemaJson);
    } catch {
      parseError = true;
    }
  }

  let validatedSchema: AppSchema | null = null;
  let validationMessage: string | null = null;

  if (!parseError && parsedInput !== undefined) {
    try {
      validatedSchema = validateSchema(parsedInput);
    } catch (error) {
      validationMessage = error instanceof Error ? error.message : String(error);
    }
  }

  const repairedPartialInput =
    trimmedSchemaJson && !validatedSchema
      ? tryParseProgressiveJson(trimmedSchemaJson)
      : parsedInput;
  const progressiveSchema = tryBuildPreviewSchema(repairedPartialInput);

  React.useEffect(() => {
    if (
      progressiveSchema &&
      trimmedSchemaJson &&
      trimmedSchemaJson !== lastProgressiveSnapshot?.source
    ) {
      setLastProgressiveSnapshot({
        source: trimmedSchemaJson,
        schema: progressiveSchema,
      });
    }
  }, [progressiveSchema, trimmedSchemaJson, lastProgressiveSnapshot?.source]);

  if (mode === "raw") {
    return renderFrame(
      trimmedSchemaJson ? renderRawState(trimmedSchemaJson) : renderLoading(),
    );
  }

  if (!trimmedSchemaJson) {
    return renderFrame(
      strictFallback === "raw" && trimmedSchemaJson
        ? renderRawState(trimmedSchemaJson)
        : renderLoading(),
    );
  }

  if (validatedSchema) {
    return renderFrame(
      <App
        schema={validatedSchema}
        className="mx-auto max-w-6xl min-h-0 py-10"
      />,
    );
  }

  if (mode === "progressive" && progressiveSchema) {
    return renderFrame(
      <App
        schema={progressiveSchema}
        className="mx-auto max-w-6xl min-h-0 py-10"
      />,
    );
  }

  if (mode === "progressive" && lastProgressiveSnapshot) {
    return renderFrame(
      <App
        schema={lastProgressiveSnapshot.schema}
        className="mx-auto max-w-6xl min-h-0 py-10"
      />,
    );
  }

  if (parseError) {
    return renderFrame(
      strictFallback === "raw"
        ? renderRawState(trimmedSchemaJson)
        : renderLoading(),
    );
  }

  return renderFrame(
    strictFallback === "raw"
      ? renderRawState(trimmedSchemaJson)
      : renderErrorState(
          "Invalid App Schema",
          "The JSON parsed successfully, but it did not match the @xmcp-dev/ui app schema contract. The most common missing fields are mcpServerUrl and root.",
          validationMessage ?? undefined,
        ),
  );
}
