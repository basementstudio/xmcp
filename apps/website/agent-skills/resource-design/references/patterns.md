# xmcp Resource Templates Reference

This file contains detailed code templates for creating xmcp resources. Use these patterns when generating resource code.

---

## Static Resource Templates

### Template A: Simple Static Resource

Best for: Configuration, fixed content, documentation

**File: `src/resources/(config)/app.ts`**
**URI: `config://app`**

```typescript
import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "app-config",
  title: "Application Configuration",
  description: "Application configuration and settings",
  mimeType: "application/json",
};

export default function handler() {
  return JSON.stringify({
    appName: "My Application",
    version: "1.0.0",
    features: {
      darkMode: true,
      notifications: true,
    },
  }, null, 2);
}
```

### Minimal Resource (No Metadata)

Best for: Quick prototyping, simple resources

**File: `src/resources/(config)/settings.ts`**
**URI: `config://settings`**

```typescript
// Metadata is optional - resource name defaults to filename
export default function handler() {
  return JSON.stringify({ theme: "dark", language: "en" });
}
```

**Note:** When metadata is omitted, xmcp uses the filename as the resource name.

---

### Template B: Static Text Resource

Best for: Documentation, README content, static text

**File: `src/resources/docs/readme.ts`**
**URI: `docs://readme`**

```typescript
import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "readme",
  title: "README",
  description: "Project documentation and getting started guide",
  mimeType: "text/markdown",
};

export default function handler() {
  return `# Project Documentation

## Getting Started

This is the project documentation...

## Features

- Feature 1
- Feature 2
- Feature 3
`;
}
```

---

## Dynamic Resource Templates

### Template C: Dynamic Resource with Single Parameter

Best for: User profiles, single-item lookups

**File: `src/resources/(users)/[userId]/profile.ts`**
**URI: `users://[userId]/profile`**

```typescript
import { z } from "zod";
import { type InferSchema, type ResourceMetadata } from "xmcp";

export const schema = {
  userId: z.string().describe("The unique identifier of the user"),
};

export const metadata: ResourceMetadata = {
  name: "user-profile",
  title: "User Profile",
  description: "User profile information and preferences",
  mimeType: "application/json",
};

export default async function handler({ userId }: InferSchema<typeof schema>) {
  // Fetch user data from database or API
  const user = await fetchUser(userId);

  return JSON.stringify({
    id: userId,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }, null, 2);
}
```

### Template D: Dynamic Resource with Multiple Parameters

Best for: Nested lookups, time-scoped data

**File: `src/resources/(reports)/[year]/[month]/summary.ts`**
**URI: `reports://[year]/[month]/summary`**

```typescript
import { z } from "zod";
import { type InferSchema, type ResourceMetadata } from "xmcp";

export const schema = {
  year: z.string().regex(/^\d{4}$/).describe("The year (YYYY format)"),
  month: z.string().regex(/^\d{2}$/).describe("The month (MM format)"),
};

export const metadata: ResourceMetadata = {
  name: "monthly-report",
  title: "Monthly Report",
  description: "Monthly summary report with key metrics",
  mimeType: "application/json",
};

export default async function handler({
  year,
  month
}: InferSchema<typeof schema>) {
  const report = await generateReport(year, month);

  return JSON.stringify({
    period: `${year}-${month}`,
    metrics: report.metrics,
    summary: report.summary,
    generatedAt: new Date().toISOString(),
  }, null, 2);
}
```

---

## File-Based Resource Templates

### Template E: File Content Resource

Best for: Log files, data files, uploaded content

**File: `src/resources/(files)/[filename]/content.ts`**
**URI: `files://[filename]/content`**

```typescript
import { z } from "zod";
import { readFile } from "fs/promises";
import { type InferSchema, type ResourceMetadata } from "xmcp";

export const schema = {
  filename: z.string().describe("The name of the file to read"),
};

export const metadata: ResourceMetadata = {
  name: "file-content",
  title: "File Content",
  description: "Read content from a file",
  mimeType: "text/plain",
};

export default async function handler({
  filename
}: InferSchema<typeof schema>) {
  const filepath = `/data/files/${filename}`;
  const content = await readFile(filepath, "utf-8");
  return content;
}
```

### Template F: Binary File Resource

Best for: Images, PDFs, binary data

**File: `src/resources/(assets)/[assetId]/download.ts`**
**URI: `assets://[assetId]/download`**

```typescript
import { z } from "zod";
import { readFile } from "fs/promises";
import { type InferSchema, type ResourceMetadata } from "xmcp";

export const schema = {
  assetId: z.string().describe("The asset identifier"),
};

export const metadata: ResourceMetadata = {
  name: "asset-download",
  title: "Asset Download",
  description: "Download binary asset content",
  mimeType: "application/octet-stream",
};

export default async function handler({
  assetId
}: InferSchema<typeof schema>) {
  const asset = await getAsset(assetId);
  const content = await readFile(asset.path);

  return {
    blob: new Uint8Array(content),
    mimeType: asset.mimeType,
  };
}
```

---

## Nested Routing Examples

### Template G: Deeply Nested Resource

**File: `src/resources/(api)/v1/[service]/[resource]/[id]/details.ts`**
**URI: `api://v1/[service]/[resource]/[id]/details`**

```typescript
import { z } from "zod";
import { type InferSchema, type ResourceMetadata } from "xmcp";

export const schema = {
  service: z.enum(["users", "orders", "products"]).describe("The service name"),
  resource: z.string().describe("The resource type"),
  id: z.string().describe("The resource identifier"),
};

export const metadata: ResourceMetadata = {
  name: "api-resource-details",
  title: "API Resource Details",
  description: "Detailed information about an API resource",
  mimeType: "application/json",
};

export default async function handler({
  service,
  resource,
  id
}: InferSchema<typeof schema>) {
  const data = await fetchResourceDetails(service, resource, id);
  return JSON.stringify(data, null, 2);
}
```

---

## Return Value Patterns

### Text Content (Default)
```typescript
return "Plain text content";
```

### JSON Content
```typescript
// Formatted JSON
return JSON.stringify(data, null, 2);

// Compact JSON
return JSON.stringify(data);
```

### Binary Content
```typescript
return {
  blob: new Uint8Array(buffer),
  mimeType: "image/png",
};
```

---

## Route Group Patterns

Route groups `(folder)` organize resources without affecting the URI:

```
src/resources/
├── (public)/           # Public resources
│   ├── docs/
│   │   └── api.ts     # → docs://api
│   └── status.ts      # → status://
├── (private)/          # Private/authenticated resources
│   └── (users)/
│       └── me/
│           └── profile.ts  # → users://me/profile
└── (admin)/            # Admin resources
    └── config.ts      # → admin://config
```

---

## Type Imports Reference

```typescript
// Core types
import { type ResourceMetadata, type InferSchema } from "xmcp";

// Zod for schemas
import { z } from "zod";
```

---

## Best Practices

### 1. Use Descriptive Names
```typescript
// Good
name: "user-preferences"
description: "User preference settings including theme and notification options"

// Avoid
name: "prefs"
description: "Preferences"
```

### 2. Validate Parameters with Zod
```typescript
export const schema = {
  id: z.string().uuid().describe("UUID of the resource"),
  limit: z.number().int().min(1).max(100).default(10).describe("Results limit"),
  format: z.enum(["json", "csv", "xml"]).describe("Output format"),
};
```

### 3. Handle Errors Gracefully
```typescript
export default async function handler({ id }: InferSchema<typeof schema>) {
  try {
    const data = await fetchData(id);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return JSON.stringify({
      error: "Failed to fetch resource",
      message: error.message,
    });
  }
}
```
