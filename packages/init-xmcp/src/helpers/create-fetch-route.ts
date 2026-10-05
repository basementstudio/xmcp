import fs from "fs-extra";
import path from "node:path";
import type { Framework } from "./detect-framework.js";

export function isFetchFramework(framework?: Framework): boolean {
  return ["tanstack", "hono", "sveltekit"].includes(framework ?? "");
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
    (framework === "hono" && dependencies.wrangler)
  );
}

export function getFetchRoute(
  projectRoot: string,
  framework: "hono" | "sveltekit",
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
  const endpoint =
    framework === "sveltekit" && routesIndex >= 0
      ? `/${segments
          .slice(routesIndex + 1)
          .filter((segment) => segment && !/^\(.*\)$/.test(segment))
          .join("/")}`
      : "/mcp";
  return { file, adapterImport, endpoint };
}

export function assertFetchRouteAvailable(
  projectRoot: string,
  framework: "hono" | "sveltekit",
  directory: string
) {
  const { file } = getFetchRoute(projectRoot, framework, directory);
  const candidates = [file, file.replace(/\.ts$/, ".js")];
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
  framework: "hono" | "sveltekit",
  directory: string
) {
  assertFetchRouteAvailable(projectRoot, framework, directory);
  const { file, adapterImport } = getFetchRoute(
    projectRoot,
    framework,
    directory
  );
  const content =
    framework === "hono"
      ? `import { Hono } from "hono";
import { xmcpHandler } from ${JSON.stringify(adapterImport)};

const mcp = new Hono();
mcp.all("/", (c) => xmcpHandler(c.req.raw));

export default mcp;
`
      : `import type { RequestHandler } from "./$types";
import { xmcpHandler } from ${JSON.stringify(adapterImport)};

export const GET: RequestHandler = ({ request }) => xmcpHandler(request);
export const POST: RequestHandler = ({ request }) => xmcpHandler(request);
export const DELETE: RequestHandler = ({ request }) => xmcpHandler(request);
`;
  fs.ensureDirSync(path.dirname(file));
  fs.writeFileSync(file, content, { flag: "wx" });
}
