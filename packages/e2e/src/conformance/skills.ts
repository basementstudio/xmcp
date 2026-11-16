import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { ProtocolError } from "@modelcontextprotocol/client";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { CLIENT_INFO, REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";
import type { Target } from "../harness/target.js";
import {
  SKILL_FRONTMATTER,
  SKILL_URIS,
  SKILLS_EXTENSION,
} from "../fixtures/skills.js";

const skillSchema = z.object({
  uri: z.string(),
  frontmatter: z
    .object({ name: z.string(), description: z.string() })
    .passthrough(),
  resources: z.array(
    z
      .object({
        uri: z.string(),
        digest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
        size: z.number().int().nonnegative(),
      })
      .strict()
  ),
});
const cacheable = {
  ttlMs: z.number(),
  cacheScope: z.enum(["public", "private"]),
};
const listSchema = z
  .object({
    skills: z.array(skillSchema),
    nextCursor: z.string().optional(),
    ...cacheable,
  })
  .passthrough();
const getSchema = z.object({ skill: skillSchema, ...cacheable }).passthrough();

function listSkills({ client }: Target) {
  return client.request(
    { method: "skills/list", params: {} },
    listSchema,
    REQUEST_OPTIONS
  );
}

function getSkill({ client }: Target, uri: string) {
  return client.request(
    { method: "skills/get", params: { uri } },
    getSchema,
    REQUEST_OPTIONS
  );
}

async function readBytes({ client }: Target, uri: string) {
  const { contents } = await client.readResource({ uri }, REQUEST_OPTIONS);
  assert.equal(contents.length, 1);
  const [content] = contents;
  assert.equal(content.uri, uri);
  const bytes =
    "text" in content
      ? Buffer.from(content.text, "utf8")
      : Buffer.from(content.blob, "base64");
  return { content, bytes };
}

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);

  whenSupported(
    "skills",
    "declares the Skills extension with the resources capability",
    async ({ client }) => {
      // Legacy mode reads these from initialize, auto mode from server/discover.
      const capabilities = client.getServerCapabilities();
      assert.deepEqual(capabilities?.extensions?.[SKILLS_EXTENSION], {});
      assert.ok(capabilities?.resources);
    }
  );

  whenSupported(
    "skills",
    "lists every visible skill with a complete manifest and cache fields",
    async (target) => {
      const result = await listSkills(target);
      assert.equal(result.nextCursor, undefined);
      assert.equal(result.ttlMs, 0);
      assert.equal(result.cacheScope, "private");
      assert.deepEqual(
        result.skills.map(({ uri }) => uri),
        ["skill://fixture-skill/SKILL.md", "skill://second-skill/SKILL.md"]
      );
      assert.deepEqual(
        result.skills.flatMap(({ resources }) =>
          resources.map(({ uri }) => uri)
        ),
        SKILL_URIS
      );
      assert.deepEqual(result.skills[0].frontmatter, SKILL_FRONTMATTER);
      for (const { uri, frontmatter } of result.skills) {
        assert.equal(uri, `skill://${frontmatter.name}/SKILL.md`);
      }
    }
  );

  whenSupported(
    "skills",
    "stamps skills results as complete on the modern wire",
    async ({ url }) => {
      // The SDK client consumes resultType, so inspect the raw response.
      if (!url) return;
      const call = async (method: string, params: Record<string, unknown>) => {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            "MCP-Protocol-Version": "2026-07-28",
            "Mcp-Method": method,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params: {
              ...params,
              _meta: {
                "io.modelcontextprotocol/protocolVersion": "2026-07-28",
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
                "io.modelcontextprotocol/clientCapabilities": {},
              },
            },
          }),
          signal: AbortSignal.timeout(REQUEST_OPTIONS.timeout),
        });
        assert.equal(response.status, 200);
        return (await response.json()).result;
      };
      const discovered = await call("server/discover", {});
      assert.deepEqual(
        discovered.capabilities.extensions[SKILLS_EXTENSION],
        {}
      );
      for (const result of [
        await call("skills/list", {}),
        await call("skills/get", { uri: "skill://fixture-skill/SKILL.md" }),
      ]) {
        assert.equal(result.resultType, "complete");
        assert.equal(result.ttlMs, 0);
        assert.equal(result.cacheScope, "private");
      }
    }
  );

  whenSupported(
    "skills",
    "gets one skill and rejects URIs that are not a served SKILL.md",
    async (target) => {
      const { skills } = await listSkills(target);
      const result = await getSkill(target, "skill://fixture-skill/SKILL.md");
      assert.deepEqual(result.skill, skills[0]);
      assert.equal(result.ttlMs, 0);
      assert.equal(result.cacheScope, "private");

      for (const uri of [
        "skill://unknown-skill/SKILL.md",
        "skill://fixture-skill/assets/pixel.bin",
        "skill://fixture-skill",
        "skill://visibility-by-name/SKILL.md",
      ]) {
        await assert.rejects(getSkill(target, uri), (error) => {
          assert.ok(error instanceof ProtocolError);
          assert.equal(error.code, -32602);
          return true;
        });
      }
    }
  );

  whenSupported(
    "skills",
    "reads every listed file back with the published size and digest",
    async (target) => {
      const { skills } = await listSkills(target);
      for (const { resources } of skills) {
        for (const { uri, digest, size } of resources) {
          const { bytes } = await readBytes(target, uri);
          assert.equal(bytes.byteLength, size, uri);
          assert.equal(
            `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
            digest,
            uri
          );
        }
      }
      const binary = await readBytes(
        target,
        "skill://fixture-skill/assets/pixel.bin"
      );
      assert.ok("blob" in binary.content);
      assert.deepEqual(
        [...binary.bytes],
        [0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0xfe]
      );
    }
  );

  whenSupported(
    "skills",
    "serves SKILL.md as markdown whose frontmatter equals the entry",
    async (target) => {
      const { resources } = await target.client.listResources(
        {},
        REQUEST_OPTIONS
      );
      const { skills } = await listSkills(target);
      for (const { uri, frontmatter } of skills) {
        const listed = resources.find((resource) => resource.uri === uri);
        assert.equal(listed?.name, frontmatter.name);
        assert.equal(listed?.description, frontmatter.description);
        assert.equal(listed?.mimeType, "text/markdown");

        const { content } = await readBytes(target, uri);
        assert.equal(content.mimeType, "text/markdown");
        assert.ok("text" in content);
        const source = /^---\n([\s\S]*?)\n---\n/.exec(content.text);
        assert.ok(source, uri);
        assert.deepEqual(parseYaml(source[1]), frontmatter);
      }
      for (const uri of SKILL_URIS) {
        assert.ok(
          resources.some((resource) => resource.uri === uri),
          uri
        );
      }
    }
  );

  whenSupported(
    "skills",
    "hides the files of skills excluded by component visibility",
    async ({ client }) => {
      await assert.rejects(
        client.readResource(
          { uri: "skill://visibility-by-name/SKILL.md" },
          REQUEST_OPTIONS
        ),
        /not found/i
      );
    }
  );
}
