import type { TemplateItem } from "./content";
import type {
  DeployOption,
  DeployProvider,
} from "@/components/templates/deploy-dropdown";

const PROVIDER_MAP = {
  vercel: "Vercel",
  alpic: "Alpic",
  replit: "Replit",
  netlify: "Netlify",
  railway: "Railway",
  render: "Render",
  cloudflare: "Cloudflare",
} as const satisfies Record<string, string>;

type MappedProvider = keyof typeof PROVIDER_MAP;

// Every provider in the docs' Deployment section, in the same order. Vercel
// and Alpic clone the template directly; Replit uses the template's own remix
// link when it has one. The rest have no clone URL, so they open the docs guide.
const DEPLOY_PROVIDERS = [
  "vercel",
  "cloudflare",
  "alpic",
  "replit",
  "railway",
  "render",
] as const satisfies readonly MappedProvider[];

const guide = (provider: MappedProvider) => `/docs/deployment/${provider}`;

export function buildDeployOptions(template: TemplateItem): DeployOption[] {
  if (template.deployment === "none") return [];

  const options: DeployOption[] = DEPLOY_PROVIDERS.map((provider) => {
    const label = PROVIDER_MAP[provider];
    if (template.deployment === "guides") {
      return { label, provider, href: guide(provider), guide: true };
    }
    if (provider === "vercel") {
      return { label, provider, href: buildVercelCloneUrl(template) };
    }
    if (provider === "alpic") {
      return { label, provider, href: buildAlpicCloneUrl(template) };
    }
    if (provider === "replit" && template.replitUrl) {
      return { label, provider, href: template.replitUrl };
    }
    return { label, provider, href: guide(provider), guide: true };
  });

  if (template.deployUrl) {
    const provider = getProviderFromUrl(template.deployUrl);
    const hrefs = new Set(options.map((option) => option.href));

    if (!hrefs.has(template.deployUrl)) {
      options.push({
        label: getProviderLabel(provider),
        href: template.deployUrl,
        provider,
      });
    }
  }

  return options;
}

function buildVercelCloneUrl(template: TemplateItem) {
  return buildCloneUrl(
    "https://vercel.com/new/clone",
    "repository-url",
    template
  );
}

function buildAlpicCloneUrl(template: TemplateItem) {
  return buildCloneUrl(
    "https://app.alpic.ai/new/clone",
    "repositoryUrl",
    template
  );
}

function buildCloneUrl(
  baseUrl: string,
  paramName: string,
  template: TemplateItem
) {
  const folderPath = template.path.replace(/^\/+/, "");
  const repoWithBranch = `https://github.com/${template.sourceRepo}/tree/${template.sourceBranch}/${folderPath}`;
  const search = new URLSearchParams({
    [paramName]: repoWithBranch,
  });

  return `${baseUrl}?${search.toString()}`;
}

function getProviderFromUrl(url: string): DeployProvider {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  return (
    (Object.keys(PROVIDER_MAP) as MappedProvider[]).find((key) =>
      host.includes(key)
    ) ?? "other"
  );
}

function getProviderLabel(provider: DeployProvider) {
  return PROVIDER_MAP[provider as MappedProvider] ?? "Provider";
}
