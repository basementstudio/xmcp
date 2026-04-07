import type { ToolMetadata } from "xmcp";
import { z } from "zod";
import {
  Rendered,
  type RenderedPreviewMode,
  type RenderedThemePreset,
} from "../preview/index.js";
import type { ThemeMode } from "../react/theme.js";

export interface RenderJsonToolConfig {
  previewMode?: RenderedPreviewMode;
  themeMode?: ThemeMode;
  themePreset?: RenderedThemePreset;
  defaultMcpServerUrl?: string;
}

const renderJsonSchemaDescription = `AppSchema JSON string. For the full reference, read the skill://xmcp-ui/schema-reference resource.

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
- image: src OR srcKey, alt?, width?, height?
- link: href, label, external?

Actions: { type:"call-tool", tool, args, resultKey } | { type:"set-state", key, value }
Templates: {{stateKey}} resolves from state, {{event.value}} for onChange.

Important typing rules:
- Numeric props must be JSON numbers, never strings.
- Use "gap": 16, not "gap": "16".
- Use "columns": 3, not "columns": "3".
- Use "padding": 24, "rows": 4, and "max": 100 as numbers when provided.
- Use image sizing as CSS strings, for example "width": "200px", "height": "120px", or "width": "100%".
- Use table column widths as CSS strings, for example "width": "180px" or "width": "30%".
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

DO NOT use types like "page", "stack", "divider", "list", "hero" — they do not exist and will cause errors.`;

export const renderJsonMetadata: ToolMetadata = {
  name: "renderJson",
  description:
    "Render a full @xmcp-dev/ui AppSchema for MCP Apps-compatible clients. Before generating the schema, read the skill://xmcp-ui/schema-reference resource for the full component catalog and schema format. The JSON must include at least title, mcpServerUrl, and a root component object.",
};

export const renderJsonSchema = {
  schemaJson: z.string().optional().describe(renderJsonSchemaDescription),
};

export function createRenderJsonTool(config: RenderJsonToolConfig = {}) {
  const handler = ({ schemaJson }: { schemaJson?: string }) => (
    <Rendered
      schemaJson={schemaJson}
      previewMode={config.previewMode}
      themeMode={config.themeMode}
      themePreset={config.themePreset}
      defaultMcpServerUrl={config.defaultMcpServerUrl}
    />
  );

  return {
    metadata: renderJsonMetadata,
    schema: renderJsonSchema,
    handler,
  };
}

export const renderJsonHandler = createRenderJsonTool().handler;
