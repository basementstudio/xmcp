import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import {
  InMemoryTransport,
  McpServer,
  inputRequired,
  inputResponse,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { addResourcesToServer } from "../resources";
import { loadResourceModules } from "../resource-loader";

for (const asynchronous of [false, true]) {
  test(`direct resources complete a roots round trip with ${asynchronous ? "an async" : "a sync"} handler`, async (t) => {
    const server = new McpServer({ name: "resource-input", version: "1" });
    const handler = (_args: unknown, extra: ServerContext) => {
      const response = inputResponse(extra.mcpReq.inputResponses, "workspace");
      if (response.kind === "missing") {
        return inputRequired({
          inputRequests: { workspace: inputRequired.listRoots() },
        });
      }
      assert.equal(response.kind, "roots");
      return `Roots: ${response.roots.length}`;
    };
    const { resourceModules } = await loadResourceModules({
      "(example)/static.ts": async () => ({
        default: asynchronous
          ? async (args: unknown, extra: ServerContext) => handler(args, extra)
          : handler,
      }),
    });
    addResourcesToServer(server, resourceModules);
    const client = new Client(
      { name: "test", version: "1" },
      { capabilities: { roots: {} }, versionNegotiation: { mode: "auto" } }
    );
    client.setRequestHandler("roots/list", () => ({
      roots: [{ uri: "file:///workspace" }],
    }));
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    t.after(async () => {
      await client.close();
      await server.close();
    });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.readResource({ uri: "example://static" });
    assert.deepEqual(result.contents, [
      { uri: "example://static", text: "Roots: 1" },
    ]);
  });
}
