import type { ExampleItem } from "./github";
import type { DeployOption, DeployProvider } from "@/components/examples/deploy-dropdown";

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
  buildHref: (example: ExampleItem) => string;
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

export function buildDeployOptions(example: ExampleItem): DeployOption[] {
  const options: DeployOption[] = Object.entries(DEPLOY_PROVIDER_CONFIG).map(
    ([provider, config]) => ({
      label: config.label,
      href: config.buildHref(example),
      provider: provider as keyof typeof DEPLOY_PROVIDER_CONFIG,
    })
  );

  options.push({
    label: "Replit",
    href: example.replitUrl ?? "#",
    provider: "replit",
    disabled: !example.replitUrl,
  });

  if (example.deployUrl) {
    const provider = getProviderFromUrl(example.deployUrl);
    const hrefs = new Set(options.map((option) => option.href));

    if (!hrefs.has(example.deployUrl)) {
      options.push({
        label: getProviderLabel(provider),
        href: example.deployUrl,
        provider,
      });
    }
  }

  return options;
}

function buildVercelCloneUrl(example: ExampleItem) {
  return buildCloneUrl(
    "https://vercel.com/new/clone",
    "repository-url",
    example
  );
}

function buildAlpicCloneUrl(example: ExampleItem) {
  return buildCloneUrl("https://app.alpic.ai/new/clone", "repositoryUrl", example);
}

function buildReplitCloneUrl(example: ExampleItem) {
  return buildCloneUrl("https://replit.com/github", "url", example);
}

function buildCloneUrl(
  baseUrl: string,
  paramName: string,
  example: ExampleItem
) {
  const folderPath = example.path.replace(/^\/+/, "");
  const repoWithBranch = `https://github.com/${example.sourceRepo}/tree/${example.sourceBranch}/${folderPath}`;
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

  return (Object.keys(PROVIDER_MAP) as MappedProvider[]).find((key) => host.includes(key)) ?? "other";
}

function getProviderLabel(provider: DeployProvider) {
  return PROVIDER_MAP[provider as MappedProvider] ?? "Provider";
}
