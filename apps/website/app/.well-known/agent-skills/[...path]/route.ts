import { notFound } from "next/navigation";
import { listSkillFiles, readSkillFile } from "@/lib/agent-skills";

// Serves each skill's SKILL.md and references/* so the relative links inside a
// SKILL.md resolve. The sibling `index.json` static segment takes precedence
// over this catch-all. Prerendered from the committed skill files.
export const dynamic = "force-static";
export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const content = readSkillFile(path);
  if (content === null) notFound();

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function generateStaticParams() {
  return listSkillFiles().map((segments) => ({ path: segments }));
}
