export function getBaseUrl(): string {
  if (process.env.VERCEL_ENV === "production") {
    return "https://xmcp.dev";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://xmcp.dev";
}
