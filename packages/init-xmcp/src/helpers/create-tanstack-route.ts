import fs from "fs-extra";
import path from "node:path";

/** --route-path is a directory; the MCP endpoint is its mcp.ts child. */
export function getTanstackRoute(projectRoot: string, routeDirectory: string) {
  const file = path.resolve(projectRoot, routeDirectory, "mcp.ts");
  const directory = routeDirectory.replace(/\\/g, "/").replace(/\/$/, "");
  const routesIndex = directory.split("/").lastIndexOf("routes");
  const segments =
    routesIndex < 0 ? [] : directory.split("/").slice(routesIndex + 1);
  const endpoint = `/${[...segments, "mcp"].join("/")}`;
  let adapterImport = path
    .relative(
      path.dirname(file),
      path.join(projectRoot, ".xmcp/adapter/index.js")
    )
    .split(path.sep)
    .join("/");
  if (!adapterImport.startsWith(".")) adapterImport = `./${adapterImport}`;
  return { file, endpoint, adapterImport };
}

export function assertTanstackRouteAvailable(
  projectRoot: string,
  routeDirectory: string
) {
  const { file } = getTanstackRoute(projectRoot, routeDirectory);
  if (fs.existsSync(file)) {
    throw new Error(
      `MCP route already exists: ${file}. Use --skip-route to keep it, or choose another --route-path.`
    );
  }
}

export function createTanstackRoute(
  projectRoot: string,
  routeDirectory: string
): void {
  assertTanstackRouteAvailable(projectRoot, routeDirectory);
  const { file, endpoint, adapterImport } = getTanstackRoute(
    projectRoot,
    routeDirectory
  );
  fs.ensureDirSync(path.dirname(file));
  fs.writeFileSync(
    file,
    `import { createFileRoute } from "@tanstack/react-router";
import { xmcpHandler } from ${JSON.stringify(adapterImport)};

export const Route = createFileRoute(${JSON.stringify(endpoint)})({
  server: {
    handlers: {
      GET: ({ request }) => xmcpHandler(request),
      POST: ({ request }) => xmcpHandler(request),
      DELETE: ({ request }) => xmcpHandler(request),
    },
  },
});
`,
    { flag: "wx" }
  );
}

export function detectTanstackCloudflare(projectRoot: string): boolean {
  const pkg = fs.readJsonSync(path.join(projectRoot, "package.json"));
  return !!(
    pkg.dependencies?.["@cloudflare/vite-plugin"] ||
    pkg.devDependencies?.["@cloudflare/vite-plugin"]
  );
}
