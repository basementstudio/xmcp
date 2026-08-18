import { estimateTokens } from "../../lib/estimate-tokens";
import { SITE_URL } from "../../lib/base-url";

export const revalidate = false;

// Hand-authored markdown twin of the homepage. The visual homepage is
// component-driven, so this file is the plain-text entity description that
// answer engines can read and cite.
const HOMEPAGE_MD = `# xmcp — The TypeScript MCP framework

> xmcp is a framework for building and shipping MCP servers with TypeScript. Designed with DX in mind, it simplifies setup and removes friction in just one command — making it easy to build & deploy AI tools on top of the Model Context Protocol ecosystem.

xmcp automatically registers tools, prompts, and resources from your project files. It supports HTTP and STDIO transports and ships with authentication integrations, deployment adapters for existing Next.js and Express apps, and monetization plugins.

Get started:

\`\`\`bash
npx create-xmcp-app@latest
\`\`\`

## Key pages

- [Documentation](${SITE_URL}/docs): guides for getting started, configuration, authentication, adapters, and deployment
- [Blog](${SITE_URL}/blog): guides, release notes, and engineering articles
- [Templates](${SITE_URL}/templates): production-ready MCP server templates to fork and deploy
- [Showcase](${SITE_URL}/showcase): MCP servers built with xmcp
- [FAQ](${SITE_URL}/faq): common questions about xmcp, MCP, transports, auth, deployment, and monetization

## Markdown mirrors

Append \`.md\` to any docs or blog URL for a markdown version of that page, or send \`Accept: text/markdown\` to the HTML URL.

- [llms.txt](${SITE_URL}/llms.txt): index of all docs, blog posts, and templates
- [llms-full.txt](${SITE_URL}/llms-full.txt): complete documentation content in one file
- [faq.md](${SITE_URL}/faq.md): frequently asked questions in markdown

## Source

- [GitHub](https://github.com/basementstudio/xmcp)
- [npm](https://www.npmjs.com/package/xmcp)

Built by [basement.studio](https://basement.studio).
`;

export function GET() {
  return new Response(HOMEPAGE_MD, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // This route is the markdown half of Accept-based content negotiation,
      // so caches must key on Accept to avoid mixing it with the HTML page.
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      // The HTML homepage stays the sole indexable URL.
      Link: `<${SITE_URL}/>; rel="canonical"`,
      "x-markdown-tokens": String(estimateTokens(HOMEPAGE_MD)),
    },
  });
}
