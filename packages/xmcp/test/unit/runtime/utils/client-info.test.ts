import { test, expect } from "vitest";
import {
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
