import { z } from "zod";
import type { ToolMetadata } from "xmcp";
import { runInSandbox } from "@xmcp-dev/sandbox";

export const schema = {
  code: z.string().describe(
    "JavaScript code to execute API calls. " +
      "Available global: `baseUrl` (API base URL). " +
      "Auth token available via process.env.API_KEY. " +
      "Use fetch() directly to make HTTP requests. " +
      "Example: `const res = await fetch(baseUrl + '/pet/1'); return await res.json()`"
  ),
};

export const metadata: ToolMetadata = {
  name: "execute",
  description:
    "Execute API calls by writing JavaScript code in an isolated sandbox. " +
    "Use fetch() with the injected `baseUrl` global. Auth via process.env.API_KEY. " +
    "Supports chaining multiple await calls, loops, and Promise.all. " +
    "Use the search tool first to discover endpoints and their parameters.",
  annotations: { openWorldHint: true },
};

export default async function execute({ code }: { code: string }) {
  const baseUrl =
    process.env.API_BASE_URL || "https://petstore3.swagger.io/api/v3";

  const result = await runInSandbox(code, {
    globals: { baseUrl },
    env: {
      ...(process.env.API_KEY ? { API_KEY: process.env.API_KEY } : {}),
    },
    networkPolicy: { allow: ["petstore3.swagger.io"] },
    timeoutMs: 30000,
  });

  if (!result.success) {
    return {
      content: [{ type: "text", text: result.error! }],
      isError: true,
    };
  }

  return JSON.stringify(result.data, null, 2);
}
