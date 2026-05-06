import { test, expect } from "vitest";
import {
  extractClientInfoFromHeaders,
  extractClientInfoFromMessage,
  extractClientInfoFromMessages,
  mapImplementationToClientInfo,
} from "@/runtime/utils/client-info";

test("extractClientInfoFromMessage returns undefined for non-initialize methods", () => {
  expect(
    extractClientInfoFromMessage({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {},
    })
  ).toBeUndefined();
});

test("extractClientInfoFromMessage extracts required and optional fields", () => {
  expect(
    extractClientInfoFromMessage({
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        clientInfo: {
          name: "cursor",
          version: "0.50.1",
          title: "Cursor",
          websiteUrl: "https://cursor.com",
          description: "AI code editor",
        },
      },
    })
  ).toEqual({
    name: "cursor",
    version: "0.50.1",
    title: "Cursor",
    websiteUrl: "https://cursor.com",
    description: "AI code editor",
  });
});

test("extractClientInfoFromHeaders extracts required and optional fields", () => {
  expect(
    extractClientInfoFromHeaders({
      "x-mcp-client-name": "cursor",
      "x-mcp-client-version": "0.50.1",
      "x-mcp-client-title": "Cursor",
      "x-mcp-client-website-url": "https://cursor.com",
      "x-mcp-client-description": "AI code editor",
    })
  ).toEqual({
    name: "cursor",
    version: "0.50.1",
    title: "Cursor",
    websiteUrl: "https://cursor.com",
    description: "AI code editor",
  });
});

test("extractClientInfoFromHeaders handles case-insensitive header names", () => {
  expect(
    extractClientInfoFromHeaders({
      "X-MCP-Client-Name": "claude-code",
      "X-MCP-Client-Version": "2.1.0",
    })
  ).toEqual({
    name: "claude-code",
    version: "2.1.0",
  });
});

test("extractClientInfoFromHeaders returns undefined without name and version", () => {
  expect(
    extractClientInfoFromHeaders({
      "x-mcp-client-name": "cursor",
    })
  ).toBeUndefined();

  expect(
    extractClientInfoFromHeaders({
      "x-mcp-client-version": "0.50.1",
    })
  ).toBeUndefined();
});

test("extractClientInfoFromMessage returns undefined for invalid clientInfo payload", () => {
  expect(
    extractClientInfoFromMessage({
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        clientInfo: {
          name: "cursor",
        },
      },
    })
  ).toBeUndefined();
});

test("extractClientInfoFromMessages supports batch requests", () => {
  expect(
    extractClientInfoFromMessages([
      {
        jsonrpc: "2.0",
        method: "ping",
        id: 1,
      },
      {
        jsonrpc: "2.0",
        method: "initialize",
        id: 2,
        params: {
          clientInfo: {
            name: "opencode",
            version: "1.2.3",
          },
        },
      },
    ])
  ).toEqual({
    name: "opencode",
    version: "1.2.3",
  });
});

test("mapImplementationToClientInfo maps SDK implementation shape", () => {
  expect(
    mapImplementationToClientInfo({
      name: "claude-code",
      version: "2.1.0",
      title: "Claude Code",
      websiteUrl: "https://claude.ai",
      description: "CLI coding agent",
    })
  ).toEqual({
    name: "claude-code",
    version: "2.1.0",
    title: "Claude Code",
    websiteUrl: "https://claude.ai",
    description: "CLI coding agent",
  });
});
