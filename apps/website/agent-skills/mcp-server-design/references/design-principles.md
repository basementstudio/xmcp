# MCP Design Principles: Deep Dive

This document provides extended examples, anti-patterns, and real-world case studies for designing effective MCP servers.

## Understanding MCP Fundamentals

### The Three Primitives

MCP servers expose three types of primitives:

1. **Tools**: Actions the LLM can take (most important)
2. **Resources**: Data the LLM can read
3. **Prompts**: Pre-built conversation starters

**Tools are the most critical primitive**. They determine what your MCP server can actually do and how effectively LLMs can use it.

## Extended Design Examples

### Case Study: Database Management

#### The Wrong Approach

A developer wraps their PostgreSQL API:

```typescript
// Anti-pattern: Generic database wrappers
// src/tools/execute-query.ts
// src/tools/list-schemas.ts
// src/tools/list-tables.ts
// src/tools/describe-table.ts
// src/tools/get-table-data.ts
// src/tools/insert-row.ts
// src/tools/update-row.ts
// src/tools/delete-row.ts
// src/tools/create-table.ts
// src/tools/drop-table.ts
// src/tools/create-index.ts
// src/tools/analyze-table.ts
// src/tools/vacuum-table.ts
// src/tools/get-query-plan.ts
// src/tools/list-users.ts
// src/tools/grant-permission.ts
```

**Problems**:
- Generic names don't guide behavior
- LLM must understand PostgreSQL internals
- High risk of destructive operations

#### The Right Approach

Design around what database users actually need:

```typescript
// src/tools/explore-database.ts
import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "explore-database",
  description: "Understand database structure. Returns schemas, tables, relationships, and sample data to help answer questions.",
};

// src/tools/query-data.ts
export const schema = {
  question: z.string().describe("What you want to know about the data"),
};

export const metadata: ToolMetadata = {
  name: "query-data",
  description: "Answer questions about data. Describe what you want to know and get formatted results with insights.",
};

// src/tools/prepare-migration.ts
export const schema = {
  description: z.string().describe("What database change is needed"),
};

export const metadata: ToolMetadata = {
  name: "prepare-migration",
  description: "Design a database change. Describe the change needed and get a reviewed migration plan with safety checks.",
};

// src/tools/optimize-performance.ts
export const metadata: ToolMetadata = {
  name: "optimize-performance",
  description: "Identify and fix slow queries. Analyzes recent query patterns and suggests specific improvements.",
};

// src/tools/backup-restore.ts
export const metadata: ToolMetadata = {
  name: "backup-restore",
  description: "Create backups or restore from existing ones. Handles all safety checks automatically.",
};
```

**Benefits**:
- Tools with clear purposes
- Names describe user goals
- Built-in safety checks
- LLM can reason about tasks, not SQL

### Case Study: Communication Platform (Slack-like)

#### The Wrong Approach

```typescript
// Anti-pattern: API wrapper
// src/tools/post-message.ts
// src/tools/update-message.ts
// src/tools/delete-message.ts
// src/tools/add-reaction.ts
// src/tools/remove-reaction.ts
// src/tools/get-channel-history.ts
// src/tools/list-channels.ts
// src/tools/create-channel.ts
// src/tools/invite-user.ts
// src/tools/upload-file.ts
// src/tools/search-messages.ts
```

#### The Right Approach

```typescript
// src/tools/notify-team.ts
import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const schema = {
  message: z.string().describe("The update to send to the team"),
  urgency: z.enum(["low", "normal", "high"]).default("normal").describe("Message urgency level"),
};

export const metadata: ToolMetadata = {
  name: "notify-team",
  description: "Send updates to team members. Handles channel selection, formatting, and mentions automatically based on urgency and topic.",
};

// src/tools/find-discussion.ts
export const schema = {
  topic: z.string().describe("What topic or context to search for"),
};

export const metadata: ToolMetadata = {
  name: "find-discussion",
  description: "Find relevant conversations and context. Searches across channels and threads to surface related discussions.",
};

// src/tools/summarize-channel.ts
export const schema = {
  channel: z.string().describe("Channel name or ID to summarize"),
};

export const metadata: ToolMetadata = {
  name: "summarize-channel",
  description: "Get caught up on a channel. Returns key discussions, decisions, and action items from recent activity.",
};

// src/tools/coordinate-meeting.ts
export const schema = {
  topic: z.string().describe("Meeting topic"),
  participants: z.array(z.string()).describe("List of participants"),
};

export const metadata: ToolMetadata = {
  name: "coordinate-meeting",
  description: "Schedule and announce meetings. Finds available times, creates calendar events, and notifies participants.",
};
```

## Anti-Patterns in Detail

### Anti-Pattern 1: The "Run Anything" Tool

```typescript
// Terrible: God tool
// src/tools/execute.ts
export const metadata: ToolMetadata = {
  name: "execute",
  description: "Execute any operation. Pass the operation type and parameters.",
};
```

**Why it's bad**:
- LLM has no guidance on capabilities
- Impossible to validate inputs
- No guardrails on dangerous operations

### Anti-Pattern 2: Implementation Leakage

```typescript
// Bad: Exposing implementation details
// src/tools/POST_api_v2_users_create.ts
export const metadata: ToolMetadata = {
  name: "POST_api_v2_users_create",
  description: "Create user via POST /api/v2/users",
};

// src/tools/GET_api_v2_users_list.ts
export const metadata: ToolMetadata = {
  name: "GET_api_v2_users_list",
  description: "List users via GET /api/v2/users",
};
```

**Why it's bad**:
- HTTP methods are irrelevant to users
- API versions create confusion
- Names don't describe user intent
- Couples tool design to API structure

### Anti-Pattern 3: Incomplete Operations

```typescript
// Bad: Requiring manual orchestration
// LLM must call all 4 tools in sequence:
// src/tools/validate-email.ts
// src/tools/check-username-available.ts
// src/tools/create-user-record.ts
// src/tools/send-welcome-email.ts
```

**Why it's bad**:
- Each step is a potential failure point
- LLM must understand correct ordering
- Intermediate states may be invalid
- User asked for one thing, gets four tool calls

**Better approach**:
```typescript
// src/tools/create-user.ts
import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const schema = {
  email: z.string().email().describe("User's email address"),
  username: z.string().describe("Desired username"),
};

export const metadata: ToolMetadata = {
  name: "create-user",
  description: "Create a new user account. Validates email, checks username availability, creates the account, and sends welcome email. Returns the new user profile or specific validation errors.",
};
```

## Summary

Effective MCP server design requires shifting from "what can my API do?" to "what do users need to accomplish?". The best MCP servers:

1. Have few, purposeful tools (5-10)
2. Name tools for user intent, not implementation
3. Shape tools around complete tasks
