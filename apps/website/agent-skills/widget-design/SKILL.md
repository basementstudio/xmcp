---
name: widget-design
description: Best practices for designing UI widgets in xmcp. Use when creating interactive widgets for GPT Apps or MCP Apps, choosing between React components and template literals, designing widget layouts, handling state and data fetching, or troubleshooting widget rendering issues.
---

# Widget Design Best Practices

## Decision Framework

### Platform Selection

Choose based on target client:

- **GPT Apps**: Target is ChatGPT. Requires `_meta.openai` with `widgetAccessible: true`.
- **MCP Apps**: Target is any ext-apps client. Minimal config, works automatically.

### Handler Type Selection

| Scenario | Handler | Reason |
|----------|---------|--------|
| User interaction needed (buttons, inputs) | React (`.tsx`) | State management with hooks |
| Display external widget library | Template literal | Just load scripts/styles |
| Dynamic content from tool params | React | Props flow naturally |
| Static HTML with no state | Template literal | Simpler, less overhead |

**Rule of thumb**: If unsure, start with React. Converting later is harder than starting simple.

## Widget Design Principles

### 1. Widgets Are Not Web Apps

Widgets render inline in conversations. Design constraints:

- **No navigation**: Single-screen experience only
- **Limited width**: ~600-700px max in most clients
- **Sandboxed**: External resources need CSP declarations
- **Ephemeral**: May be re-rendered, don't rely on persistence

### 2. Immediate Value

Show useful content without requiring user action:

```tsx
// Bad: Requires click to see anything
export default function Widget() {
  const [data, setData] = useState(null);
  return <button onClick={fetchData}>Load Data</button>;
}

// Good: Shows data immediately
export default function Widget({ query }) {
  const [data, setData] = useState(null);
  useEffect(() => { fetchData(query).then(setData); }, [query]);
  return data ? <Results data={data} /> : <Loading />;
}
```

### 3. Visual Hierarchy in Limited Space

With limited width, hierarchy matters more:

```tsx
<div className="space-y-4">
  {/* Label: small, muted, uppercase */}
  <div className="text-sm text-zinc-500 uppercase tracking-wider">Temperature</div>
  
  {/* Value: large, prominent */}
  <div className="text-5xl font-light">72°F</div>
  
  {/* Supporting: medium, secondary */}
  <div className="text-zinc-400">Feels like 68°F</div>
</div>
```

### 4. Every Interactive Element Needs Feedback

Users need visual confirmation that elements are interactive:

```tsx
// Bad: No visual feedback
<button className="px-4 py-2 bg-white/10">Click</button>

// Good: Hover + transition
<button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all duration-200">
  Click
</button>
```

## State Management Guidelines

### Keep State Local and Simple

Widgets are isolated. No Redux, Zustand, or external state.

```tsx
// Good: Local state with hooks
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### Always Handle Three States

Every async operation has three states. Handle all of them:

```tsx
export default function Widget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  return <Display data={data} />;
}
```

### Fetch on Mount, Not on Click

Widgets should show value immediately:

```tsx
// Bad: User must click to see data
<button onClick={() => fetchData()}>Load</button>

// Good: Fetch automatically
useEffect(() => { fetchData(); }, []);
```

## Common Mistakes

### 1. Missing widgetAccessible (GPT Apps)

Widget won't render without this:

```typescript
// Broken
_meta: { openai: { toolInvocation: { ... } } }

// Fixed
_meta: { openai: { widgetAccessible: true, toolInvocation: { ... } } }
```

### 2. External Fetch Without CSP

Requests blocked silently:

```typescript
// Broken: fetch fails silently
fetch('{{WEATHER_API_URL}}');

// Fixed: declare in metadata
_meta: {
  openai: {
    widgetCSP: { connect_domains: ["{{WEATHER_API_BASE_URL}}"] }
  }
}
```

### 3. Hardcoded Dimensions

Widgets break on different screen sizes:

```tsx
// Bad
<div style={{ width: '800px' }}>...</div>

// Good
<div className="w-full max-w-2xl mx-auto">...</div>
```

### 4. No Error Boundaries

Crashes show blank widget:

```tsx
// Always wrap risky operations
try {
  const result = JSON.parse(data);
} catch {
  return <Error message="Invalid data format" />;
}
```

## Platform-Specific Notes

### GPT Apps: Structured Content for Widget Communication

Pass data from tool to widget:

```typescript
return {
  structuredContent: { game: "doom", url: "..." },
  content: [{ type: "text", text: "Launching DOOM..." }],
};
```

Widget reads via `useToolOutput()` hook.

### MCP Apps: Minimal Config

MCP Apps work with just a React component:

```tsx
// This is enough for MCP Apps
export const metadata = { name: "widget", description: "..." };
export default function Widget() { return <div>Hello</div>; }
```

## Quick Reference

### GPT Apps Checklist
- `widgetAccessible: true` in metadata
- `toolInvocation` messages under 64 chars
- CSP for external domains

## References

See [references/design-principles.md](references/design-principles.md) for:
- Complete widget examples (counter, weather, arcade)
- Component patterns (cards, buttons, tabs)
- CSS Modules examples
- GPT App submission requirements
- Project structure templates
