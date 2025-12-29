export function getBaseUrl(): string {
  const domain =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "localhost:3000";

  return domain.startsWith("localhost")
    ? `http://${domain}`
    : `https://${domain}`;
}
