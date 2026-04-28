import { source } from "./source";
import type { InferPageType } from "fumadocs-core/source";

const OAUTH_PLUGINS_MD = [
  "- [Auth0](/docs/integrations/auth0)",
  "- [Better Auth](/docs/integrations/better-auth)",
  "- [Clerk](/docs/integrations/clerk)",
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
