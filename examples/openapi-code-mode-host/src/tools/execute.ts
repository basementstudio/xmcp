import { z } from "zod";
import type { ToolMetadata } from "xmcp";
import { runInSandbox } from "@xmcp-dev/sandbox";

const BASE_URL =
  process.env.API_BASE_URL || "https://petstore3.swagger.io/api/v3";
const API_KEY = process.env.API_KEY || "";

export const schema = {
  code: z.string().describe(
    "JavaScript code to execute API calls. " +
      "Available globals: `get(path)`, `post(path, body)`, `put(path, body)`, `del(path)`. " +
      "All return JSON strings. Parse results with JSON.parse(). " +
      "Supports chaining multiple await calls. " +
      "Example: `return JSON.parse(await get('/pet/findByStatus?status=available'))`"
  ),
};

export const metadata: ToolMetadata = {
  name: "execute",
  description:
    "Execute API calls by writing JavaScript code. " +
    "Available async functions: get(path), post(path, body), put(path, body), del(path). " +
    "Each returns a JSON string. Supports chaining multiple calls. " +
    "Use the search tool first to discover endpoints and their parameters.",
  annotations: { openWorldHint: true },
};

async function makeRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<string> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return await res.text();
}

export default async function execute({ code }: { code: string }) {
  if (!BASE_URL) {
    return {
      content: [
        { type: "text", text: "API_BASE_URL not configured. Set it in .env" },
      ],
      isError: true,
    };
  }

  // Using "host" engine — supports full async chaining, no native deps.
  // Trade-off: weaker isolation (scoped params only, not a separate VM).
  const result = await runInSandbox(code, {
    engine: "host",
    globals: [
      {
        name: "get",
        type: "function",
        fn: async (path: unknown) => makeRequest("GET", String(path)),
      },
      {
        name: "post",
        type: "function",
        fn: async (path: unknown, body: unknown) =>
          makeRequest("POST", String(path), body),
      },
      {
        name: "put",
        type: "function",
        fn: async (path: unknown, body: unknown) =>
          makeRequest("PUT", String(path), body),
      },
      {
        name: "del",
        type: "function",
        fn: async (path: unknown) => makeRequest("DELETE", String(path)),
      },
    ],
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
