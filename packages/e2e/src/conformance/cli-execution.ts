import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";
import { runDeveloperCli } from "../harness/developer-cli.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "cli-execution",
    "calls tools, reads resources, and renders prompts through the built CLI",
    async (target) => {
      const directory = target.fixture.directory;
      const connection = target.url ? [target.url] : [];
      const subprocess = target.url
        ? []
        : ["--stdio", process.execPath, join(directory, "dist/stdio.js")];
      const run = (
        command: string,
        component: string,
        options: string[],
        label: string,
        input?: string
      ) =>
        runDeveloperCli(
          [command, ...connection, component, ...options, ...subprocess],
          directory,
          `cli-execution-${target.mode}-${label}`,
          input
        );

      const called = await run(
        "call",
        "add",
        ["--arg", "a=2", "--arg", "b=3"],
        "call"
      );
      assert.equal(called.code, 0, called.stderr);
      assert.equal(JSON.parse(called.stdout).structuredContent.sum, 5);
      const file = join(directory, `cli-args-${target.mode}.json`);
      await writeFile(file, '{"a":4,"b":5}');
      const fromFile = await run("call", "add", ["--args-file", file], "file");
      assert.equal(fromFile.code, 0, fromFile.stderr);
      assert.equal(JSON.parse(fromFile.stdout).structuredContent.sum, 9);
      const prompt = await run(
        "get-prompt",
        "greet",
        [],
        "prompt",
        '{"name":"Ada"}'
      );
      assert.equal(prompt.code, 0, prompt.stderr);
      assert.equal(
        JSON.parse(prompt.stdout).messages[0].content.text,
        "Hello, Ada"
      );
      const resource = await run(
        "read-resource",
        "fixture://info",
        [],
        "resource"
      );
      assert.equal(resource.code, 0, resource.stderr);
      assert.equal(
        JSON.parse(resource.stdout).contents[0].text,
        "fixture information"
      );
      const templated = await run(
        "read-resource",
        "fixture://users/42",
        [],
        "template"
      );
      assert.equal(templated.code, 0, templated.stderr);
      assert.equal(JSON.parse(templated.stdout).contents[0].text, "user:42");

      const failed = await run("call", "fail", [], "error");
      assert.equal(failed.code, 1);
      assert.equal(JSON.parse(failed.stdout).isError, true);
      const malformed = await run(
        "call",
        "add",
        ["--arg", "a=wrong", "--arg", "b=2"],
        "invalid"
      );
      assert.equal(malformed.code, 2);
      assert.equal(malformed.stdout, "");
      assert.match(malformed.stderr, /Invalid tool arguments/);
    }
  );
}
