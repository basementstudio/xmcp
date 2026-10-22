import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDiscoveryOptions } from "../discovery-options.js";

test("accepts a target and named-client options in either order", () => {
  const expected = {
    target: "local",
    clientsFile: "config/clients.ts",
    json: true,
    help: false,
  };
  assert.deepEqual(
    parseDiscoveryOptions([
      "local",
      "--json",
      "--clients",
      "config/clients.ts",
    ]),
    expected
  );
  assert.deepEqual(
    parseDiscoveryOptions(["-c", "config/clients.ts", "--json", "local"]),
    expected
  );
});

test("forwards every argument after --stdio unchanged to the subprocess", () => {
  assert.deepEqual(
    parseDiscoveryOptions([
      "--json",
      "--stdio",
      "node",
      "server.js",
      "--help",
      "--json",
      "a b",
      "",
    ]),
    {
      json: true,
      help: false,
      stdio: {
        command: "node",
        args: ["server.js", "--help", "--json", "a b", ""],
      },
    }
  );
});

test("rejects missing, ambiguous, and unknown arguments before connecting", () => {
  for (const args of [
    [],
    ["--json"],
    ["--stdio"],
    ["--stdio", "--json"],
    ["a", "b"],
    ["a", "--stdio", "node"],
    ["a", "--clients"],
    ["a", "-c", "--json"],
    ["a", "--typo"],
  ]) {
    assert.throws(
      () => parseDiscoveryOptions(args),
      Error,
      JSON.stringify(args)
    );
  }
  assert.equal(parseDiscoveryOptions(["--help"]).help, true);
});
