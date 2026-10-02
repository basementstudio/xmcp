import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "component-metadata",
    "preserves icons, namespaced tags and custom metadata in every component listing",
    async ({ client }) => {
      const components = [
        (await client.listTools({}, REQUEST_OPTIONS)).tools.find(
          (item) => item.name === "metadata-tool"
        ),
        (await client.listPrompts({}, REQUEST_OPTIONS)).prompts.find(
          (item) => item.name === "metadata-prompt"
        ),
        (await client.listResources({}, REQUEST_OPTIONS)).resources.find(
          (item) => item.name === "metadata-resource"
        ),
        (
          await client.listResourceTemplates({}, REQUEST_OPTIONS)
        ).resourceTemplates.find((item) => item.name === "metadata-template"),
      ];
      for (const component of components) {
        assert.ok(component);
        assert.deepEqual(component.icons, [
          {
            src: "https://example.com/icon.png",
            mimeType: "image/png",
            sizes: ["48x48"],
            theme: "dark",
          },
        ]);
        assert.deepEqual(component._meta, {
          custom: "kept",
          "xmcp/tags": ["catalog", "example"],
        });
        assert.equal("enabled" in component, false);
        assert.equal("tags" in component, false);
      }
    }
  );
  whenSupported(
    "component-metadata",
    "omits disabled components and UI resources and rejects direct requests",
    async ({ client }) => {
      const components = [
        ...(await client.listTools({}, REQUEST_OPTIONS)).tools,
        ...(await client.listPrompts({}, REQUEST_OPTIONS)).prompts,
        ...(await client.listResources({}, REQUEST_OPTIONS)).resources,
        ...(await client.listResourceTemplates({}, REQUEST_OPTIONS))
          .resourceTemplates,
      ];
      assert.equal(
        components.some((item) => item.name.startsWith("disabled-metadata")),
        false
      );
      await assert.rejects(
        client.callTool(
          { name: "disabled-metadata", arguments: {} },
          REQUEST_OPTIONS
        ),
        /not found/i
      );
      await assert.rejects(
        client.getPrompt({ name: "disabled-metadata" }, REQUEST_OPTIONS),
        /not found/i
      );
      for (const uri of [
        "metadata://disabled",
        "metadata://disabled/123",
        "ui://app/disabled-metadata.html",
      ]) {
        await assert.rejects(
          client.readResource({ uri }, REQUEST_OPTIONS),
          /not found/i
        );
      }
    }
  );
}
