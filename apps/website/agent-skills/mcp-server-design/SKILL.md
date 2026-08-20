---
name: mcp-server-design
description: Guide for designing effective MCP servers with agent-friendly tools. Use when creating a new MCP server, designing MCP tools, or improving existing MCP server architecture.
---

# MCP Server Design

## Overview

This skill provides best practices for designing MCP (Model Context Protocol) servers that work effectively with LLM agents. The key insight: design for agents, not automation. LLMs are human-like thinkers, not API consumers.

## Core Philosophy

### Design for Agents, Not Automation

Traditional API design optimizes for programmatic access with granular endpoints. MCP tool design should optimize for how LLMs think and reason:

- **LLMs are human-like thinkers**: They understand intent, context, and purpose
- **Tools should be tasks, not endpoints**: Shape tools around what users want to accomplish
- **Reduce cognitive load**: Fewer, more purposeful tools beat many granular ones

### The Three Pillars

1. **Give everything ready**: Provide complete, actionable information
2. **Reduce effort**: Minimize steps needed to accomplish tasks
3. **Reduce paths**: Limit decision branches the LLM must navigate

## Tool Design Principles

### 1. Purpose-Built Tools Over Generic Wrappers

**Anti-pattern**: Wrapping every API endpoint as a tool
```typescript
// Bad: Generic database tools
// src/tools/run-sql.ts
// src/tools/list-tables.ts
// src/tools/describe-table.ts
```

**Best practice**: Design tools around user tasks
```typescript
// Good: Task-oriented tools
// src/tools/prepare-database-migration.ts
import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const schema = {
  description: z.string().describe("What database changes are needed"),
};

export const metadata: ToolMetadata = {
  name: "prepare-database-migration",
  description: "Design a database change with safety checks and reviewed migration plan",
};

// src/tools/analyze-slow-queries.ts
// src/tools/create-backup.ts
```

### 2. Minimize Tool Count

LLMs struggle with long tool lists. Each additional tool:
- Increases selection confusion
- Adds tokens to every request
- Dilutes the purpose of each tool

**Guidelines**:
- Start with 5-10 core tools
- Add tools only when evals show they're needed
- Combine related operations when sensible

### 3. Name Tools for Purpose, Not Implementation

Tool names guide LLM behavior. The name should describe the task, not the mechanism.

| Instead of... | Use... |
|---------------|--------|
| `post-slack-message` | `notify-team` |
| `run-sql-query` | `analyze-data` |
| `call-api-endpoint` | `check-service-status` |

### 4. Shape Tools Like Tasks

For complex flows, one tool per task beats one tool per step.

**Anti-pattern**: Breaking deployment into atomic operations
```typescript
// Bad: Too many granular tools
// src/tools/create-branch.ts
// src/tools/commit-changes.ts
// src/tools/push-branch.ts
// src/tools/create-pr.ts
// src/tools/run-tests.ts
// src/tools/merge-pr.ts
```

**Best practice**: Single tool for the complete task
```typescript
// src/tools/deploy-changes.ts
import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const schema = {
  description: z.string().describe("What changes are being deployed"),
  runTests: z.boolean().default(true).describe("Run test suite first"),
  autoMerge: z.boolean().default(false).describe("Auto-merge after tests pass"),
};

export const metadata: ToolMetadata = {
  name: "deploy-changes",
  description: "Deploy current changes through the complete workflow",
};

export default function deployChanges({ description, runTests, autoMerge }) {
  // Handles: branch creation, commit, push, PR, tests, merge
}
```

## Decision Framework

### When to Create a New Tool

Create a new tool when:
- Users frequently ask for this specific capability
- The task has clear boundaries and purpose
- Existing tools can't accomplish it cleanly
- Evals show the LLM selects incorrect tools for this task

Don't create a new tool when:
- An existing tool can handle it with minor parameter changes
- It duplicates functionality (combine instead)
- It's a rare edge case (handle with existing tools + guidance)

### When to Combine Operations

Combine multiple operations into one tool when:
- They're almost always used together
- The intermediate results aren't useful alone
- Splitting them creates unnecessary decision points

Keep operations separate when:
- Users need granular control
- Intermediate results have standalone value
- Combining would create an overly complex tool

### Balancing Granularity

| Granular Tools | Combined Tools |
|----------------|----------------|
| More flexibility | Simpler mental model |
| Higher selection burden | Clearer intent |
| Risk of misuse | Less customizable |

## Quick Reference

### Tool Design Checklist

- [ ] Named for purpose, not implementation
- [ ] Description explains when to use it
- [ ] Parameters have clear descriptions
- [ ] Response includes next steps or context
- [ ] Tested with actual LLM requests

### Red Flags

- More than 15 tools in a single server
- Tools named after HTTP methods or endpoints
- Generic tools that "can do anything"
- Tools that require multiple calls for a single task

## Resources

### references/

- `design-principles.md` - Extended examples, anti-patterns, and real-world case studies

For deeper exploration of these concepts, read the design principles reference document.
