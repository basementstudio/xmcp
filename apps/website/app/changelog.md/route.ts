import { SITE_URL } from "@/lib/base-url";
import { estimateTokens } from "@/lib/estimate-tokens";
import { formatReleaseDate, getReleases } from "@/lib/releases";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  const text = [
    "# xmcp Changelog",
    "> New features, improvements, and fixes in every stable xmcp release.",
    ...getReleases().map((release) =>
      [
        `## v${release.version}`,
        `${formatReleaseDate(release.publishedAt)} · [View on GitHub](${release.url})`,
        release.body.trim() ? release.body : "No release notes provided.",
      ].join("\n\n")
    ),
  ].join("\n\n");
  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      Link: `<${SITE_URL}/changelog>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(text)),
    },
  });
}
