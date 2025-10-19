# SSR + Hydration Implementation Spec for xmcp React Tools

## Overview

This spec defines how to implement Server-Side Rendering (SSR) with client-side hydration for React 19 components in xmcp tools, enabling interactive widgets with stateful React components to work within Claude Desktop's iframe architecture.

## Problem Statement

Currently, returning JSX from a tool handler that uses React hooks (like `useState`) breaks because:
1. The handler tries to execute React hooks at build/server time
2. There's no hydration mechanism to make the static HTML interactive
3. The resulting HTML is static and non-interactive

## ⚠️ CRITICAL: Backward Compatibility Requirement

**THIS IS AN ADDITIVE FEATURE ONLY. EXISTING FUNCTIONALITY MUST NOT BREAK.**

### Non-Negotiable Requirements

1. **All existing tool return types MUST continue to work exactly as before**:
   - Tools returning strings
   - Tools returning objects with `content` arrays
   - Tools returning HTML strings
   - Tools returning JSON data
   - Tools returning any other supported format

2. **SSR is OPT-IN ONLY**:
   - SSR only activates when `experimental.ssr.enabled = true` in config
   - Even with SSR enabled, it only applies to React components
   - Non-React tools are completely unaffected

3. **Zero Breaking Changes**:
   - Existing projects without SSR config continue to work identically
   - Build process remains the same for non-SSR projects
   - No changes to existing tool handler signatures or behavior
   - All existing examples and documentation remain valid

### Detection and Routing Logic

The framework MUST use this decision tree:

```
Tool Handler Invoked
    ↓
Is experimental.ssr.enabled === true?
    ├─ NO → Use existing tool processing (current behavior) ✓
    └─ YES ↓
         Is handler a React component (function returning JSX)?
             ├─ NO → Use existing tool processing (current behavior) ✓
             └─ YES ↓
                  Does handler use React hooks or import React?
                      ├─ NO → Use existing tool processing (current behavior) ✓
                      └─ YES → Use SSR path (NEW behavior) ✓
```

### Validation Tests Required

Before merging, ALL of these must pass:

1. ✅ Existing tool returning string: Works unchanged
2. ✅ Existing tool returning object: Works unchanged
3. ✅ Existing tool returning HTML: Works unchanged
4. ✅ Project without SSR config: Builds and runs unchanged
5. ✅ Project with SSR disabled: Works unchanged
6. ✅ React tool with SSR enabled: Uses new SSR path
7. ✅ Non-React tool with SSR enabled: Uses existing path

## Solution Architecture

### High-Level Flow

```
Tool Handler (React Component)
    ↓
Server-Side Rendering (renderToString)
    ↓
Generate HTML + Client Bundle
    ↓
Hydration Script Embedded
    ↓
Resource Registration (text/html+skybridge)
    ↓
Interactive Widget in Claude Desktop
```

## Configuration

### xmcp.config.ts Extension

Add an experimental `ssr` property to enable SSR for specific tools:

```typescript
interface XmcpConfig {
  http: true;
  paths: {
    tools: string;
    prompts: boolean | string;
    resources: boolean | string;
  };
  experimental?: {
    ssr?: {
      enabled: boolean;
    };
  };
}
```

Example:
```typescript
const config: XmcpConfig = {
  http: true,
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
  experimental: {
    ssr: {
      enabled: true
    }
  }
};
```

## Build Process

### 1. Webpack Configuration Update

**File**: `webpack.config.js` (or create if doesn't exist)

Requirements:
- Add `.tsx` support to webpack loader rules
- Configure dual output: server bundle + client bundle
- Server bundle: for SSR (renderToString)
- Client bundle: for hydration in browser

**Server Bundle Config**:
- Target: `node`
- Output: CommonJS modules
- Include: React, ReactDOM/server
- Purpose: Used by the tool handler to call `renderToString`

**Client Bundle Config**:
- Target: `web`
- Output: IIFE (Immediately Invoked Function Expression)
- Include: React, ReactDOM/client, component code
- Minified and optimized
- Output file: `dist/client/bundle.js`
- Purpose: Loaded in browser to hydrate the SSR HTML

**TypeScript/TSX Loader**:
```javascript
{
  test: /\.(ts|tsx)$/,
  use: {
    loader: 'ts-loader',
    options: {
      compilerOptions: {
        jsx: 'react-jsx',
        module: 'esnext',
        target: 'es2015'
      }
    }
  },
  exclude: /node_modules/
}
```

### 2. Build Script Updates

**package.json**:
```json
{
  "scripts": {
    "build": "npm run build:server && npm run build:client",
    "build:server": "webpack --config webpack.server.config.js",
    "build:client": "webpack --config webpack.client.config.js",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "webpack --config webpack.server.config.js --watch",
    "dev:client": "webpack --config webpack.client.config.js --watch"
  }
}
```

## Runtime Implementation

### 3. Tool Handler Detection and Processing

**Detection Logic** (in xmcp framework):

When processing a tool handler:
1. Check if `experimental.ssr.enabled` is true in config
2. Check if the handler default export is a React component (function/class)
3. Check if handler uses React hooks or returns JSX
4. If yes → Use SSR path
5. If no → Use existing static HTML path

### 4. SSR Rendering Process

**Framework responsibilities**:

```typescript
// Pseudo-code for framework SSR handler
async function renderToolWithSSR(
  toolHandler: Function,
  toolMetadata: ToolMetadata,
  config: XmcpConfig
) {
  // 1. Import server-side bundle of the component
  const Component = await import(`./dist/server/tools/${toolName}.js`);

  // 2. Render to string using React
  const { renderToString } = await import('react-dom/server');
  const appHtml = renderToString(<Component.default />);

  // 3. Get component code for client bundle
  const componentClientCode = await getClientBundle(toolName);

  // 4. Generate full HTML with hydration
  const fullHtml = generateHydrationHtml({
    appHtml,
    componentClientCode,
    toolName
  });

  // 5. Register as resource with text/html+skybridge
  server.registerResource(
    `${toolName}-widget`,
    `ui://widget/${toolName}.html`,
    {
      mimeType: "text/html+skybridge",
      contents: [{
        text: fullHtml
      }]
    }
  );

  // 6. Return tool response with _meta pointing to resource
  return {
    content: [{ type: "text", text: "" }],
    _meta: {
      "openai/outputTemplate": `ui://widget/${toolName}.html`,
      ...toolMetadata._meta.openai
    }
  };
}
```

### 5. HTML Generation with Hydration

**Template Structure**:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{toolName} Widget</title>
  <style>
    /* Reset and base styles */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <!-- Server-rendered content -->
  <div id="root">{SERVER_RENDERED_HTML}</div>

  <!-- Inlined client bundle with React, ReactDOM, and component code -->
  <script>
    {INLINED_CLIENT_BUNDLE}
    // Bundle includes:
    // - React
    // - ReactDOM
    // - Component code
    // - Hydration logic that calls ReactDOM.hydrateRoot()
  </script>
</body>
</html>
```

### 6. Client Bundle Format

**Client bundle must**:
- Export the component to global scope: `window.{toolNameCamelCase}Component`
- Bundle all dependencies (except React/ReactDOM if using CDN)
- Be accessible via HTTP at the configured `bundleUrl`

**Webpack output config**:
```javascript
{
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist/client'),
    library: {
      name: '[name]Component',
      type: 'window'
    }
  }
}
```

## Development vs Production

### Development Mode

```typescript
experimental: {
  ssr: {
    enabled: true
  }
}
```

- Inline bundles for simplicity
- Source maps enabled
- Fast rebuilds

### Production Mode

```typescript
experimental: {
  ssr: {
    enabled: true
  }
}
```

- Minified and optimized inline bundles
- Same strategy, production optimizations applied

## Bundle Serving Strategy

### Inline Bundle Approach (Default and Only)

The client bundle is **always inlined** directly into the HTML:

```html
<script>
  // Entire bundle inlined here
  {CLIENT_BUNDLE_CODE}
</script>
```

**Why inline only?**
- ✅ No external HTTP requests needed
- ✅ No CORS issues
- ✅ No bundle hosting infrastructure required
- ✅ Simplest developer experience
- ✅ Works immediately without additional setup
- ⚠️ Larger HTML payload (acceptable for widgets)

This is the **only supported approach** to keep the implementation simple and avoid complexity around bundle hosting, URLs, and CORS configurations.

## File Structure

```
xmcp-project/
├── src/
│   └── tools/
│       └── get-pizza-map.tsx          # React component with hooks
├── dist/
│   ├── server/
│   │   └── tools/
│   │       └── get-pizza-map.js       # SSR bundle (Node)
│   └── client/
│       └── get-pizza-map.bundle.js    # Hydration bundle (Browser)
├── webpack.server.config.js
├── webpack.client.config.js
├── xmcp.config.ts
└── package.json
```

## Edge Cases and Considerations

### 1. React Hook Rules

SSR will fail if:
- Hooks called conditionally
- Hooks called in loops
- Component structure differs between server/client

**Mitigation**: Standard React SSR best practices apply

### 2. Browser-only APIs

Code using `window`, `document`, `localStorage` etc. will break during SSR.

**Mitigation**:
```typescript
useEffect(() => {
  // Browser-only code here
  if (typeof window !== 'undefined') {
    // Safe to use window APIs
  }
}, []);
```

### 3. Hydration Mismatches

Server HTML must exactly match client-rendered HTML on initial render.

**Mitigation**:
- Use `suppressHydrationWarning` for dynamic content
- Defer dynamic content to `useEffect`

### 4. CSS Handling

**Options**:
1. Inline styles (current approach in example)
2. CSS-in-JS libraries (styled-components, emotion) with SSR support
3. External stylesheets loaded via `<link>`

**Recommendation**: Start with inline styles, add CSS-in-JS later if needed

### 5. Multiple Components/Tools

Each tool gets its own:
- Server bundle entry point
- Client bundle file
- Resource registration

**Bundle organization**:
```
dist/client/
├── get-pizza-map.bundle.js
├── another-tool.bundle.js
└── shared-vendor.bundle.js  # Optional: shared React/deps
```

## Migration Path

### Phase 1: Single Tool POC
- Enable SSR for `get-pizza-map.tsx`
- Inline bundle approach
- Manual webpack configs

### Phase 2: Multiple Tools
- Support multiple tools with SSR
- Separate bundles per tool
- Local dev server for bundles

### Phase 3: Production Ready
- CDN bundle hosting
- Optimized builds
- Cache strategies

### Phase 4: Framework Integration
- Auto-detect React components
- Auto-generate webpack configs
- CLI commands: `xmcp build --ssr`

## Testing Strategy

### Unit Tests
- Test component rendering (JSDOM)
- Test SSR output correctness

### Integration Tests
- Test full SSR → HTML → hydration flow
- Test in actual Claude Desktop iframe

### Manual Tests
1. Component renders server-side ✓
2. HTML served with correct mime type ✓
3. Bundle loads in browser ✓
4. Hydration succeeds without errors ✓
5. Interactive features work (button clicks, state updates) ✓
6. No console errors ✓

## Success Criteria

A successfully implemented SSR system should:

1. ✅ Allow React hooks in tool handlers
2. ✅ Render interactive widgets in Claude Desktop
3. ✅ Maintain state across user interactions
4. ✅ Have no hydration mismatch errors
5. ✅ Work with the `text/html+skybridge` mime type
6. ✅ Support both development and production workflows
7. ✅ Provide good DX (developer experience)

## Open Questions

1. **Bundle hosting**: Should xmcp provide a built-in bundle server, or require users to configure their own?
2. **React version**: Using React 19 exclusively for modern features and performance
3. **CSS strategy**: What's the recommended approach for styling?
4. **Shared dependencies**: Should we create vendor bundles for React/common deps?
5. **TypeScript**: How to handle type checking for both server and client bundles?

## References

- React SSR: https://react.dev/reference/react-dom/server
- React Hydration: https://react.dev/reference/react-dom/client/hydrateRoot
- Webpack Multi-Target: https://webpack.js.org/concepts/targets/
- MCP Protocol: https://modelcontextprotocol.io/
- OpenAI Apps SDK patterns (for reference, not direct implementation)

## Next Steps

After spec approval:
1. Create webpack.server.config.js
2. Create webpack.client.config.js
3. Update xmcp.config.ts type definitions
4. Implement SSR detection logic in framework
5. Create HTML template generator
6. Test with get-pizza-map.tsx example
7. Document for users
