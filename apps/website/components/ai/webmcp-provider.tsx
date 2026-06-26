"use client";

import { useEffect } from "react";

/**
 * WebMCP browser integration.
 *
 * Exposes the site's key actions as Web Model Context tools so in-browser AI
 * agents (and agent-readiness scanners) can discover and call them via
 * `navigator.modelContext` / `document.modelContext`.
 *
 * WebMCP is not natively available in most browsers yet, so we load the
 * `@mcp-b/global` polyfill. Importing it auto-installs the API on `document`
 * and `navigator` (same instance) and steps aside when a browser ships native
 * support. `initializeWebModelContext()` is idempotent and SSR-guarded.
 *
 * Tool `execute` handlers reuse existing same-origin endpoints, so there are no
 * new API routes: `search_docs` hits `/api/search`, `get_doc` uses the
 * `Accept: text/markdown` content negotiation already wired in `next.config.ts`.
 *
 * Spec: https://webmachinelearning.github.io/webmcp/
 */

type WebMCPContent = { type: "text"; text: string };
type WebMCPToolResult = { content: WebMCPContent[]; isError?: boolean };

type WebMCPToolAnnotations = {
  title?: string;
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  openWorldHint?: boolean;
};

type WebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: WebMCPToolAnnotations;
  execute: (
    args: Record<string, unknown>
  ) => WebMCPToolResult | Promise<WebMCPToolResult>;
};

type WebMCPModelContext = {
  registerTool: (
    tool: WebMCPTool,
    options?: { signal?: AbortSignal }
  ) => void | Promise<void>;
};

function textResult(text: string): WebMCPToolResult {
  return { content: [{ type: "text", text }] };
}

function errorResult(text: string): WebMCPToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDocSlug(path: string): string | null {
  const raw = path.trim();
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(raw) ||
    raw.includes("?") ||
    raw.includes("#")
  ) {
    return null;
  }

  const slug = raw
    .replace(/^\/+/, "")
    .replace(/^docs\/?/, "")
    .replace(/\.(md|mdx)$/, "")
    .replace(/\/+$/, "");

  if (!slug) return "";

  const segments = slug.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        !/^[a-z0-9-]+$/.test(segment)
    )
  ) {
    return null;
  }

  return segments.join("/");
}

type SearchResult = { url: string; content: string; type: string };

const TOOLS: WebMCPTool[] = [
  {
    name: "search_docs",
    title: "Search xmcp documentation",
    description:
      "Full-text search across the xmcp documentation. Returns a ranked list of matching pages with their titles and URLs. Use get_doc to read a result.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search terms, e.g. 'http transport' or 'api key auth'.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    async execute(args) {
      const query = asString(args.query);
      if (!query) return errorResult("Provide a non-empty `query`.");

      const res = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) return errorResult(`Search failed (HTTP ${res.status}).`);

      const results = (await res.json()) as SearchResult[];

      // The index returns page + heading + text rows; collapse to unique pages,
      // preferring the page-level row's content as the title.
      const pages = new Map<string, string>();
      for (const r of results) {
        const path = r.url.split("#")[0];
        if (r.type === "page") pages.set(path, r.content);
        else if (!pages.has(path)) pages.set(path, path);
      }

      const top = Array.from(pages.entries()).slice(0, 10);
      if (top.length === 0) return textResult(`No results for "${query}".`);

      const list = top
        .map(([url, title], i) => `${i + 1}. ${title} — ${url}`)
        .join("\n");
      return textResult(`Found ${top.length} page(s) for "${query}":\n${list}`);
    },
  },
  {
    name: "get_doc",
    title: "Read an xmcp documentation page",
    description:
      "Fetch the full Markdown of a docs page. Pass a docs path like 'core-concepts/tools' or '/docs/core-concepts/tools'. Omit `path` for the documentation index.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Docs page path (slug). A leading '/docs/' is optional. Empty for the index.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    async execute(args) {
      const raw = asString(args.path);
      const slug = normalizeDocSlug(raw);

      if (slug === null) {
        return errorResult(
          "Provide a docs path such as 'core-concepts/tools' or '/docs/core-concepts/tools'."
        );
      }

      // Empty slug -> docs index. Otherwise the public docs URL with an
      // Accept: text/markdown header, which next.config.ts rewrites to the
      // markdown route.
      const target = slug ? `/docs/${slug}` : "/llms.txt";
      const res = await fetch(target, { headers: { accept: "text/markdown" } });
      if (!res.ok) {
        return errorResult(
          `No doc found for "${raw || "index"}" (HTTP ${res.status}).`
        );
      }
      return textResult(await res.text());
    },
  },
  {
    name: "navigate",
    title: "Navigate to a page on xmcp.dev",
    description:
      "Navigate the current browser tab to a same-origin path on the xmcp site, e.g. '/docs/core-concepts/tools' or '/templates'. Only same-origin paths are allowed.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Same-origin path beginning with '/'. External URLs are rejected.",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    // Performs a real navigation, so it is not read-only.
    annotations: { readOnlyHint: false },
    execute(args) {
      const raw = asString(args.path);
      if (!raw) return errorResult("Provide a `path`.");

      let resolved: URL;
      try {
        resolved = new URL(raw, window.location.origin);
      } catch {
        return errorResult(`Invalid path: "${raw}".`);
      }
      if (resolved.origin !== window.location.origin) {
        return errorResult(`Refused: "${raw}" is not same-origin.`);
      }

      const dest = resolved.pathname + resolved.search + resolved.hash;
      window.location.assign(dest);
      return textResult(`Navigating to ${dest}.`);
    },
  },
];

function resolveModelContext(): WebMCPModelContext | undefined {
  const fromDocument = (
    document as Document & { modelContext?: WebMCPModelContext }
  ).modelContext;
  if (typeof fromDocument?.registerTool === "function") return fromDocument;

  const fromNavigator = (
    navigator as Navigator & { modelContext?: WebMCPModelContext }
  ).modelContext;
  if (typeof fromNavigator?.registerTool === "function") return fromNavigator;

  return undefined;
}

export function WebMCPProvider() {
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      // Dynamic import keeps the polyfill (and its browser-only dependency
      // graph) out of the server render pass.
      const { initializeWebModelContext } = await import("@mcp-b/global");
      if (cancelled) return;

      initializeWebModelContext();

      const ctx = resolveModelContext();
      if (!ctx) return;

      try {
        for (const tool of TOOLS) {
          await Promise.resolve(
            ctx.registerTool(tool, { signal: controller.signal })
          );
        }
      } catch (error) {
        console.warn("[WebMCP] Failed to register tools", error);
      }
    })();

    // Aborting unregisters the tools (AbortSignal-driven) on unmount.
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return null;
}
