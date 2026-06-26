---
name: resource-design
description: Design MCP resources to expose content for LLM consumption. Use when creating static or dynamic resources in xmcp.
---

# Create xmcp Resource

You are helping the user create a new xmcp resource. Follow this interactive workflow.

## Step 1: Gather Information

Before generating any code, ask the user these questions using AskUserQuestion:

1. **Resource name** (if not provided): What should the resource be named? (Use kebab-case)

2. **Resource type**: Ask which type of resource they need:
   - **Static** - Fixed content that doesn't change (configuration, documentation)
   - **Dynamic** - Content that depends on parameters (user profiles, reports)
   - **File-based** - Content read from files (logs, data files)

3. **URI pattern**: How should the resource be accessed?
   - Simple: `config://app` or `docs://readme`
   - With parameters: `users://[userId]/profile`
   - Nested: `reports://[year]/[month]/summary`

4. **Content details**:
   - What is the content about?

5. **Widget support** (optional): Ask if they need OpenAI widget rendering.

## Step 2: Generate the Resource

Create the resource file in `src/resources/` following the routing conventions:

### File Location & Routing

Resources use file-based routing similar to Next.js:

```
src/resources/
├── (config)/              # Route group (not in URI)
│   └── app.ts            # → config://app
├── (users)/
│   └── [userId]/         # Dynamic segment
│       └── profile.ts    # → users://[userId]/profile
└── docs/
    └── readme.ts         # → docs://readme
```

**Routing conventions:**
- `(folder)` - Route group, excluded from URI path
- `[param]` - Dynamic parameter segment
- Filename becomes the final URI segment

## Resource Structure Reference

Every xmcp resource has two main exports:

```typescript
// 1. Metadata (optional) - Resource configuration
export const metadata: ResourceMetadata = { /* ... */ };

// 2. Handler (required) - Default export function
export default function handler(params?) { /* ... */ }

// 3. Schema (optional) - For dynamic resources with parameters
export const schema = { /* ... */ };
```

## Quick Reference

### Essential Imports
```typescript
import { type ResourceMetadata } from "xmcp";

// For dynamic resources
import { z } from "zod";
import { type InferSchema, type ResourceMetadata } from "xmcp";
```

### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No* | Unique resource identifier |
| `title` | string | No | Human-readable title |
| `description` | string | No | What this resource provides |
| `mimeType` | string | No | Content type (default: text/plain) |
| `size` | number | No | Content size in bytes |
| `_meta` | object | No | Vendor extensions (OpenAI, etc.) |

*When metadata is omitted, xmcp uses the filename as the resource name.

### Handler Return Types

| Return Type | Use Case |
|-------------|----------|
| `string` | Simple text content |
| `{ text: string }` | Explicit text content |
| `{ blob: Uint8Array, mimeType: string }` | Binary content |
| `JSON.stringify(data)` | JSON content |

## Detailed Templates

For complete code templates including:
- Static resource patterns
- Dynamic resource with parameters
- File-based resources
- Nested routing examples
- OpenAI metadata examples

**Read: `references/patterns.md`**

---

## Checklist After Generation

1. File created in correct `src/resources/` location
2. If using metadata, ensure it has descriptive `name` and `description`
3. Schema uses `.describe()` for all parameters (if dynamic)
4. Handler returns appropriate content type
5. File path matches intended URI pattern

Suggest running `pnpm build` to verify the resource compiles correctly.
