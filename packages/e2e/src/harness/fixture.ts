import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
  readFile,
  access,
} from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { DEFAULT_FILES, adapterHost } from "./project-files.js";
import { runCommand } from "./process.js";
import type { Capability } from "./target.js";

export const E2E_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const REPO_ROOT = join(E2E_ROOT, "../..");
export type FixtureKind =
  | "http"
  | "stdio"
  | "express"
  | "fastify"
  | "nestjs"
  | "nextjs";
export type ModuleType = "commonjs" | "module";
export interface FixtureSpec {
  kind: FixtureKind;
  moduleType: ModuleType;
  /** Fixture-relative files written after all defaults; matching paths replace them. */
  files?: Record<string, string>;
  /** TypeScript config object members appended after defaultConfig is spread. */
  configFragment?: string;
  /** Conformance capabilities; omitted uses the standard fixture's capabilities. */
  capabilities?: readonly Capability[];
}
export interface Fixture {
  spec: FixtureSpec;
  directory: string;
  label: string;
  dispose(): Promise<void>;
}

async function availablePort(): Promise<number> {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

export async function createFixture(spec: FixtureSpec): Promise<Fixture> {
  // Validate before creating anything. Dependencies are symlinked, so writing
  // beneath node_modules could otherwise mutate the shared workspace packages.
  const extraFiles = Object.entries(spec.files ?? {}).map(
    ([path, contents]) => {
      const relativePath = normalize(path);
      if (
        isAbsolute(relativePath) ||
        relativePath === "." ||
        relativePath === ".." ||
        relativePath.startsWith(`..${sep}`) ||
        relativePath.split(sep)[0] === "node_modules"
      ) {
        throw new Error(
          `Fixture file must stay inside the project and outside node_modules: ${path}`
        );
      }
      return [relativePath, contents] as const;
    }
  );
  const label = `${spec.kind}-${spec.moduleType}`;
  const work = join(E2E_ROOT, ".work");
  await mkdir(work, { recursive: true });
  const directory = await mkdtemp(join(work, `${label}-`));
  // Sibling projects keep Next.js from discovering xmcp's middleware in an
  // ancestor source directory. Dependencies are shared from the fixture root.
  const projectDirectory =
    spec.kind === "nextjs" ? join(directory, "mcp") : directory;
  const manifest = JSON.parse(
    await readFile(join(E2E_ROOT, "package.json"), "utf8")
  );
  // Each fixture has its own node_modules directory. Only dependencies are
  // linked; generated files and adapter artifacts never mutate another fixture.
  for (const name of Object.keys(manifest.devDependencies)) {
    const destination = join(directory, "node_modules", name);
    await mkdir(dirname(destination), { recursive: true });
    await symlink(
      join(E2E_ROOT, "node_modules", name),
      destination,
      "junction"
    );
  }
  const isAdapter = spec.kind !== "http" && spec.kind !== "stdio";
  const port = spec.kind === "http" ? await availablePort() : undefined;
  const config = {
    ...(spec.kind === "stdio"
      ? { stdio: { silent: true } }
      : {
          http: {
            host: "127.0.0.1",
            endpoint: "/mcp",
            ...(port ? { port } : {}),
          },
        }),
    ...(isAdapter ? { experimental: { adapter: spec.kind } } : {}),
    template: { name: "xmcp-e2e", description: "Conformance fixture" },
  };
  const files = {
    "package.json": JSON.stringify(
      {
        name: label,
        version: "0.0.0",
        private: true,
        ...(spec.moduleType === "module" ? { type: "module" } : {}),
        dependencies: {
          xmcp: "workspace:*",
          zod: manifest.devDependencies.zod,
        },
      },
      null,
      2
    ),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["src/**/*.ts", "xmcp.config.ts"],
    }),
    "xmcp.config.ts": `import type { XmcpConfig } from "xmcp";
const defaultConfig = ${JSON.stringify(config)} satisfies XmcpConfig;
export default {
  ...defaultConfig,
  ${spec.configFragment ?? ""}
} satisfies XmcpConfig;
`,
    ...DEFAULT_FILES,
  };
  for (const [relativePath, contents] of Object.entries(files)) {
    const path = join(projectDirectory, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }
  if (isAdapter)
    await writeFile(
      join(directory, "host.cjs"),
      adapterHost(spec.kind as Parameters<typeof adapterHost>[0])
    );
  if (spec.kind === "nextjs") {
    // Next.js also reserves src/middleware.ts. Host its app separately from
    // the xmcp sources, importing the compiled adapter across that boundary.
    const nextDirectory = join(directory, "next-host");
    await mkdir(join(nextDirectory, "app/mcp"), { recursive: true });
    await writeFile(
      join(nextDirectory, "package.json"),
      JSON.stringify({ name: "next-host", private: true })
    );
    await writeFile(
      join(nextDirectory, "app/mcp/route.js"),
      `import adapter from "../../../mcp/.xmcp/adapter/index.js";\nexport const dynamic = "force-dynamic";\nexport const POST = adapter.xmcpHandler;\nexport const GET = adapter.xmcpHandler;\nexport const OPTIONS = adapter.xmcpHandler;\n`
    );
    await writeFile(
      join(nextDirectory, "app/layout.js"),
      `export default function Layout({children}) { return <html><body>{children}</body></html>; }\n`
    );
    await writeFile(
      join(nextDirectory, "next.config.mjs"),
      `export default { devIndicators: false };\n`
    );
  }
  for (const [relativePath, contents] of extraFiles) {
    const path = join(projectDirectory, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }
  await runCommand(
    process.execPath,
    [join(REPO_ROOT, "packages/xmcp/dist/cli.js"), "build"],
    projectDirectory,
    join(directory, "build.log")
  );
  await access(
    join(
      projectDirectory,
      isAdapter ? ".xmcp/adapter/index.js" : `dist/${spec.kind}.js`
    )
  );
  return {
    spec,
    directory,
    label,
    async dispose() {
      await rm(directory, { recursive: true, force: true });
    },
  };
}
