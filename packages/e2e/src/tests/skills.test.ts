import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test, type TestContext } from "node:test";
import { pathToFileURL } from "node:url";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { z } from "zod";
import { createClient, REQUEST_OPTIONS } from "../harness/client-options.js";
import { FIXTURE_TIMEOUT_MS } from "../harness/constants.js";
import {
  createFixture,
  REPO_ROOT,
  type Fixture,
  type FixtureSpec,
} from "../harness/fixture.js";
import { runCommand } from "../harness/process.js";
import type { Target } from "../harness/target.js";
import { startHttpTarget } from "../harness/targets/http.js";
import { SKILL_URIS, SKILLS_EXTENSION } from "../fixtures/skills.js";

const anyResult = z.object({}).passthrough();

function retainOnFailure(context: TestContext, fixture: Fixture) {
  let passed = false;
  context.after(async () => {
    if (passed) await fixture.dispose();
    else context.diagnostic(`Retained failed fixture: ${fixture.directory}`);
  });
  return () => {
    passed = true;
  };
}

test(
  "does not declare the Skills extension or its methods without skills",
  { timeout: FIXTURE_TIMEOUT_MS },
  async (context) => {
    const fixture = await createFixture({
      kind: "http",
      moduleType: "module",
      capabilities: [],
      configFragment: "paths: { skills: false },",
    });
    const markPassed = retainOnFailure(context, fixture);
    // Legacy mode covers initialize; auto mode covers server/discover.
    for (const mode of ["legacy", "auto"] as const) {
      let target: Target | undefined;
      try {
        target = await startHttpTarget(fixture, mode);
        const capabilities = target.client.getServerCapabilities();
        assert.equal(capabilities?.extensions, undefined, mode);
        assert.ok(capabilities?.resources, mode);
        await assert.rejects(
          target.client.request(
            { method: "skills/list", params: {} },
            anyResult,
            REQUEST_OPTIONS
          ),
          (error) => {
            // The SDK client reports a legacy HTTP "method not found" under
            // its own code.
            assert.ok(
              [-32601, "CLIENT_HTTP_NOT_IMPLEMENTED"].includes(
                (error as { code: number | string }).code
              ),
              `${mode}: ${String(error)}`
            );
            return true;
          }
        );
        const { resources } = await target.client.listResources(
          {},
          REQUEST_OPTIONS
        );
        assert.ok(resources.every(({ uri }) => !uri.startsWith("skill://")));
      } finally {
        await target?.close();
      }
    }
    markPassed();
  }
);

for (const [name, files, message, configFragment] of [
  [
    "a name that does not match its directory",
    {
      "src/skills/fixture-skill/SKILL.md":
        "---\nname: another-name\ndescription: Mismatched\n---\n",
    },
    /frontmatter name "another-name" must equal its directory name "fixture-skill"/,
    undefined,
  ],
  [
    "a skill directory without SKILL.md in an explicit skills path",
    { "src/skills/incomplete/references/guide.md": "# Guide\n" },
    /src\/skills\/incomplete has no SKILL\.md/,
    'paths: { skills: "src/skills" },',
  ],
] satisfies [
  string,
  FixtureSpec["files"],
  RegExp,
  FixtureSpec["configFragment"],
][]) {
  test(
    `fails the build for ${name}`,
    { timeout: FIXTURE_TIMEOUT_MS },
    async () => {
      let failure: Error | undefined;
      try {
        const fixture = await createFixture({
          kind: "http",
          moduleType: "module",
          files,
          configFragment,
        });
        await fixture.dispose();
      } catch (error) {
        failure = error as Error;
      }
      assert.ok(failure, "The build should have failed");
      assert.match(failure.message, message);
      // A failed build keeps its directory for diagnostics; this one is expected.
      const log = /See (.+build\.log)/.exec(failure.message);
      assert.ok(log);
      await rm(dirname(log[1]), { recursive: true, force: true });
    }
  );
}

test(
  "serves skills from a Cloudflare Workers build without filesystem access",
  { timeout: FIXTURE_TIMEOUT_MS },
  async (context) => {
    const fixture = await createFixture({
      kind: "http",
      moduleType: "module",
      capabilities: [],
      // Several shared fixture components need Node.js, so the worker is
      // built from the skills and one portable tool, without type-checking
      // the unused sources.
      files: {
        "worker/tools/ping.ts": `export const metadata = { name: "ping", description: "Reply with pong" };
export default function ping() { return "pong"; }
`,
        "src/middleware.ts": "export {};\n",
      },
      configFragment: `paths: { tools: "worker/tools", prompts: false, resources: false },
        typescript: { skipTypeCheck: true },`,
    });
    const markPassed = retainOnFailure(context, fixture);
    await runCommand(
      process.execPath,
      [join(REPO_ROOT, "packages/xmcp/dist/cli.js"), "build", "--cf"],
      fixture.directory,
      join(fixture.directory, "build-cloudflare.log")
    );
    // The worker must answer from its own bundle, so the sources are removed.
    await rm(join(fixture.directory, "src/skills"), { recursive: true });

    const worker = (
      await import(pathToFileURL(join(fixture.directory, "worker.js")).href)
    ).default as {
      fetch(request: Request, env: object, ctx: object): Promise<Response>;
    };
    const executionContext = {
      waitUntil() {},
      passThroughOnException() {},
    };
    const client = createClient("auto");
    context.after(() => client.close());
    await client.connect(
      new StreamableHTTPClientTransport(new URL("http://worker.test/mcp"), {
        fetch: (input, init) =>
          worker.fetch(new Request(input, init), {}, executionContext),
      })
    );

    assert.deepEqual(
      client.getServerCapabilities()?.extensions?.[SKILLS_EXTENSION],
      {}
    );
    const { skills } = (await client.request(
      { method: "skills/list", params: {} },
      anyResult,
      REQUEST_OPTIONS
    )) as {
      skills: { resources: { uri: string; digest: string; size: number }[] }[];
    };
    const resources = skills.flatMap((skill) => skill.resources);
    assert.deepEqual(
      resources.map(({ uri }) => uri),
      SKILL_URIS
    );
    for (const { uri, digest, size } of resources) {
      const [content] = (await client.readResource({ uri }, REQUEST_OPTIONS))
        .contents;
      const bytes =
        "text" in content
          ? Buffer.from(content.text, "utf8")
          : Buffer.from(content.blob, "base64");
      assert.equal(bytes.byteLength, size, uri);
      assert.equal(
        `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
        digest,
        uri
      );
    }
    markPassed();
  }
);
