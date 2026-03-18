import type { ExampleItem } from "./github";
import type { DeployOption, DeployProvider } from "@/components/examples/deploy-dropdown";

type DeployProviderConfig = {
  label: string;
  buildHref: (example: ExampleItem) => string;
};

const DEPLOY_PROVIDER_CONFIG = {
  vercel: {
    label: "Vercel",
    buildHref: buildVercelCloneUrl,
  },
  alpic: {
    label: "Alpic",
    buildHref: buildAlpicCloneUrl,
  },
  replit: {
    label: "Replit",
    buildHref: buildReplitCloneUrl,
  },
} satisfies Record<"vercel" | "alpic" | "replit", DeployProviderConfig>;

export function buildDeployOptions(example: ExampleItem): DeployOption[] {
  const options: DeployOption[] = Object.entries(DEPLOY_PROVIDER_CONFIG).map(
    ([provider, config]) => ({
      label: config.label,
      href: config.buildHref(example),
      provider: provider as keyof typeof DEPLOY_PROVIDER_CONFIG,
    })
  );

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

  if (host.includes("vercel")) return "vercel";
  if (host.includes("alpic")) return "alpic";
  if (host.includes("replit")) return "replit";
  if (host.includes("netlify")) return "netlify";
  if (host.includes("railway")) return "railway";
  if (host.includes("render")) return "render";
  if (host.includes("cloudflare")) return "cloudflare";
  return "other";
}

function getProviderLabel(provider: DeployProvider) {
  switch (provider) {
    case "vercel":
      return "Vercel";
    case "alpic":
      return "Alpic";
    case "replit":
      return "Replit";
    case "netlify":
      return "Netlify";
    case "railway":
      return "Railway";
    case "render":
      return "Render";
    case "cloudflare":
      return "Cloudflare";
    default:
      return "Provider";
  }
}
