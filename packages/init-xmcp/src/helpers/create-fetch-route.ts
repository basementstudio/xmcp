import fs from "fs-extra";
import path from "node:path";
import type { Framework } from "./detect-framework.js";

export type RoutedFetchFramework =
  | "hono"
  | "sveltekit"
  | "nuxt"
  | "react-router"
  | "astro";

export function isRoutedFetchFramework(
  framework: Framework
): framework is RoutedFetchFramework {
  return isFetchFramework(framework) && framework !== "tanstack";
}

export function isFetchFramework(framework?: Framework): boolean {
  return [
    "tanstack",
    "hono",
    "sveltekit",
    "nuxt",
    "react-router",
    "astro",
  ].includes(framework ?? "");
}

export function detectFetchCloudflare(
  projectRoot: string,
  framework: Framework
): boolean {
  const pkg = fs.readJsonSync(path.join(projectRoot, "package.json"));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  return !!(
    dependencies["@cloudflare/vite-plugin"] ||
    (framework === "sveltekit" &&
      dependencies["@sveltejs/adapter-cloudflare"]) ||
    (["hono", "nuxt"].includes(framework) && dependencies.wrangler) ||
    (framework === "astro" && dependencies["@astrojs/cloudflare"])
  );
}

export function getFetchRoute(
  projectRoot: string,
  framework: RoutedFetchFramework,
  directory: string
) {
  const file = path.resolve(
    projectRoot,
    directory,
    framework === "sveltekit" ? "+server.ts" : "mcp.ts"
  );
  let adapterImport = path
    .relative(
      path.dirname(file),
      path.join(projectRoot, ".xmcp/adapter/index.js")
    )
    .split(path.sep)
    .join("/");
  if (!adapterImport.startsWith(".")) adapterImport = `./${adapterImport}`;
  // Route groups in SvelteKit do not contribute URL segments. A custom routes
  // root cannot be inferred here; the handler itself does not depend on this URL.
  const segments = directory.replace(/\\/g, "/").split("/");
  const routesIndex = segments.lastIndexOf("routes");
  let endpoint = "/mcp";
  if (framework === "sveltekit" && routesIndex >= 0) {
    endpoint = `/${segments
      .slice(routesIndex + 1)
      .filter((segment) => segment && !/^\(.*\)$/.test(segment))
      .join("/")}`;
  } else if (framework === "nuxt" || framework === "astro") {
    const rootIndex = segments.lastIndexOf(
      framework === "astro" ? "pages" : "routes"
    );
    const apiIndex = framework === "nuxt" ? segments.lastIndexOf("api") : -1;
    const prefix =
      rootIndex >= 0
        ? segments.slice(rootIndex + 1)
        : apiIndex >= 0
          ? segments.slice(apiIndex)
          : [];
    endpoint = `/${[...prefix.filter(Boolean), "mcp"].join("/")}`;
  }
  return { file, adapterImport, endpoint };
}

export function assertFetchRouteAvailable(
  projectRoot: string,
  framework: RoutedFetchFramework,
  directory: string
) {
  const { file } = getFetchRoute(projectRoot, framework, directory);
  const extensions =
    framework === "react-router"
      ? ["ts", "tsx", "js", "jsx"]
      : framework === "astro"
        ? ["ts", "js", "astro"]
        : ["ts", "js"];
  const candidates = extensions.map((extension) =>
    file.replace(/\.ts$/, `.${extension}`)
  );
  if (framework === "nuxt") {
    for (const method of [
      "get",
      "post",
      "delete",
      "put",
      "patch",
      "head",
      "options",
    ]) {
      for (const extension of extensions)
        candidates.push(file.replace(/\.ts$/, `.${method}.${extension}`));
    }
  }
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      throw new Error(
        `MCP route already exists: ${candidate}. Use --skip-route to keep it, or choose another --route-path.`
      );
    }
  }
}

export function createFetchRoute(
  projectRoot: string,
  framework: RoutedFetchFramework,
  directory: string
) {
  assertFetchRouteAvailable(projectRoot, framework, directory);
  const { file, adapterImport } = getFetchRoute(
    projectRoot,
    framework,
    directory
  );
  const importHandler = `import { xmcpHandler } from ${JSON.stringify(adapterImport)};`;
  const templates: Record<RoutedFetchFramework, string> = {
    hono: `import { Hono } from "hono";
${importHandler}

const mcp = new Hono();
mcp.all("/", (c) => xmcpHandler(c.req.raw));

export default mcp;
`,
    sveltekit: `import type { RequestHandler } from "./$types";
${importHandler}

export const GET: RequestHandler = ({ request }) => xmcpHandler(request);
export const POST: RequestHandler = ({ request }) => xmcpHandler(request);
export const DELETE: RequestHandler = ({ request }) => xmcpHandler(request);
`,
    nuxt: `${importHandler}

export default defineEventHandler((event) => xmcpHandler(toWebRequest(event)));
`,
    "react-router": `import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
${importHandler}

export function loader({ request }: LoaderFunctionArgs) {
  return xmcpHandler(request);
}

export function action({ request }: ActionFunctionArgs) {
  return xmcpHandler(request);
}
`,
    astro: `import type { APIRoute } from "astro";
${importHandler}

export const prerender = false;
export const ALL: APIRoute = ({ request }) => xmcpHandler(request);
`,
  };
  const content = templates[framework];
  fs.ensureDirSync(path.dirname(file));
  fs.writeFileSync(file, content, { flag: "wx" });
}
