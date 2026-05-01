import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

const SCHEMA_REFERENCE = `# xmcp UI — AppSchema Reference

## Overview

AppSchema is a JSON format for defining interactive UIs that connect to MCP servers. The schema defines a declarative component tree with reactive state management, actions that call MCP tools, and template interpolation for dynamic content. An LLM can generate valid AppSchema JSON to build dashboards, forms, search interfaces, and data viewers — all rendered automatically by the xmcp UI runtime.

## App Root

\`\`\`
{
  title: string              (required) — display name of the app
  mcpServerUrl: string       (required) — valid URL of the MCP server
  description?: string       — short description of the app
  state?: Record<string, unknown>  — initial reactive state
  theme?: "dark" | "light"   — color theme
  root: Component            (required) — top-level component tree
}
\`\`\`

## Component Shape

Every node in the component tree follows this shape:

\`\`\`
{
  type: ComponentType        (required) — one of the types below
  id?: string                — optional unique identifier
  props: { ... }             — type-specific properties
  children?: Component[]     — nested child components (layout types only)
  actions?: { eventName: Action }  — event handlers
}
\`\`\`

## Component Catalog

| type | required props | optional props | children | actions |
|------|---------------|----------------|----------|---------|
| grid | - | columns=2, gap=16 | yes | - |
| card | - | title, description, padding=24 | yes | - |
| tabs | tabs[{label,value}], stateKey | defaultValue | yes | - |
| table | dataKey, columns[{key,label,width?}] | - | no | - |
| stat-card | label, valueKey | prefix, suffix, trend("up"/"down") | no | - |
| text | content | variant("h1"/"h2"/"h3"/"body"/"caption") | no | - |
| image | - (needs src OR srcKey) | alt, width, height | no | - |
| link | href, label | external | no | - |
| input | stateKey | label, placeholder, type("text"/"number"/"email"/"password") | no | onChange |
| textarea | stateKey | label, placeholder, rows | no | onChange |
| select | stateKey, options[{value,label}] | label, placeholder | no | onChange |
| button | label | variant("primary"/"secondary"/"danger"), disabled, loading | no | onClick |
| badge | label | variant("default"/"secondary"/"destructive"/"outline") | no | - |
| separator | - | orientation("horizontal"/"vertical") | no | - |
| checkbox | stateKey | label | no | onChange |
| switch | stateKey | label | no | onChange |
| alert | messageKey | variant("info"/"success"/"warning"/"error"), dismissible | no | - |
| loader | loadingKey | label | no | - |
| progress | valueKey | max=100, label | no | - |

## Actions

Four action types can be attached to component events:

**call-tool** — Invoke an MCP tool and store the result in state:
\`\`\`json
{ "type": "call-tool", "tool": "toolName", "args": { "param": "value" }, "resultKey": "stateKey" }
\`\`\`

**set-state** — Update a single state key:
\`\`\`json
{ "type": "set-state", "key": "stateKey", "value": "newValue" }
\`\`\`

**set-state-batch** — Update multiple state keys atomically:
\`\`\`json
{ "type": "set-state-batch", "entries": [{ "key": "a", "value": 1 }, { "key": "b", "value": 2 }] }
\`\`\`

**open-link** — Open a URL in the browser:
\`\`\`json
{ "type": "open-link", "url": "https://example.com" }
\`\`\`

## Template Interpolation

Use \`{{stateKey}}\` in strings to resolve values from state at render time:

- \`{{user.name}}\` — dot notation accesses nested state
- \`{{event.value}}\` — in \`onChange\` actions, resolves to the current input value
- Templates work in action \`args\`, \`value\` fields, and text \`content\` props

## Example 1 — Minimal App

A simple card with a text heading:

\`\`\`json
{
  "title": "Hello",
  "mcpServerUrl": "http://localhost:3000",
  "root": {
    "type": "card",
    "props": { "title": "Welcome" },
    "children": [
      { "type": "text", "props": { "content": "Hello World", "variant": "h2" } }
    ]
  }
}
\`\`\`

## Example 2 — Interactive Search App

A search form that calls an MCP tool and displays results in a table:

\`\`\`json
{
  "title": "Search App",
  "mcpServerUrl": "http://localhost:3000",
  "state": { "query": "", "results": [] },
  "root": {
    "type": "card",
    "props": { "title": "Search" },
    "children": [
      {
        "type": "input",
        "props": { "stateKey": "query", "label": "Search", "placeholder": "Type a query..." },
        "actions": { "onChange": { "type": "set-state", "key": "query", "value": "{{event.value}}" } }
      },
      {
        "type": "button",
        "props": { "label": "Search", "variant": "primary" },
        "actions": {
          "onClick": { "type": "call-tool", "tool": "search", "args": { "q": "{{query}}" }, "resultKey": "results" }
        }
      },
      {
        "type": "table",
        "props": {
          "dataKey": "results",
          "columns": [
            { "key": "name", "label": "Name" },
            { "key": "description", "label": "Description" }
          ]
        }
      }
    ]
  }
}
\`\`\`
`;

export function registerUISkillResource(
  server: McpServer
): void {
  server.registerResource(
    "xmcp-ui-schema-reference",
    "skill://xmcp-ui/schema-reference",
    {
      description:
        "Component catalog and schema format for generating valid xmcp UI JSON",
      mimeType: "text/markdown",
    },
    async (uri: URL) => ({
      contents: [
        {
          text: SCHEMA_REFERENCE,
          uri: uri.href,
          mimeType: "text/markdown",
        },
      ],
    })
  );
}

export { SCHEMA_REFERENCE };
