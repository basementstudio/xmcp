import { test } from "node:test";
import assert from "node:assert";
import {
  MCP_PROTOCOL_VERSION,
  readMcpRoutingHeaders,
  findMcpNameRoutingError,
} from "../mcp-protocol";

test("MCP_PROTOCOL_VERSION targets the 2026-07-28 spec", () => {
  assert.strictEqual(MCP_PROTOCOL_VERSION, "2026-07-28");
});

test("readMcpRoutingHeaders reads version, method, and name case-insensitively", () => {
  const routing = readMcpRoutingHeaders({
    "MCP-Protocol-Version": "2026-07-28",
    "Mcp-Method": "tools/call",
    "Mcp-Name": "search",
  });

  assert.deepStrictEqual(routing, {
    protocolVersion: "2026-07-28",
    mcpMethod: "tools/call",
    mcpName: "search",
  });
});

test("readMcpRoutingHeaders returns undefined fields when headers are absent", () => {
  assert.deepStrictEqual(readMcpRoutingHeaders({}), {
    protocolVersion: undefined,
    mcpMethod: undefined,
    mcpName: undefined,
  });
});

test("findMcpNameRoutingError flags a header/body tool-name mismatch", () => {
  const error = findMcpNameRoutingError("search", ["delete-user"]);
  assert.match(error ?? "", /Mcp-Name header "search"/);
});

test("findMcpNameRoutingError passes when the header matches the body", () => {
  assert.strictEqual(findMcpNameRoutingError("search", ["search"]), undefined);
});

test("findMcpNameRoutingError does not reject older clients without Mcp-Name", () => {
  assert.strictEqual(findMcpNameRoutingError(undefined, ["search"]), undefined);
});

test("findMcpNameRoutingError does not reject when the body has no tool name", () => {
  assert.strictEqual(findMcpNameRoutingError("search", []), undefined);
});
