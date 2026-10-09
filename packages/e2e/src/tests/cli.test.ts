import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { LEGACY_CLI_SERVER } from "../fixtures/cli-discovery.js";
import { runDeveloperCli } from "../harness/developer-cli.js";
import { E2E_ROOT } from "../harness/fixture.js";
import { startProcess } from "../harness/process.js";

async function fixture(context: TestContext) {
  await mkdir(join(E2E_ROOT, ".work"), { recursive: true });
  const directory = await mkdtemp(join(E2E_ROOT, ".work/cli-"));
  await writeFile(join(directory, "server.cjs"), LEGACY_CLI_SERVER);
  let passed = false;
  context.after(async () => {
    if (!passed)
      context.diagnostic(`Retained failed CLI fixture: ${directory}`);
    else await rm(directory, { recursive: true, force: true });
  });
  return { directory, markPassed: () => (passed = true) };
}

for (const transport of ["http", "stdio"] as const) {
  test(`built CLI executes against legacy ${transport} peers and distinguishes invalid input`, async (context) => {
    const { directory, markPassed } = await fixture(context);
    let server: ReturnType<typeof startProcess> | undefined;
    const results: Awaited<ReturnType<typeof runDeveloperCli>>[] = [];
    try {
      let connection: string[] = [];
      const subprocess =
        transport === "stdio"
          ? ["--stdio", process.execPath, "server.cjs", "stdio"]
          : [];
      if (transport === "http") {
        server = startProcess(
          process.execPath,
          ["server.cjs", "http"],
          directory,
          join(directory, "server.log")
        );
        connection = [(await server.waitForOutput(/E2E_READY (\S+)/))[1]];
      }
      const run = async (
        command: string,
        component: string,
        options: string[],
        label: string,
        input?: string
      ) => {
        const result = await runDeveloperCli(
          [command, ...connection, component, ...options, ...subprocess],
          directory,
          label,
          input
        );
        results.push(result);
        return result;
      };
      const args = {
        count: 2,
        nested: { items: [true, null] },
        text: "Hello 🌎",
      };
      await writeFile(join(directory, "args.json"), JSON.stringify(args));
      for (const [label, flags, input] of [
        ["file", ["--args-file", "args.json"], undefined],
        ["stdin", ["--stdin"], JSON.stringify(args)],
        ["dash", ["--args-file", "-"], JSON.stringify(args)],
        ["pipe", [], JSON.stringify(args)],
      ] as const) {
        const result = await run("call", "tool-2", [...flags], label, input);
        assert.equal(result.code, 0, result.stderr);
        assert.deepEqual(JSON.parse(result.stdout), {
          content: [
            { type: "text", text: "done" },
            { type: "image", data: "aGk=", mimeType: "image/png" },
          ],
          structuredContent: args,
          _meta: { fixture: true },
        });
      }
      const prompt = await run(
        "get-prompt",
        "prompt-2",
        ["--arg", "name=123"],
        "prompt"
      );
      assert.equal(prompt.code, 0, prompt.stderr);
      assert.deepEqual(JSON.parse(prompt.stdout), {
        description: "Fixture prompt",
        messages: [
          { role: "user", content: { type: "text", text: "123" } },
          { role: "assistant", content: { type: "text", text: "response" } },
        ],
        _meta: { fixture: true },
      });
      const resource = await run(
        "read-resource",
        "fixture://1",
        [],
        "resource"
      );
      assert.equal(resource.code, 0, resource.stderr);
      assert.deepEqual(JSON.parse(resource.stdout), {
        contents: [
          { uri: "fixture://1", text: "text", mimeType: "text/plain" },
          {
            uri: "fixture://blob",
            blob: "aGk=",
            mimeType: "application/octet-stream",
          },
        ],
        _meta: { fixture: true },
      });
      const toolError = await run("call", "tool-1", [], "tool-error");
      assert.equal(toolError.code, 1);
      assert.deepEqual(JSON.parse(toolError.stdout), {
        isError: true,
        content: [{ type: "text", text: "Application failure" }],
        _meta: { fixture: true },
      });

      const callsBeforeInvalid = await readFile(
        join(directory, "calls.log"),
        "utf8"
      );
      for (const [label, command, component, flags, input, message] of [
        [
          "schema",
          "call",
          "tool-2",
          ["--arg", "count=0"],
          undefined,
          /Invalid tool arguments/,
        ],
        ["required", "call", "tool-2", [], undefined, /Invalid tool arguments/],
        ["json", "call", "tool-2", ["--stdin"], "{", /valid JSON/],
        ["array", "call", "tool-2", ["--stdin"], "[]", /JSON object/],
        ["empty", "call", "tool-2", ["--stdin"], "", /valid JSON/],
        [
          "missing-file",
          "call",
          "tool-2",
          ["--args-file", "missing.json"],
          undefined,
          /Cannot read argument file/,
        ],
        [
          "prompt-type",
          "get-prompt",
          "prompt-2",
          ["--stdin"],
          '{"name":123}',
          /must be a string/,
        ],
        [
          "prompt-required",
          "get-prompt",
          "prompt-2",
          [],
          undefined,
          /Missing prompt argument/,
        ],
      ] as const) {
        const result = await run(command, component, [...flags], label, input);
        assert.equal(result.code, 2, result.stderr);
        assert.equal(result.stdout, "");
        assert.match(result.stderr, message);
      }
      assert.equal(
        await readFile(join(directory, "calls.log"), "utf8"),
        callsBeforeInvalid,
        "invalid arguments must not invoke a tool"
      );
      const rpcError = await run(
        "call",
        "tool-2",
        ["--arg", "count=1", "--arg", "remoteFailure=true"],
        "rpc-error"
      );
      assert.equal(rpcError.code, 1);
      assert.equal(rpcError.stdout, "");
      assert.match(rpcError.stderr, /Remote execution failed/);
      const missingResource = await run(
        "read-resource",
        "fixture://missing",
        [],
        "missing-resource"
      );
      assert.equal(missingResource.code, 1);
      assert.equal(missingResource.stdout, "");
      if (transport === "stdio") {
        for (const result of results) {
          const match = result.stderr.match(/fixture pid=(\d+)/);
          if (match)
            assert.throws(() => process.kill(Number(match[1]), 0), {
              code: "ESRCH",
            });
        }
        assert.match(toolError.stderr, /fixture pid=/);
      }
    } finally {
      await server?.stop();
    }
    markPassed();
  });

  test(`built CLI discovers paginated legacy ${transport} servers`, async (context) => {
    const { directory, markPassed } = await fixture(context);
    let server: ReturnType<typeof startProcess> | undefined;
    try {
      let target: string[];
      if (transport === "http") {
        server = startProcess(
          process.execPath,
          ["server.cjs", "http"],
          directory,
          join(directory, "server.log")
        );
        const ready = await server.waitForOutput(/E2E_READY (\S+)/);
        target = [ready[1]];
      } else
        target = [
          "--stdio",
          process.execPath,
          "server.cjs",
          "stdio",
          "normal",
          "--help",
          "--json",
          "a b",
        ];
      const inspect = await runDeveloperCli(
        ["inspect", "--json", ...target],
        directory,
        "inspect"
      );
      assert.equal(inspect.code, 0, inspect.stderr);
      const details = JSON.parse(inspect.stdout);
      assert.equal(details.protocolVersion, "2025-11-25");
      assert.equal(details.serverInfo.name, "legacy-fixture");
      if (transport === "stdio")
        assert.deepEqual(JSON.parse(details.instructions), [
          "--help",
          "--json",
          "a b",
        ]);
      const listed = await runDeveloperCli(
        ["list", "--json", ...target],
        directory,
        "list"
      );
      assert.equal(listed.code, 0, listed.stderr);
      const catalog = JSON.parse(listed.stdout);
      for (const [key, prefix] of [
        ["tools", "tool"],
        ["prompts", "prompt"],
        ["resources", "resource"],
        ["resourceTemplates", "template"],
      ]) {
        assert.deepEqual(
          catalog[key].map((item: { name: string }) => item.name),
          [`${prefix}-1`, `${prefix}-2`]
        );
      }
      const text = await runDeveloperCli(
        ["list", ...target],
        directory,
        "text"
      );
      assert.equal(text.code, 0, text.stderr);
      assert.match(text.stdout, /Tools \(2\)/);
      assert.match(text.stdout, /Resource templates \(2\)/);
      if (transport === "stdio") {
        for (const output of [inspect, listed, text]) {
          const pid = Number(output.stderr.match(/fixture pid=(\d+)/)?.[1]);
          assert.ok(pid);
          assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
        }
      }
    } finally {
      await server?.stop();
    }
    markPassed();
  });
}

test("CLI loads the default config, reports empty catalogs, and cleans up failures", async (context) => {
  const { directory, markPassed } = await fixture(context);
  await mkdir(join(directory, "src"));
  await writeFile(
    join(directory, "src/clients.ts"),
    `console.log("config diagnostic");\nexport const clients = { empty: { command: ${JSON.stringify(process.execPath)}, args: ["server.cjs", "stdio", "empty"] } };\n`
  );
  const empty = await runDeveloperCli(
    ["list", "empty", "--json"],
    directory,
    "empty"
  );
  assert.equal(empty.code, 0, empty.stderr);
  assert.match(empty.stderr, /config diagnostic/);
  assert.deepEqual(JSON.parse(empty.stdout), {
    tools: [],
    prompts: [],
    resources: [],
    resourceTemplates: [],
  });

  for (const [name, args, message] of [
    ["unknown", ["list", "missing", "--json"], /Unknown client/],
    [
      "spawn",
      ["inspect", "--json", "--stdio", "xmcp-nonexistent-e2e-command"],
      /ENOENT|not found/,
    ],
    [
      "listing",
      [
        "list",
        "--json",
        "--stdio",
        process.execPath,
        "server.cjs",
        "stdio",
        "fail",
      ],
      /fixture listing failed/,
    ],
    ["invalid", ["inspect", "--json", "--bad-flag"], /Unknown option/],
  ] as const) {
    const failed = await runDeveloperCli([...args], directory, name);
    assert.notEqual(failed.code, 0);
    assert.equal(failed.stdout, "");
    assert.match(failed.stderr, message);
    if (name === "listing") {
      const pid = Number(failed.stderr.match(/fixture pid=(\d+)/)?.[1]);
      assert.ok(pid);
      assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
    }
  }
  markPassed();
});

test("CLI install exports named clients without resolving environment references or launching servers", async (context) => {
  const { directory, markPassed } = await fixture(context);
  const source = join(directory, "clients.ts");
  await writeFile(
    source,
    `console.log("install config diagnostic");\nexport const clients = ${JSON.stringify(
      {
        remote: {
          url: "https://example.test/mcp/${PATH}",
          headers: [{ name: "Authorization", env: "PATH" }],
        },
        local: {
          command: "xmcp-install-must-not-spawn",
          args: ["--help", "a b", "${PATH}"],
          env: { TOKEN: "${PATH}" },
        },
      }
    )};\n`
  );
  const remote = await runDeveloperCli(
    ["install", "remote", "--clients", source],
    directory,
    "install-generic"
  );
  assert.equal(remote.code, 0, remote.stderr);
  assert.match(remote.stderr, /install config diagnostic/);
  assert.deepEqual(JSON.parse(remote.stdout), {
    mcpServers: {
      remote: {
        url: "https://example.test/mcp/${PATH}",
        headers: { Authorization: "${PATH}" },
      },
    },
  });

  const destination = join(directory, "mcp.json");
  const args = [
    "install",
    "local",
    "--clients",
    source,
    "--client",
    "claude-desktop",
    "--config",
    destination,
  ];
  const local = await runDeveloperCli(args, directory, "install-stdio");
  assert.equal(local.code, 0, local.stderr);
  const written = await readFile(destination, "utf8");
  assert.deepEqual(JSON.parse(written).mcpServers.local, {
    command: "xmcp-install-must-not-spawn",
    args: ["--help", "a b", "${PATH}"],
    env: { TOKEN: "${PATH}" },
  });
  const repeated = await runDeveloperCli(args, directory, "install-repeat");
  assert.equal(repeated.code, 0, repeated.stderr);
  assert.match(repeated.stderr, /Unchanged/);
  assert.equal(await readFile(destination, "utf8"), written);
  const conflict = await runDeveloperCli(
    [
      "install",
      "https://example.test/mcp",
      "--name",
      "local",
      "--config",
      destination,
    ],
    directory,
    "install-conflict"
  );
  assert.notEqual(conflict.code, 0);
  assert.equal(conflict.stdout, "");
  assert.match(conflict.stderr, /--replace/);
  assert.equal(await readFile(destination, "utf8"), written);
  markPassed();
});
