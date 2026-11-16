import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { Client, ProtocolError } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { McpAuthorize } from "@/types/mcp-middleware";
import { registerWithMcpMiddleware } from "../mcp-middleware";
import type { ComponentsConfig } from "../../../config";
import type { SkillDefinition } from "../../../types/skill";
import { addSkillsToServer, SKILLS_EXTENSION } from "../skills";

function skill(name: string, extraFile = false): SkillDefinition {
  const text = `---\nname: ${name}\ndescription: Skill ${name}\n---\n`;
  return {
    uri: `skill://${name}/SKILL.md`,
    frontmatter: { name, description: `Skill ${name}` },
    files: [
      {
        uri: `skill://${name}/SKILL.md`,
        mimeType: "text/markdown",
        digest: `sha256:${"a".repeat(64)}`,
        size: text.length,
        text,
      },
      ...(extraFile
        ? [
            {
              uri: `skill://${name}/assets/data.bin`,
              mimeType: "application/octet-stream",
              digest: `sha256:${"b".repeat(64)}`,
              size: 2,
              blob: "AP8=",
            },
          ]
        : []),
    ],
  };
}

async function connect(
  t: TestContext,
  skills: SkillDefinition[],
  components?: ComponentsConfig,
  authorize?: McpAuthorize
) {
  const server = new McpServer({ name: "skills", version: "1" });
  server.registerResource("plain", "plain://resource", {}, () => ({
    contents: [{ uri: "plain://resource", text: "plain" }],
  }));
  registerWithMcpMiddleware(
    server,
    [],
    (authorizeSkill) => {
      addSkillsToServer(server, skills, components, undefined, authorizeSkill);
    },
    authorize
  );
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

const result = z.object({}).passthrough();
const list = (client: Client, cursor?: string) =>
  client.request(
    { method: "skills/list", params: cursor ? { cursor } : {} },
    result
  ) as Promise<{
    skills: { uri: string; resources: unknown[] }[];
    nextCursor?: string;
    ttlMs: number;
    cacheScope: string;
  }>;

const rejectsWithInvalidParams = (promise: Promise<unknown>) =>
  assert.rejects(promise, (error) => {
    assert.ok(error instanceof ProtocolError);
    assert.equal(error.code, -32602);
    return true;
  });

test("servers without skills declare no extension or skills methods", async (t) => {
  const client = await connect(t, []);
  assert.equal(client.getServerCapabilities()?.extensions, undefined);
  await assert.rejects(list(client), /Method not found/);
});

test("skills are listed, fetched and readable as resources", async (t) => {
  const client = await connect(t, [skill("alpha", true), skill("beta")]);
  assert.deepEqual(client.getServerCapabilities()?.extensions, {
    [SKILLS_EXTENSION]: {},
  });

  const listed = await list(client);
  assert.equal(listed.nextCursor, undefined);
  assert.equal(listed.ttlMs, 0);
  assert.equal(listed.cacheScope, "private");
  assert.deepEqual(listed.skills[0], {
    uri: "skill://alpha/SKILL.md",
    frontmatter: { name: "alpha", description: "Skill alpha" },
    resources: [
      {
        uri: "skill://alpha/SKILL.md",
        digest: `sha256:${"a".repeat(64)}`,
        size: 45,
      },
      {
        uri: "skill://alpha/assets/data.bin",
        digest: `sha256:${"b".repeat(64)}`,
        size: 2,
      },
    ],
  });

  const fetched = await client.request(
    { method: "skills/get", params: { uri: "skill://beta/SKILL.md" } },
    result
  );
  assert.deepEqual(fetched.skill, listed.skills[1]);
  await rejectsWithInvalidParams(
    client.request(
      {
        method: "skills/get",
        params: { uri: "skill://alpha/assets/data.bin" },
      },
      result
    )
  );
  await rejectsWithInvalidParams(
    client.request(
      { method: "skills/get", params: { uri: "skill://missing/SKILL.md" } },
      result
    )
  );

  const { resources } = await client.listResources();
  assert.deepEqual(
    resources.find(({ uri }) => uri === "skill://alpha/SKILL.md"),
    {
      uri: "skill://alpha/SKILL.md",
      name: "alpha",
      description: "Skill alpha",
      mimeType: "text/markdown",
    }
  );
  assert.deepEqual(
    (await client.readResource({ uri: "skill://alpha/assets/data.bin" }))
      .contents,
    [
      {
        uri: "skill://alpha/assets/data.bin",
        mimeType: "application/octet-stream",
        blob: "AP8=",
      },
    ]
  );
});

test("skills/list pages through a large catalog without splitting or repeating entries", async (t) => {
  const skills = Array.from({ length: 120 }, (_, index) =>
    skill(`skill-${String(index).padStart(3, "0")}`)
  );
  const client = await connect(t, skills);

  const uris: string[] = [];
  const pageSizes: number[] = [];
  let cursor: string | undefined;
  do {
    const page = await list(client, cursor);
    pageSizes.push(page.skills.length);
    uris.push(...page.skills.map(({ uri }) => uri));
    cursor = page.nextCursor;
  } while (cursor);

  assert.deepEqual(pageSizes, [50, 50, 20]);
  assert.deepEqual(
    uris,
    skills.map(({ uri }) => uri)
  );
  for (const invalid of ["not-a-cursor", btoa("0"), btoa("120"), btoa("1.5")]) {
    await rejectsWithInvalidParams(list(client, invalid));
  }
});

test("component rules hide skills by name", async (t) => {
  const client = await connect(t, [skill("alpha"), skill("beta")], {
    exclude: { names: ["beta"] },
  });
  assert.deepEqual(
    (await list(client)).skills.map(({ uri }) => uri),
    ["skill://alpha/SKILL.md"]
  );
  await assert.rejects(
    client.readResource({ uri: "skill://beta/SKILL.md" }),
    /not found/i
  );

  const hidden = await connect(t, [skill("alpha")], {
    include: { names: ["other"] },
  });
  assert.equal(hidden.getServerCapabilities()?.extensions, undefined);
});

test("skill authorization filters before pagination and matches missing get errors", async (t) => {
  const skills = Array.from({ length: 120 }, (_, i) =>
    skill(`skill-${i}`, true)
  );
  const seen = new Set<string>();
  let allow = true;
  const client = await connect(
    t,
    skills,
    undefined,
    (ctx, component, operation) => {
      assert.equal(component.type, "resource");
      if (component.type !== "resource") return false;
      assert.ok(component.uri.endsWith("/SKILL.md"));
      assert.equal(component.metadata.description, `Skill ${component.name}`);
      seen.add(`${ctx.method}:${operation}`);
      return allow && Number(component.name.split("-")[1]) % 2 === 0;
    }
  );
  const first = await list(client);
  const second = await list(client, first.nextCursor);
  assert.deepEqual([first.skills.length, second.skills.length], [50, 10]);
  assert.equal(second.nextCursor, undefined);
  assert.deepEqual(
    [...first.skills, ...second.skills].map((s) => s.uri),
    skills.filter((_, i) => i % 2 === 0).map((s) => s.uri)
  );
  const get = (uri: string) =>
    client.request({ method: "skills/get", params: { uri } }, result);
  assert.ok((await get(skills[0].uri)).skill);
  async function error(uri: string) {
    try {
      await get(uri);
    } catch (e) {
      const { code, message, data } = e as ProtocolError;
      return { code, message, data };
    }
    assert.fail("Expected denied skill");
  }
  const missing = await error("skill://missing/SKILL.md");
  assert.deepEqual(await error(skills[1].uri), {
    ...missing,
    message: missing.message.replace("skill://missing/SKILL.md", skills[1].uri),
  });
  assert.deepEqual([...seen], ["skills/list:list", "skills/get:read"]);
  allow = false;
  assert.deepEqual((await list(client)).skills, []);
  await rejectsWithInvalidParams(get(skills[0].uri));
});

test("skill authorization fails closed and surfaces policy exceptions", async (t) => {
  const denied = await connect(
    t,
    [skill("alpha")],
    undefined,
    () => undefined as unknown as boolean
  );
  assert.deepEqual((await list(denied)).skills, []);
  const failing = await connect(t, [skill("alpha")], undefined, () => {
    throw new Error("skill policy failed");
  });
  await assert.rejects(list(failing), /skill policy failed/);
  await assert.rejects(
    failing.request(
      { method: "skills/get", params: { uri: "skill://alpha/SKILL.md" } },
      result
    ),
    /skill policy failed/
  );
});
