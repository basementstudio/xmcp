// ─── ProvidePlugin (module exports wired from .xmcp/import-map.js) ────────────

declare const INJECTED_TOOLS: Record<
  string,
  () => Promise<import("../runtime/utils/server").ToolFile>
>;

declare const INJECTED_PROMPTS: Record<
  string,
  () => Promise<import("../runtime/utils/server").PromptFile>
>;

declare const INJECTED_RESOURCES: Record<
  string,
  () => Promise<import("../runtime/utils/server").ResourceFile>
>;

declare const INJECTED_MIDDLEWARE:
  | (() => Promise<{
      default?:
        | import("./middleware").Middleware
        | import("./middleware").Middleware[]
        | import("./middleware").WebMiddleware
        | import("./middleware").WebMiddleware[];
    }>)
  | undefined;

// ─── DefinePlugin — config objects ────────────────────────────────────────────

declare const HTTP_CONFIG: Omit<
  NonNullable<import("../config").ResolvedHttpConfig>,
  "cors"
>;

declare const HTTP_CORS_CONFIG: import("../config").CorsConfig;

declare const TEMPLATE_CONFIG: import("../config").TemplateConfig;

declare const STDIO_CONFIG: { debug: boolean; silent: boolean };

declare const SERVER_INFO: import("@modelcontextprotocol/server").Implementation;

// ─── DefinePlugin — runtime flags ─────────────────────────────────────────────

declare const IS_CLOUDFLARE: boolean;

declare const INJECTED_CLIENT_BUNDLES:
  | Record<string, { js: string; css?: string }>
  | undefined;
