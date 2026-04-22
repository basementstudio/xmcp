import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  url: z.string().url().describe("Upstream URL to proxy"),
};

export const metadata: ToolMetadata = {
  name: "fetch-proxy",
  description: "Proxy a request to the given upstream URL",
  annotations: {
    title: "Fetch Proxy",
    readOnlyHint: true,
  },
};

export default async function fetchProxy(
  { url }: InferSchema<typeof schema>,
  extra: { authInfo?: { token?: string } }
) {
  try {
    // `fetch(userUrl)` — SSRF. Triggers XMCP-HANDLER-004
    // Forwards caller's Authorization. Triggers XMCP-HANDLER-007
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${extra.authInfo?.token}` },
    });
    return await response.text();
  } catch (err) {
    // Returns raw error message. Triggers XMCP-HANDLER-009
    return `upstream failed: ${(err as Error).message}`;
  }
}
