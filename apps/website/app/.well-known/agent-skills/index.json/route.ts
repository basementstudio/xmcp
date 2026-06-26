import { digest, listSkills, readSkillMarkdown } from "@/lib/agent-skills";

/** Schema identifier for the Agent Skills Discovery RFC v0.2.0 index. */
const SCHEMA_URL = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

// Fully derived from committed skill files, so it can be prerendered.
export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  const skills = listSkills().map((skill) => ({
    name: skill.name,
    type: "skill-md" as const,
    // Path-absolute per RFC 3986 §5 — resolves against the index URL, so it
    // works the same on production, previews, and localhost.
    url: `/.well-known/agent-skills/${skill.dir}/SKILL.md`,
    description: skill.description,
    digest: digest(readSkillMarkdown(skill.dir)),
  }));

  return Response.json(
    { $schema: SCHEMA_URL, skills },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
