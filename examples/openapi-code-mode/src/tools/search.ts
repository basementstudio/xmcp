import { z } from "zod";
import type { ToolMetadata } from "xmcp";
import { runInSandbox } from "@xmcp-dev/sandbox";
import { loadSpec } from "../utils/openapi-loader";

const SPEC_URL = "https://petstore3.swagger.io/api/v3/openapi.json";

export const schema = {
  code: z.string().describe(
    "JavaScript code to search the API spec. " +
      "Available global: `spec` (JSON string of the full OpenAPI spec). " +
      "Parse with `JSON.parse(spec)`, then filter/map paths. " +
      "Example: `const s = JSON.parse(spec); return Object.keys(s.paths).slice(0, 5)`"
  ),
};

export const metadata: ToolMetadata = {
  name: "search",
  description:
    "Search API endpoints by writing JavaScript code that queries the OpenAPI spec. " +
    "The `spec` global contains the full API specification as a JSON string. " +
    "Parse it with JSON.parse(spec) and use standard JavaScript to filter, map, and explore endpoints.",
  annotations: { readOnlyHint: true },
};

export default async function search({ code }: { code: string }) {
  let specJson: string;
  try {
    specJson = await loadSpec(SPEC_URL);
  } catch (e: any) {
    return {
      content: [
        { type: "text", text: `Failed to load API spec: ${e.message}` },
      ],
      isError: true,
    };
  }

  const result = await runInSandbox(code, {
    globals: { spec: specJson },
    timeoutMs: 10000,
  });

  if (!result.success) {
    return {
      content: [{ type: "text", text: result.error! }],
      isError: true,
    };
  }

  return JSON.stringify(result.data, null, 2);
}
