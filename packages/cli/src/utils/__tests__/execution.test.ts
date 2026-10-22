import assert from "node:assert/strict";
import { test } from "node:test";
import { CliInputError, parseExecutionOptions } from "../execution-options.js";
import {
  parseArgumentObject,
  parseAssignments,
  validatePromptArguments,
  validateToolArguments,
} from "../execution-arguments.js";

test("execution options preserve STDIO args and accept each input source", () => {
  const options = parseExecutionOptions("call", [
    "add",
    "--arg",
    "a=1",
    "--json",
    "--stdio",
    "node",
    "server.js",
    "--arg",
    "child=value",
    "--stdin",
  ]);
  assert.equal(options.component, "add");
  assert.deepEqual(options.arguments, ["a=1"]);
  assert.deepEqual(options.stdio, {
    command: "node",
    args: ["server.js", "--arg", "child=value", "--stdin"],
  });
  assert.equal(
    parseExecutionOptions("call", ["local", "add", "--args-file", "args.json"])
      .argsFile,
    "args.json"
  );
  assert.equal(
    parseExecutionOptions("call", ["local", "add", "--stdin"]).stdin,
    true
  );
  assert.equal(
    parseExecutionOptions("get-prompt", [
      "--clients",
      "config.ts",
      "local",
      "greet",
    ]).clientsFile,
    "config.ts"
  );
  assert.equal(parseExecutionOptions("call", ["--help"]).help, true);
  assert.equal(
    parseExecutionOptions("read-resource", ["local", "fixture://info"])
      .component,
    "fixture://info"
  );
});

test("execution options reject missing names and conflicting sources", () => {
  for (const args of [
    [],
    ["local"],
    ["local", "add", "extra"],
    ["local", "add", "--arg", "bad"],
    ["local", "add", "--args-file"],
    ["local", "add", "--arg", "a=1", "--stdin"],
    ["local", "add", "--args-file", "-", "--stdin"],
    ["local", "add", "--bad"],
    ["local", "add", "--stdio", "node"],
  ])
    assert.throws(() => parseExecutionOptions("call", args), CliInputError);
  assert.throws(
    () =>
      parseExecutionOptions("read-resource", [
        "local",
        "fixture://info",
        "--arg",
        "id=1",
      ]),
    CliInputError
  );
});

test("argument values retain JSON types and prompt strings without prototype mutation", () => {
  assert.deepEqual(
    parseAssignments(
      [
        "a=2",
        "active=true",
        'nested={"ids":[1,null]}',
        'numericString="123"',
        "text=a=b",
        "empty=",
      ],
      false
    ),
    {
      a: 2,
      active: true,
      nested: { ids: [1, null] },
      numericString: "123",
      text: "a=b",
      empty: "",
    }
  );
  assert.deepEqual(parseAssignments(["name=123", "enabled=false"], true), {
    name: "123",
    enabled: "false",
  });
  assert.throws(() => parseAssignments(["a=1", "a=2"], false), CliInputError);
  const special = parseAssignments(['__proto__={"injected":true}'], false);
  assert.equal(Object.getPrototypeOf(special), Object.prototype);
  assert.ok(Object.hasOwn(special, "__proto__"));
  for (const json of ["", "{", "null", "[]", '"text"'])
    assert.throws(() => parseArgumentObject(json), CliInputError);
});

test("tool validation enforces constraints and references without coercing or dropping values", async () => {
  const schema = {
    type: "object",
    properties: {
      count: { $ref: "#/$defs/count" },
      nested: {
        type: "object",
        properties: { ok: { const: true } },
        required: ["ok"],
      },
    },
    required: ["count", "nested"],
    additionalProperties: false,
    $defs: { count: { type: "integer", minimum: 1 } },
  };
  const args = { count: 2, nested: { ok: true } };
  await validateToolArguments(schema, args);
  assert.deepEqual(args, { count: 2, nested: { ok: true } });
  for (const value of [
    { count: "2", nested: { ok: true } },
    { count: 0, nested: { ok: true } },
    { count: 1.5, nested: { ok: true } },
    { count: 2 },
    { count: 2, nested: { ok: false } },
    { ...args, extra: true },
  ])
    await assert.rejects(validateToolArguments(schema, value), CliInputError);
});

test("prompt validation requires advertised names and string values", () => {
  const definitions = [{ name: "name", required: true }, { name: "optional" }];
  assert.deepEqual(validatePromptArguments(definitions, { name: "123" }), {
    name: "123",
  });
  for (const args of [{}, { name: 123 }, { name: "Ada", unexpected: "x" }])
    assert.throws(
      () => validatePromptArguments(definitions, args),
      CliInputError
    );
});
