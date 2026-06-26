# xmcp Tool Templates Reference

This file contains detailed code templates for creating xmcp tools. Use these patterns when generating tool code.

---

## Schema Patterns

### Simple Schema
```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The user's name"),
};
```

### Schema with Validation
```typescript
export const schema = {
  input: z
    .string()
    .min(1, "Input is required")
    .max(1000, "Input too long")
    .describe("The input text to process"),
  count: z
    .number()
    .int()
    .positive()
    .default(10)
    .describe("Number of results"),
};
```

### Schema with Enum
```typescript
export const schema = {
  format: z
    .enum(["json", "csv", "xml"])
    .describe("Output format"),
};
```

### Schema with Optional Fields
```typescript
export const schema = {
  query: z.string().describe("Search query"),
  limit: z.number().optional().describe("Max results"),
  filters: z.array(z.string()).optional().describe("Filter tags"),
};
```

### Schema with Object
```typescript
export const schema = {
  config: z.object({
    enabled: z.boolean(),
    threshold: z.number(),
  }).describe("Configuration object"),
};
```

---

## Metadata Patterns

### Basic Metadata
```typescript
export const metadata: ToolMetadata = {
  name: "my-tool",
  description: "Brief description of what this tool does",
};
```

### Minimal Tool (No Metadata)
```typescript
import { z } from "zod";
import { type InferSchema } from "xmcp";

export const schema = {
  name: z.string().describe("The name to greet"),
};

// Metadata is optional - tool name defaults to filename
export default function handler({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
```

**Note:** When metadata is omitted, xmcp uses the filename as the tool name.

### Metadata with Annotations
```typescript
export const metadata: ToolMetadata = {
  name: "my-tool",
  description: "Brief description of what this tool does",
  annotations: {
    title: "My Tool",           // Human-readable title
    readOnlyHint: true,         // Doesn't modify environment
    destructiveHint: false,     // Doesn't delete/modify data
    idempotentHint: true,       // Repeated calls = same result
    openWorldHint: false,       // Doesn't interact with external world
  },
};
```

### Metadata with OpenAI Widget Support
```typescript
export const metadata: ToolMetadata = {
  name: "my-widget",
  description: "Interactive widget tool",
  annotations: {
    title: "My Widget",
    readOnlyHint: true,
  },
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading widget...",    // Max 64 chars
        invoked: "Widget ready!",         // Max 64 chars
      },
      widgetAccessible: true,             // Enables widget-to-tool communication
      resultCanProduceWidget: true,       // For React/HTML widgets
    },
  },
};
```

### Metadata with MCP Apps UI Support
```typescript
export const metadata: ToolMetadata = {
  name: "my-tool",
  description: "Tool with UI metadata",
  _meta: {
    ui: {
      toolInvocation: {
        invoking: "Processing...",
        invoked: "Complete!",
      },
      widgetAccessible: true,
    },
  },
};
```

---

## Handler Type Templates

### Template A: Standard Handler (String Return)

Best for: Data queries, calculations, simple API calls

```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The name to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet a user by name",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default function handler({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
```

### Template B: Standard Handler (Async with Content Array)

Best for: API calls, database queries, file operations

```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  query: z.string().describe("Search query"),
};

export const metadata: ToolMetadata = {
  name: "search",
  description: "Search for items",
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export default async function handler({ query }: InferSchema<typeof schema>) {
  const results = await performSearch(query);

  return JSON.stringify(results, null, 2);
}
```

### Template C: Standard Handler (Structured Content)

Best for: Returning typed data that clients can parse

```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  city: z.string().describe("City name"),
};

export const metadata: ToolMetadata = {
  name: "get-weather",
  description: "Get weather data for a city",
};

export default async function handler({ city }: InferSchema<typeof schema>) {
  const weather = await fetchWeather(city);

  return JSON.stringify(weather);
}
```

### Template D: Template Literal (HTML Widget)

Best for: Embedding external widgets, iframes, or scripts

```typescript
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "show-map",
  description: "Display an interactive map",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading map...",
        invoked: "Map ready!",
      },
      resultCanProduceWidget: true,
    },
  },
};

export default async function handler() {
  return `
    <div id="map-root" style="width: 100%; height: 400px;"></div>
    <link rel="stylesheet" href="{{MAP_WIDGET_CSS_URL}}">
    <script type="module" src="{{MAP_WIDGET_JS_URL}}"></script>
  `.trim();
}
```

### Template E: React Component

Best for: Interactive stateful widgets, complex UIs

**File: `src/tools/my-widget.tsx`**

```tsx
import { useState, useEffect } from "react";
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  initialValue: z.number().default(0).describe("Starting value"),
};

export const metadata: ToolMetadata = {
  name: "counter",
  description: "Interactive counter widget",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading counter...",
        invoked: "Counter ready!",
      },
      widgetAccessible: true,
      resultCanProduceWidget: true,
    },
  },
};

export default function handler({ initialValue }: InferSchema<typeof schema>) {
  const [count, setCount] = useState(initialValue);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
      <button onClick={() => setCount(initialValue)}>Reset</button>
    </div>
  );
}
```

### Template F: No Parameters

Best for: Tools that don't need input

```typescript
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "get-timestamp",
  description: "Get current timestamp",
  annotations: {
    readOnlyHint: true,
  },
};

export default function handler() {
  return new Date().toISOString();
}
```

### Template G: With Extra Arguments (Auth/Context)

Best for: Tools that need authentication or request context

```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";

export const schema = {
  resourceId: z.string().describe("Resource to access"),
};

export const metadata: ToolMetadata = {
  name: "get-resource",
  description: "Get a protected resource",
};

export default async function handler(
  { resourceId }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  // Access auth info
  if (!extra.authInfo) {
    return { content: [{ type: "text", text: "Unauthorized" }], isError: true };
  }

  const { token, scopes, clientId } = extra.authInfo;

  // Access other context
  const { sessionId, requestId, signal } = extra;

  // Fetch with abort support
  const response = await fetch(`/api/resource/${resourceId}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  return await response.text();
}
```

---

## Return Value Patterns

### Simple String (Preferred for readability)
```typescript
return `Result: ${value}`;
return JSON.stringify(data, null, 2);
```

### Error Response
```typescript
return {
  content: [{ type: "text", text: "Error: Something went wrong" }],
  isError: true,
};
```

### HTML String (Auto-wrapped as widget)
```typescript
return `<div>HTML content</div>`;
```

### JSX (React handlers only)
```tsx
return <MyComponent prop={value} />;
```

---

## Type Imports Reference

```typescript
// Core types
import {
  type ToolMetadata,
  type ToolExtraArguments,
  type InferSchema,
} from "xmcp";

// Zod for schemas
import { z } from "zod";

// React (for .tsx files)
import { useState, useEffect } from "react";
```
