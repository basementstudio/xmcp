import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "component-visibility",
    "excludes names and tags from every listing while retaining allowed components and UI resources",
    async ({ client }) => {
      const tools = (await client.listTools({}, REQUEST_OPTIONS)).tools;
      const prompts = (await client.listPrompts({}, REQUEST_OPTIONS)).prompts;
      const resources = (await client.listResources({}, REQUEST_OPTIONS))
        .resources;
      const templates = (
        await client.listResourceTemplates({}, REQUEST_OPTIONS)
      ).resourceTemplates;
      for (const component of [
        ...tools,
        ...prompts,
        ...resources,
        ...templates,
      ]) {
        assert.ok(
          !component.name.startsWith("visibility-hidden"),
          component.name
        );
        assert.notEqual(component.name, "visibility-by-name");
      }
      assert.ok(tools.some(({ name }) => name === "visibility-ui"));
      assert.ok(tools.some(({ name }) => name === "add"));
      assert.ok(prompts.some(({ name }) => name === "visibility-public"));
      assert.ok(resources.some(({ uri }) => uri === "visibility://public"));
      assert.ok(
        resources.some(({ uri }) => uri === "ui://app/visibility-ui.html")
      );
      assert.ok(
        templates.some(({ name }) => name === "visibility-public-template")
      );
      const [ui] = (
        await client.readResource(
          { uri: "ui://app/visibility-ui.html" },
          REQUEST_OPTIONS
        )
      ).contents;
      assert.ok("text" in ui);
      assert.equal(ui.text, "<p>Visible widget</p>");
    }
  );
  whenSupported(
    "component-visibility",
    "rejects direct calls, reads, prompts and completions for excluded components",
    async ({ client }) => {
      for (const name of ["visibility-hidden", "visibility-by-name"]) {
        await assert.rejects(
          client.callTool({ name, arguments: {} }, REQUEST_OPTIONS),
          /not found/i
        );
        await assert.rejects(
          client.getPrompt({ name, arguments: {} }, REQUEST_OPTIONS),
          /not found/i
        );
      }
      for (const uri of [
        "visibility://hidden",
        "visibility://alias",
        "visibility://hidden-items/1",
        "ui://app/visibility-hidden.html",
      ]) {
        await assert.rejects(
          client.readResource({ uri }, REQUEST_OPTIONS),
          /not found/i
        );
      }
      await assert.rejects(
        client.complete(
          {
            ref: {
              type: "ref/resource",
              uri: "visibility://hidden-items/{id}",
            },
            argument: { name: "id", value: "" },
          },
          REQUEST_OPTIONS
        ),
        /not found/i
      );
    }
  );
}
