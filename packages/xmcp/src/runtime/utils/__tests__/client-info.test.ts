import { test } from "node:test";
import assert from "node:assert";
import {
  extractClientInfoFromMessage,
  extractClientInfoFromMessages,
  mapImplementationToClientInfo,
} from "../client-info";

test("extractClientInfoFromMessage returns undefined for non-initialize methods", () => {
  const result = extractClientInfoFromMessage({
    jsonrpc: "2.0",
    method: "tools/call",
    params: {},
  });

  assert.strictEqual(result, undefined);
});

test("extractClientInfoFromMessage extracts required and optional fields", () => {
  const result = extractClientInfoFromMessage({
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
  });

  assert.deepStrictEqual(result, {
    name: "cursor",
    version: "0.50.1",
    title: "Cursor",
    websiteUrl: "https://cursor.com",
    description: "AI code editor",
  });
});

test("extractClientInfoFromMessage returns undefined for invalid clientInfo payload", () => {
  const result = extractClientInfoFromMessage({
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      clientInfo: {
        name: "cursor",
      },
    },
  });

  assert.strictEqual(result, undefined);
});

test("extractClientInfoFromMessages supports batch requests", () => {
  const result = extractClientInfoFromMessages([
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
  ]);

  assert.deepStrictEqual(result, {
    name: "opencode",
    version: "1.2.3",
  });
});

test("mapImplementationToClientInfo maps SDK implementation shape", () => {
  const result = mapImplementationToClientInfo({
    name: "claude-code",
    version: "2.1.0",
    title: "Claude Code",
    websiteUrl: "https://claude.ai",
    description: "CLI coding agent",
  });

  assert.deepStrictEqual(result, {
    name: "claude-code",
    version: "2.1.0",
    title: "Claude Code",
    websiteUrl: "https://claude.ai",
    description: "CLI coding agent",
  });
});
