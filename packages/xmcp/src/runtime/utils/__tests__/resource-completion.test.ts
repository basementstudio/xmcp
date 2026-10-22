import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import type { ResourceCompletions } from "../../../types/resource";
import { addResourcesToServer } from "../resources";
import { loadResourceModules } from "../resource-loader";

async function connect(t: TestContext, complete?: ResourceCompletions) {
  const server = new McpServer({ name: "resource-completion", version: "1" });
  const { resourceModules } = await loadResourceModules({
    "(team)/members/[department]/[name]/index.ts": async () => ({
      complete,
      default: ({ department, name }: { department: string; name: string }) =>
        `${department}:${name}`,
    }),
    "(team)/about.ts": async () => ({ default: () => "About the team" }),
  });
  addResourcesToServer(server, resourceModules);
  const client = new Client({ name: "test", version: "1" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

const ref = {
  type: "ref/resource" as const,
  uri: "team://members/{department}/{name}",
};

test("resource loader retains the named complete export", async () => {
  const complete: ResourceCompletions = { name: () => ["Ada"] };
  const module = { default: () => "resource", complete };
  const result = await loadResourceModules({
    "(team)/[name]/index.ts": async () => module,
  });
  assert.deepEqual(result.skippedResources, []);
  assert.strictEqual(
    result.resourceModules.get("(team)/[name]/index.ts")?.complete,
    complete
  );
});

test("resource completions receive prefixes and dependent arguments for sync and async callbacks", async (t) => {
  const client = await connect(t, {
    department: (value) =>
      ["engineering", "sales"].filter((item) => item.startsWith(value)),
    name: async (value, context) => {
      assert.equal(value, "A");
      assert.deepEqual(context?.arguments, { department: "engineering" });
      return ["Ada", "Alan"];
    },
  });
  assert.deepEqual(
    (
      await client.complete({
        ref,
        argument: { name: "department", value: "e" },
      })
    ).completion.values,
    ["engineering"]
  );
  assert.deepEqual(
    (
      await client.complete({
        ref,
        argument: { name: "name", value: "A" },
        context: { arguments: { department: "engineering" } },
      })
    ).completion.values,
    ["Ada", "Alan"]
  );
  const read = await client.readResource({
    uri: "team://members/engineering/Ada",
  });
  assert.ok("text" in read.contents[0]);
  assert.equal(read.contents[0].text, "engineering:Ada");
});

test("unknown parameters, inherited keys and callbacks outside the template return no completions", async (t) => {
  const client = await connect(t, {
    name: () => ["Ada"],
    unrelated: () => {
      throw new Error("Not a template parameter");
    },
  });
  for (const name of [
    "missing",
    "toString",
    "constructor",
    "__proto__",
    "unrelated",
  ]) {
    const result = await client.complete({
      ref,
      argument: { name, value: "" },
    });
    assert.deepEqual(result.completion, { values: [], hasMore: false });
  }
});

test("the SDK caps completion responses at 100 and reports the full total", async (t) => {
  const suggestions = Array.from(
    { length: 105 },
    (_, index) => `user-${index}`
  );
  const client = await connect(t, { name: () => suggestions });
  const result = await client.complete({
    ref,
    argument: { name: "name", value: "" },
  });
  assert.deepEqual(result.completion, {
    values: suggestions.slice(0, 100),
    total: 105,
    hasMore: true,
  });
});

test("templates without callbacks keep completions disabled and resources readable", async (t) => {
  const client = await connect(t);
  assert.equal(client.getServerCapabilities()?.completions, undefined);
  const read = await client.readResource({ uri: "team://members/sales/Ada" });
  assert.ok("text" in read.contents[0]);
  assert.equal(read.contents[0].text, "sales:Ada");
});

test("static resources return no completions when another template enables completion", async (t) => {
  const client = await connect(t, { name: () => ["Ada"] });
  const result = await client.complete({
    ref: { type: "ref/resource", uri: "team://about" },
    argument: { name: "name", value: "" },
  });
  assert.deepEqual(result.completion, { values: [], hasMore: false });
});
