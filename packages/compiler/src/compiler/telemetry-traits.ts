import fs from "fs";
import path from "path";
import type { XmcpConfigOutputSchema } from "@/runtime-config";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export type DeployTarget = "vercel" | "cloudflare" | "none";

const PACKAGE_MANAGERS = ["pnpm", "yarn", "bun", "npm"] as const;

const LOCKFILES: Record<string, PackageManager> = {
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "bun.lock": "bun",
  "bun.lockb": "bun",
  "package-lock.json": "npm",
};

const OFFICIAL_PLUGINS = [
  "auth0",
  "better-auth",
  "billing",
  "clerk",
  "coinbase",
  "commet",
  "descope",
  "polar",
  "scalekit",
  "sentry",
  "supabase",
  "upstash",
  "workos",
  "x402",
] as const;

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? "";
  const fromUserAgent = PACKAGE_MANAGERS.find((name) =>
    userAgent.startsWith(`${name}/`)
  );
  if (fromUserAgent) {
    return fromUserAgent;
  }

  const lockfile = Object.keys(LOCKFILES).find((file) =>
    fs.existsSync(path.join(process.cwd(), file))
  );
  return lockfile ? LOCKFILES[lockfile] : "unknown";
}

export function getDeployTarget(platforms: {
  vercel?: boolean;
  cloudflare?: boolean;
}): DeployTarget {
  if (platforms.vercel) {
    return "vercel";
  }
  return platforms.cloudflare ? "cloudflare" : "none";
}

function readInstalledPackageNames(): Set<string> {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")
    );
    return new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ]);
  } catch {
    return new Set();
  }
}

export function collectFeatures(
  xmcpConfig: XmcpConfigOutputSchema,
  hasMiddleware: boolean
): string[] {
  const installed = readInstalledPackageNames();
  const enabled: Record<string, boolean> = {
    http: !!xmcpConfig.http,
    stdio: !!xmcpConfig.stdio,
    middleware: hasMiddleware,
    "custom-bundler": !!xmcpConfig.bundler,
    observability: !!xmcpConfig.observability?.enabled,
    "component-filter": !!xmcpConfig.components,
  };

  return [
    ...Object.keys(enabled).filter((feature) => enabled[feature]),
    ...OFFICIAL_PLUGINS.filter((plugin) =>
      installed.has(`@xmcp-dev/${plugin}`)
    ).map((plugin) => `plugin:${plugin}`),
  ];
}
