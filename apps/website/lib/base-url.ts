/**
 * Canonical production origin. Use for canonical URLs and structured data so
 * those always point at production, never a preview/localhost deployment.
 * `getBaseUrl()` remains for deployment-relative URLs (e.g. OG images).
 */
export const SITE_URL = "https://xmcp.dev";

export function getBaseUrl(): string {
  const domain =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "localhost:3000";

  return domain.startsWith("localhost")
    ? `http://${domain}`
    : `https://${domain}`;
}
