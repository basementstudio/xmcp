import assert from "node:assert";
import { describe, it } from "node:test";
import {
  clearSamplingToolRegistry,
  createSamplingToolRegistry,
  registerSamplingTool,
  resolveSamplingTools,
} from "../sampling-tool-registry";

function createRegistration(name: string) {
  return {
    definition: {
      name,
      description: `${name} description`,
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    validateInput: (input: unknown) => input,
    execute: async () => ({
      content: [],
    }),
  };
}

describe("sampling tool registry", () => {
  it("keeps independently created registries isolated", () => {
    const firstRegistry = createSamplingToolRegistry();
    const secondRegistry = createSamplingToolRegistry();

    registerSamplingTool(
      "search_docs",
      createRegistration("search_docs"),
      firstRegistry
    );
    registerSamplingTool(
      "fetch_page",
      createRegistration("fetch_page"),
      secondRegistry
    );

    assert.deepStrictEqual(
      resolveSamplingTools("all", firstRegistry).map(
        (tool) => tool.definition.name
      ),
      ["search_docs"]
    );
    assert.deepStrictEqual(
      resolveSamplingTools("all", secondRegistry).map(
        (tool) => tool.definition.name
      ),
      ["fetch_page"]
    );
  });

  it("clearing one registry does not affect the others", () => {
    const firstRegistry = createSamplingToolRegistry();
    const secondRegistry = createSamplingToolRegistry();

    registerSamplingTool(
      "search_docs",
      createRegistration("search_docs"),
      firstRegistry
    );
    registerSamplingTool(
      "fetch_page",
      createRegistration("fetch_page"),
      secondRegistry
    );

    clearSamplingToolRegistry(firstRegistry);

    assert.deepStrictEqual(resolveSamplingTools("all", firstRegistry), []);
    assert.deepStrictEqual(
      resolveSamplingTools("all", secondRegistry).map(
        (tool) => tool.definition.name
      ),
      ["fetch_page"]
    );
  });

  it("preserves the default singleton helpers for standalone scripts", () => {
    clearSamplingToolRegistry();

    registerSamplingTool("search_docs", createRegistration("search_docs"));

    assert.deepStrictEqual(
      resolveSamplingTools("all").map((tool) => tool.definition.name),
      ["search_docs"]
    );

    clearSamplingToolRegistry();
  });
});
