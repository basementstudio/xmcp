import type { TemplateItem } from "./github";
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

type DeployProviderConfig = {
  label: string;
  buildHref: (template: TemplateItem) => string;
};

const DEPLOY_PROVIDER_CONFIG = {
  vercel: {
    label: PROVIDER_MAP.vercel,
    buildHref: buildVercelCloneUrl,
  },
  alpic: {
    label: PROVIDER_MAP.alpic,
    buildHref: buildAlpicCloneUrl,
  },
} satisfies Record<"vercel" | "alpic", DeployProviderConfig>;

export function buildDeployOptions(template: TemplateItem): DeployOption[] {
  const options: DeployOption[] = Object.entries(DEPLOY_PROVIDER_CONFIG).map(
    ([provider, config]) => ({
      label: config.label,
      href: config.buildHref(template),
      provider: provider as keyof typeof DEPLOY_PROVIDER_CONFIG,
    })
  );

  options.push({
    label: "Replit",
    href: template.replitUrl ?? "#",
    provider: "replit",
    disabled: !template.replitUrl,
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
