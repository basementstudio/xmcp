# Widget Design Principles

Extended reference for widget design in xmcp. Load this file when working with complex widgets, GPT App submissions, or advanced patterns.

## Table of Contents

1. [Complete Widget Examples](#complete-widget-examples)
2. [Component Patterns](#component-patterns)
3. [Widget-to-Tool Communication](#widget-to-tool-communication)
4. [Anti-Patterns](#anti-patterns)
5. [GPT App Submission](#gpt-app-submission)
6. [Project Structures](#project-structures)

---

## Complete Widget Examples

### GPT App: Counter with Tailwind

```tsx
// src/tools/counter.tsx
import { InferSchema, type ToolMetadata } from "xmcp";
import { useState } from "react";
import { z } from "zod";

export const metadata: ToolMetadata = {
  name: "counter",
  description: "Interactive counter widget",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading counter",
        invoked: "Counter loaded",
      },
      widgetAccessible: true,
      resultCanProduceWidget: true,
    },
  },
};

export const schema = {
  initialCount: z.number().describe("The initial count value"),
};

export default function handler({ initialCount }: InferSchema<typeof schema>) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-16">
          <div className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Counter
          </div>
          <div className="text-8xl font-light tracking-tight mb-2">{count}</div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCount(count - 1)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-sm font-mono uppercase tracking-wider"
            >
              Decrement
            </button>
            <button
              onClick={() => setCount(count + 1)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-sm font-mono uppercase tracking-wider"
            >
              Increment
            </button>
          </div>
          <button
            onClick={() => setCount(0)}
            className="w-full px-8 py-4 bg-white text-black hover:bg-zinc-200 transition-all duration-200 text-sm font-mono uppercase tracking-wider"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
```

### GPT App: Weather with External API

```tsx
// src/tools/weather.tsx
import { type ToolMetadata } from "xmcp";
import { useState, useEffect } from "react";

export const metadata: ToolMetadata = {
  name: "weather",
  description: "Weather App",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading weather",
        invoked: "Weather loaded",
      },
      widgetAccessible: true,
      resultCanProduceWidget: true,
      widgetCSP: {
        connect_domains: ["{{WEATHER_API_BASE_URL}}"],
      },
    },
  },
};

const cities = {
  "Buenos Aires": { lat: -34.6037, lon: -58.3816 },
  "San Francisco": { lat: 37.7749, lon: -122.4194 },
  "Tokyo": { lat: 35.6762, lon: 139.6503 },
};
const WEATHER_API_BASE_URL = "{{WEATHER_API_BASE_URL}}";

export default function handler() {
  const [selectedCity, setSelectedCity] = useState("Buenos Aires");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      const city = cities[selectedCity as keyof typeof cities];
      try {
        const response = await fetch(
          `${WEATHER_API_BASE_URL}/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
        );
        if (!response.ok) throw new Error("Failed to fetch");
        setWeatherData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-light text-center mb-12">{selectedCity}</h1>
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {Object.keys(cities).map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-6 py-3 text-sm font-mono uppercase transition-all ${
                selectedCity === city
                  ? "bg-white text-black"
                  : "bg-white/5 hover:bg-white/10 border border-white/10"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
        {loading && <div className="text-center text-zinc-500">Loading...</div>}
        {error && <div className="text-center text-red-400">Error: {error}</div>}
        {weatherData && !loading && (
          <div className="grid grid-cols-3 gap-6">
            <Card label="Temperature" value={`${weatherData.current.temperature_2m}deg`} />
            <Card label="Humidity" value={`${weatherData.current.relative_humidity_2m}%`} />
            <Card label="Wind" value={`${weatherData.current.wind_speed_10m} km/h`} />
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-8">
      <div className="text-sm text-zinc-500 uppercase mb-4">{label}</div>
      <div className="text-5xl font-light">{value}</div>
    </div>
  );
}
```

### GPT App: Template Literal Resource

```typescript
// src/resources/(ui)/widget/pizza-map.ts
import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "pizza-map",
  title: "Show Pizza Map",
  mimeType: "text/html+skybridge",
};

export default async function handler() {
  return `
    <div id="pizzaz-root"></div>
    <link rel="stylesheet" href="{{PIZZAZ_CSS_URL}}">
    <script type="module" src="{{PIZZAZ_JS_URL}}"></script>
  `.trim();
}
```

### GPT App: CSS Modules

```css
/* counter.module.css */
.container {
  min-height: 100vh;
  background-color: black;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.count {
  font-size: 6rem;
  font-weight: 300;
}

.button {
  padding: 1rem 2rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 200ms;
}

.button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}
```

```tsx
// counter.tsx
import styles from "./counter.module.css";

export default function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  return (
    <div className={styles.container}>
      <div className={styles.count}>{count}</div>
      <button className={styles.button} onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### MCP App: Minimal Widget

```tsx
// src/tools/greeting.tsx
import { type ToolMetadata, type InferSchema } from "xmcp";
import { z } from "zod";

export const metadata: ToolMetadata = {
  name: "greeting",
  description: "Display a greeting",
};

export const schema = {
  name: z.string().describe("Name to greet"),
};

export default function Greeting({ name }: InferSchema<typeof schema>) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <h1 className="text-6xl font-light">Hello, {name}!</h1>
    </div>
  );
}
```

---

## Component Patterns

### Card

```tsx
function Card({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-8 hover:border-white/20 transition-all">
      <div className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">{label}</div>
      <div className="text-5xl font-light tracking-tight">
        {value}
        {unit && <span className="text-2xl text-zinc-500 ml-2">{unit}</span>}
      </div>
    </div>
  );
}
```

### Button Variants

```tsx
// Primary
<button className="w-full px-8 py-4 bg-white text-black hover:bg-zinc-200 transition-all text-sm font-mono uppercase">
  Primary
</button>

// Secondary
<button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-mono uppercase">
  Secondary
</button>

// Tab
<button className={`px-6 py-3 text-sm font-mono uppercase transition-all ${
  isSelected ? "bg-white text-black" : "bg-white/5 hover:bg-white/10 border border-white/10"
}`}>
  Tab
</button>
```

### Loading & Error

```tsx
function Loading() {
  return <div className="text-center text-zinc-500 font-mono text-sm">Loading...</div>;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center text-red-400 font-mono text-sm border border-red-400/20 bg-red-400/5 py-4 px-6">
      Error: {message}
    </div>
  );
}
```

---

## Widget-to-Tool Communication

GPT Apps support bidirectional communication using hooks.

### Hooks

```tsx
import { useCallTool } from "@/hooks/use-call-tool";
import { useToolOutput } from "@/hooks/use-tool-output";

// Call tool from widget
const callTool = useCallTool();
await callTool("launch_game", { game: "doom" });

// Access structured content
const output = useToolOutput<GameStructuredContent>();
if (output?.game) {
  // Game launched
}
```

### Structured Content Response

```typescript
export default async function handler({ game }: InferSchema<typeof schema>) {
  return {
    structuredContent: {
      game: "doom",
      title: "DOOM",
      url: "{{GAME_ASSET_URL}}",
    },
    content: [{ type: "text", text: "Launching DOOM..." }],
  };
}
```

### Interactive Card Example

```tsx
function GameCard({ name }: { name: string }) {
  const callTool = useCallTool();

  return (
    <button onClick={() => callTool("launch_game", { game: name })}>
      <h3>{name}</h3>
    </button>
  );
}
```

---

## Anti-Patterns

### Missing widgetAccessible (GPT Apps)

```typescript
// Bad - widget won't render
_meta: { openai: { toolInvocation: { invoking: "...", invoked: "..." } } }

// Good
_meta: { openai: { widgetAccessible: true, toolInvocation: { ... } } }
```

### Wrong MIME Type

```typescript
// Bad
mimeType: "text/html"

// Good
mimeType: "text/html+skybridge"
```

### Missing CSP

```typescript
// Bad - fetch blocked
fetch('{{EXTERNAL_API_URL}}');

// Good - declare in metadata
widgetCSP: { connect_domains: ["{{EXTERNAL_API_BASE_URL}}"] }
```

### No Loading State

```tsx
// Bad - crashes on null
return <div>{data.value}</div>;

// Good
if (loading) return <Loading />;
if (error) return <Error message={error} />;
return <div>{data.value}</div>;
```

### Hardcoded Dimensions

```tsx
// Bad
style={{ width: '800px' }}

// Good
className="w-full max-w-4xl mx-auto"
```

### Missing Hover States

```tsx
// Bad
className="bg-white/10"

// Good
className="bg-white/10 hover:bg-white/20 transition-all"
```

---

## GPT App Submission

### Required Assets

- **Icon**: SVG 64x64px (test in dark mode)
- **Demo video**: Same domain as app
- **Legal**: Privacy policy and terms of service
- **Screenshots**: Width 706px, height 400-860px (up to 4)

### Domain Verification

Serve token at `/.well-known/openai-apps-challenge`

xmcp standalone: Set `OPENAI-APPS-VERIFICATION-TOKEN` env var (auto-handled)

### Tool Annotations

```typescript
annotations: {
  readOnlyHint: true,      // Only reads data
  openWorldHint: true,     // Web access / external calls
  destructiveHint: false,  // Modifies/deletes data
}
```

### Test Cases

Positive (tool should trigger):
- Scenario, User prompt, Tool triggered, Expected output

Negative (tool should NOT trigger):
- Scenario, User prompt

Use [MCPJam](https://www.mcpjam.com/) to auto-generate test cases.

---

## Project Structures

### GPT App

```
my-gpt-app/
|-- src/
|   |-- tools/
|   |   |-- counter.tsx
|   |   |-- counter.module.css
|   |-- resources/
|   |   |-- (ui)/widget/custom.ts
|   |-- globals.css
|-- postcss.config.mjs
|-- xmcp.config.ts
```

### MCP App

```
my-mcp-app/
|-- src/
|   |-- tools/
|   |   |-- counter.tsx
|   |-- globals.css
|-- xmcp.config.ts
```

### GPT App with Next.js

```
arcade/
|-- xmcp/                    # MCP Server
|   |-- src/tools/
|   |   |-- arcade.ts
|   |   |-- launch-game.ts
|   |-- xmcp.config.ts
|-- application/             # Next.js
    |-- app/widgets/
    |   |-- arcade/page.tsx
    |-- hooks/
        |-- use-call-tool.ts
        |-- use-tool-output.ts
```
