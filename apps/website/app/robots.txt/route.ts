import { SITE_URL } from "@/lib/base-url";

export function GET() {
  return new Response(
    `User-Agent: *
Content-Signal: ai-train=no, search=yes, ai-input=no
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}
