import { z } from "zod";
import { runInSandbox } from "./sandbox.js";
import { SEARCH_HELPERS } from "./helpers.js";
import type {
  SearchToolConfig,
  ExecuteToolConfig,
  ToolModule,
} from "./types.js";

// Spec cache shared across all searchTool instances
const specCache = new Map<string, string>();

async function loadSpec(url: string): Promise<string> {
  const cached = specCache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to load spec from ${url}: ${res.status} ${res.statusText}`
    );
  }

  const text = await res.text();
  specCache.set(url, text);
  return text;
}

/**
 * Create a pre-configured search tool for Code Mode.
 *
 * Returns a complete xmcp tool module (schema, metadata, handler).
 * The handler loads the OpenAPI spec, injects it as a `spec` global,
 * and runs agent code in a Vercel Sandbox.
 *
 * @example
 * ```typescript
 * // src/tools/search.ts
 * import { searchTool } from "@xmcp-dev/sandbox";
 * const search = searchTool({ url: "https://petstore3.swagger.io/api/v3/openapi.json" });
 * export const schema = search.schema;
 * export const metadata = search.metadata;
 * export default search.handler;
 * ```
 */
export function searchTool(config: SearchToolConfig): ToolModule {
  const {
    url,
    timeoutMs = 10000,
    networkPolicy = "deny-all",
    helpers = true,
  } = config;

  const helpersDesc = helpers
    ? "Available helpers: `search(query)` for fuzzy text search, " +
      "`filter({ method?, tag?, path? })` for structured filtering, " +
      "`endpoints` array of all parsed endpoints. "
    : "";

  return {
    schema: {
      code: z
        .string()
        .describe(
          "JavaScript code to search the API spec. " +
            "Available global: `spec` (JSON string of the full OpenAPI spec). " +
            helpersDesc +
            "Example: `return search('pet')` or `return filter({ method: 'GET', tag: 'pet' })` " +
            "or raw: `const s = JSON.parse(spec); return Object.keys(s.paths)`"
        ),
    },

    metadata: {
      name: "search",
      description:
        "Search API endpoints by writing JavaScript code. " +
        (helpers
          ? "Built-in helpers: search(query) for fuzzy search, filter({ method, tag, path }) for structured filtering, endpoints array for all parsed endpoints. "
          : "") +
        "The raw `spec` global is always available for custom queries.",
    },

    handler: async ({ code }: { code: string }) => {
      let specJson: string;
      try {
        specJson = await loadSpec(url);
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: `Failed to load API spec: ${e.message}` },
          ],
          isError: true,
        };
      }

      // Prepend helper functions if enabled
      const fullCode = helpers ? `${SEARCH_HELPERS}\n${code}` : code;

      const result = await runInSandbox(fullCode, {
        globals: { spec: specJson },
        networkPolicy,
        timeoutMs,
      });

      if (!result.success) {
        return {
          content: [{ type: "text", text: result.error! }],
          isError: true,
        };
      }

      return JSON.stringify(result.data, null, 2);
    },
  };
}

/**
 * Create a pre-configured execute tool for Code Mode.
 *
 * Returns a complete xmcp tool module (schema, metadata, handler).
 * The handler injects `url` as a global and forwards specified
 * env vars into the sandbox. Agent code uses `fetch()` directly.
 *
 * @example
 * ```typescript
 * // src/tools/execute.ts
 * import { executeTool } from "@xmcp-dev/sandbox";
 * const execute = executeTool({
 *   url: "https://petstore3.swagger.io/api/v3",
 *   networkPolicy: { allow: ["petstore3.swagger.io"] },
 * });
 * export const schema = execute.schema;
 * export const metadata = execute.metadata;
 * export default execute.handler;
 * ```
 */
export function executeTool(config: ExecuteToolConfig): ToolModule {
  const {
    url,
    env: envKeys = [],
    networkPolicy,
    timeoutMs = 30000,
    packages,
  } = config;

  return {
    schema: {
      code: z
        .string()
        .describe(
          "JavaScript code to execute API calls. " +
            "Available global: `url` (API base URL). " +
            (envKeys.length
              ? `Environment variables available via process.env: ${envKeys.join(", ")}. `
              : "") +
            "Use fetch() directly to make HTTP requests. " +
            "Supports chaining multiple await calls. " +
            `Example: \`const res = await fetch(url + '/pet/1'); return await res.json()\``
        ),
    },

    metadata: {
      name: "execute",
      description:
        "Execute API calls by writing JavaScript code in an isolated sandbox. " +
        "Use fetch() with the injected `url` global. " +
        "Supports chaining multiple await calls, loops, and Promise.all. " +
        "Use the search tool first to discover endpoints and their parameters.",
    },

    handler: async ({ code }: { code: string }) => {
      // Forward specified env vars from host to sandbox
      const env: Record<string, string> = {};
      for (const key of envKeys) {
        if (process.env[key]) {
          env[key] = process.env[key]!;
        }
      }

      const result = await runInSandbox(code, {
        globals: { url },
        env: Object.keys(env).length > 0 ? env : undefined,
        networkPolicy,
        timeoutMs,
        packages,
      });

      if (!result.success) {
        return {
          content: [{ type: "text", text: result.error! }],
          isError: true,
        };
      }

      return JSON.stringify(result.data, null, 2);
    },
  };
}
