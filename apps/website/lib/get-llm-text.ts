import { blogSource, source } from "./source";
import type { InferPageType } from "fumadocs-core/source";

const OAUTH_PLUGINS_MD = [
  "- [Auth0](/docs/integrations/auth0)",
  "- [Better Auth](/docs/integrations/better-auth)",
  "- [Clerk](/docs/integrations/clerk)",
  "- [Scalekit](/docs/integrations/scalekit)",
  "- [WorkOS](/docs/integrations/workos)",
].join("\n");

const MONETIZATION_PLUGINS_MD = [
  "- [Polar](/docs/integrations/polar) — License keys",
  "- [x402](/docs/integrations/x402) — USDC on Base",
].join("\n");

const MCP_CLIENTS_MD = [
  "- Cursor",
  "- Claude Code",
  "- Claude Desktop",
  "- Windsurf",
  "- Gemini CLI",
  "- Codex",
].join("\n");

function expandComponents(md: string): string {
  return md
    .replace(/<OAuthPlugins\s*\/>/g, OAUTH_PLUGINS_MD)
    .replace(/<MonetizationPlugins\s*\/>/g, MONETIZATION_PLUGINS_MD)
    .replace(/<McpConnect[^/]*\/>/g, `Supported clients:\n\n${MCP_CLIENTS_MD}`);
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})

${expandComponents(processed)}`;
}

function blockquote(text: string): string {
  return text
    .trim()
    .split("\n")
    .map((line) => `> ${line}`.trimEnd())
    .join("\n");
}

// These regexes run over the whole document, including fenced code blocks.
// None of the expanded tags appear inside blog code fences today; if a new
// component ever does, switch to a fence-aware splitter before expanding.
function expandBlogComponents(md: string): string {
  return md
    .replace(
      /<Callout([^>]*)>([\s\S]*?)<\/Callout>/g,
      (_, attrs: string, children: string) => {
        const title = attrs.match(/title="([^"]*)"/)?.[1];
        return blockquote(
          title ? `**${title}**\n${children.trim()}` : children
        );
      }
    )
    .replace(/<Video[^>]*?src="([^"]*)"[^>]*?\/>/g, "[Video]($1)")
    .replace(
      /<TerminalPrompt>\s*\{\s*("(?:[^"\\]|\\.)*")\s*\}\s*<\/TerminalPrompt>/g,
      (match, literal: string) => {
        try {
          const text = JSON.parse(literal) as string;
          return ["```", text.trimEnd(), "```"].join("\n");
        } catch {
          return match;
        }
      }
    )
    .replace(/<OAuthPlugins\s*\/>/g, OAUTH_PLUGINS_MD);
}

export async function getBlogLLMText(page: InferPageType<typeof blogSource>) {
  const processed = await page.data.getText("processed");

  const header = [`# ${page.data.title} (${page.url})`];
  if (page.data.date) header.push(`Published: ${page.data.date}`);
  if (page.data.description) header.push(page.data.description);

  return `${header.join("\n\n")}

${expandBlogComponents(processed)}`;
}
