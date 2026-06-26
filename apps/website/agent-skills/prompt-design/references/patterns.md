# xmcp Prompt Templates Reference

This file contains detailed code templates for creating xmcp prompts. Use these patterns when generating prompt code.

---

## Simple Prompt Templates

### Template A: Basic Static Prompt

Best for: Fixed prompts without parameters

**File: `src/prompts/explain-code.ts`**

```typescript
import { type PromptMetadata } from "xmcp";

export const metadata: PromptMetadata = {
  name: "explain-code",
  title: "Explain Code",
  description: "Ask for a detailed explanation of code",
  role: "user",
};

export default function handler() {
  return `Please explain the following code in detail:
- What does it do?
- How does it work?
- What are the key concepts involved?
- Are there any potential issues or improvements?`;
}
```

### Template B: Simple Text Return

Best for: Prompts returning explicit content type

```typescript
import { type PromptMetadata } from "xmcp";

export const metadata: PromptMetadata = {
  name: "summarize",
  title: "Summarize",
  description: "Request a summary of content",
  role: "user",
};

export default function handler() {
  return {
    type: "text",
    text: "Please provide a concise summary of the above content, highlighting the key points and main takeaways.",
  };
}
```

### Minimal Prompt (No Metadata)

Best for: Quick prototyping, simple prompts

**File: `src/prompts/hello.ts`**

```typescript
// Metadata is optional - prompt name defaults to filename
export default function handler() {
  return "Hello! How can I help you today?";
}
```

**Note:** When metadata is omitted, xmcp uses the filename as the prompt name.

---

## Parameterized Prompt Templates

### Template C: Code Review Prompt

Best for: Structured code analysis with customization

**File: `src/prompts/review-code.ts`**

```typescript
import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  code: z.string().describe("The code to review"),
  language: z.string().optional().describe("Programming language"),
  focus: z.enum(["security", "performance", "readability", "all"])
    .default("all")
    .describe("Review focus area"),
};

export const metadata: PromptMetadata = {
  name: "review-code",
  title: "Review Code",
  description: "Review code for best practices and potential issues",
  role: "user",
};

export default function handler({
  code,
  language,
  focus
}: InferSchema<typeof schema>) {
  const languageHint = language ? ` (${language})` : "";
  const focusAreas = focus === "all"
    ? "security, performance, and readability"
    : focus;

  return  `Please review this code${languageHint} focusing on ${focusAreas}:

- Code quality and best practices
- Potential bugs or issues
- Suggestions for improvement

Code to review:
\`\`\`${language || ""}
${code}
\`\`\``
}
```

### Template D: Documentation Generator Prompt

Best for: Generating documentation from code

**File: `src/prompts/generate-docs.ts`**

```typescript
import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  code: z.string().describe("The code to document"),
  style: z.enum(["jsdoc", "markdown", "readme", "api"])
    .default("jsdoc")
    .describe("Documentation style"),
  includeExamples: z.boolean()
    .default(true)
    .describe("Include usage examples"),
};

export const metadata: PromptMetadata = {
  name: "generate-docs",
  title: "Generate Documentation",
  description: "Generate documentation for code",
  role: "user",
};

export default function handler({
  code,
  style,
  includeExamples
}: InferSchema<typeof schema>) {
  const styleGuide = {
    jsdoc: "JSDoc comments with @param, @returns, and @example tags",
    markdown: "Markdown documentation with headers and code blocks",
    readme: "README.md format with installation, usage, and API sections",
    api: "API reference documentation with endpoints and parameters",
  };

  return `Generate ${styleGuide[style]} for this code${includeExamples ? ", including usage examples" : ""}:

\`\`\`
${code}
\`\`\`

Please ensure the documentation is:
- Clear and concise
- Accurate to the code behavior
- Properly formatted`;
}
```

---

## Autocompletion Support

### Template E: Prompt with Autocompletion

Best for: Prompts with known value sets

**File: `src/prompts/team-greeting.ts`**

```typescript
import { z } from "zod";
import { type InferSchema, type PromptMetadata, completable } from "xmcp";

export const schema = {
  department: completable(
    z.string().describe("Department name"),
    (value) => {
      const departments = ["engineering", "sales", "marketing", "support"];
      return departments.filter((d) => d.startsWith(value.toLowerCase()));
    }
  ),
  name: completable(
    z.string().describe("Team member name"),
    (value, context) => {
      const department = context?.arguments?.["department"];
      const teams: Record<string, string[]> = {
        engineering: ["Alice", "Bob", "Charlie"],
        sales: ["David", "Eve", "Frank"],
        marketing: ["Grace", "Henry", "Iris"],
        support: ["Jack", "Kate", "Leo"],
      };
      const members = teams[department as string] || ["Guest"];
      return members.filter((n) => n.toLowerCase().startsWith(value.toLowerCase()));
    }
  ),
};

export const metadata: PromptMetadata = {
  name: "team-greeting",
  title: "Team Greeting",
  description: "Generate a personalized greeting for team members",
  role: "assistant",
};

export default function handler({
  department,
  name
}: InferSchema<typeof schema>) {
  return `Hello ${name}! Welcome to the ${department} team. I'm here to help you with anything you need.`;
}
```

---

## Real-World Examples

### Example: Pull Request Review

**File: `src/prompts/review-pr.ts`**

```typescript
import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  diff: z.string().describe("The PR diff content"),
  description: z.string().optional().describe("PR description"),
  checkList: z.array(z.enum([
    "security",
    "performance",
    "tests",
    "documentation",
    "breaking-changes"
  ])).default(["security", "tests"]).describe("Review checklist items"),
};

export const metadata: PromptMetadata = {
  name: "review-pr",
  title: "Review Pull Request",
  description: "Comprehensive pull request review",
  role: "user",
};

export default function handler({
  diff,
  description,
  checkList
}: InferSchema<typeof schema>) {
  const checks = checkList.map((item) => `- [ ] ${item}`).join("\n");

  return `Please review this pull request.

${description ? `**Description:** ${description}\n` : ""}
**Review checklist:**
${checks}

**Diff:**
\`\`\`diff
${diff}
\`\`\`

Provide:
1. Overall assessment
2. Specific issues found (if any)
3. Suggestions for improvement
4. Approval recommendation (approve/request changes)`
}
```

### Example: API Endpoint Documentation

**File: `src/prompts/document-api.ts`**

```typescript
import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  endpoint: z.string().describe("API endpoint path"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  handler: z.string().describe("Handler code"),
  includeOpenAPI: z.boolean().default(false).describe("Generate OpenAPI spec"),
};

export const metadata: PromptMetadata = {
  name: "document-api",
  title: "Document API Endpoint",
  description: "Generate API documentation from endpoint handler",
  role: "user",
};

export default function handler({
  endpoint,
  method,
  handler,
  includeOpenAPI
}: InferSchema<typeof schema>) {
  return `Generate documentation for this API endpoint:

**Endpoint:** ${method} ${endpoint}

**Handler code:**
\`\`\`typescript
${handler}
\`\`\`

Please document:
1. Endpoint description
2. Request parameters (path, query, body)
3. Response format and status codes
4. Example request/response
${includeOpenAPI ? "5. OpenAPI 3.0 specification" : ""}`;
}
```

---

## Type Imports Reference

```typescript
// Basic prompt
import { type PromptMetadata } from "xmcp";

// Parameterized prompt
import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";
```

---

## Best Practices

### 1. Write Clear Descriptions
```typescript
// Good
description: "Review code for security vulnerabilities, performance issues, and best practices"

// Avoid
description: "Reviews code"
```

### 2. Provide Parameter Defaults
```typescript
export const schema = {
  format: z.enum(["detailed", "brief"]).default("detailed"),
  includeExamples: z.boolean().default(true),
};
```

### 3. Use Enums for Known Options
```typescript
export const schema = {
  language: z.enum(["typescript", "javascript", "python", "go", "rust"]),
  reviewType: z.enum(["security", "performance", "style", "comprehensive"]),
};
```

### 4. Document Parameter Purpose
```typescript
export const schema = {
  code: z.string().describe("Source code to analyze - can include multiple files"),
  maxIssues: z.number().min(1).max(50).default(10)
    .describe("Maximum number of issues to report"),
};
```
