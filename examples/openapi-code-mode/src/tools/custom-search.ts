import { z } from "zod";
import type { ToolMetadata } from "xmcp";
import { runInSandbox } from "@xmcp-dev/sandbox";

const SPEC_URL = "https://petstore3.swagger.io/api/v3/openapi.json";
let cachedSpec: string | null = null;

async function loadSpec(): Promise<string> {
  if (cachedSpec) return cachedSpec;
  const res = await fetch(SPEC_URL);
  if (!res.ok) throw new Error(`Failed to load spec: ${res.status}`);
  cachedSpec = await res.text();
  return cachedSpec;
}

export const schema = {
  code: z
    .string()
    .describe(
      "JavaScript code to search the API spec. " +
        "Available global: `spec` (JSON string). " +
        "Parse with JSON.parse(spec), then filter/map. " +
        "Example: `const s = JSON.parse(spec); return Object.keys(s.paths)`"
    ),
};

export const metadata: ToolMetadata = {
  name: "custom-search",
  description:
    "Search API endpoints with JavaScript (custom implementation using runInSandbox). " +
    "Same as the search tool but built manually to show the raw API.",
};

export default async function customSearch({ code }: { code: string }) {
  // 1. Load spec (custom logic — you can load from file, DB, private API, etc.)
  let specJson: string;
  try {
    specJson = await loadSpec();
  } catch (e: any) {
    return {
      content: [
        { type: "text", text: `Failed to load API spec: ${e.message}` },
      ],
      isError: true,
    };
  }

  // 2. Run agent code in sandbox (full control over options)
  const result = await runInSandbox(code, {
    globals: { spec: specJson },
    timeoutMs: 10000,
    networkPolicy: "deny-all", // search is data-only, no network needed
  });

  // 3. Handle result (custom error handling, logging, transformation, etc.)
  if (!result.success) {
    return {
      content: [{ type: "text", text: result.error! }],
      isError: true,
    };
  }

  return JSON.stringify(result.data, null, 2);
}
