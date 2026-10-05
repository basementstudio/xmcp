import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const benchRoot = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.join(benchRoot, "fixtures");
const workRoot = path.join(benchRoot, ".work");

const fixtures = [
  {
    name: "xmcp-http",
    packageName: "xmcp",
    version: "0.8.0",
    transport: "http",
  },
  {
    name: "xmcp-stdio",
    packageName: "xmcp",
    version: "0.8.0",
    transport: "stdio",
  },
  {
    name: "fastmcp",
    packageName: "fastmcp",
    version: "4.16.5",
    transport: "http",
  },
  {
    name: "mcp-framework",
    packageName: "mcp-framework",
    version: "0.2.22",
    transport: "http",
  },
  { name: "tmcp", packageName: "tmcp", version: "1.20.0", transport: "http" },
  {
    name: "sdk-raw",
    packageName: "@modelcontextprotocol/server",
    version: "2.0.0",
    transport: "http",
  },
] as const;

type Fixture = (typeof fixtures)[number];
type RegistryResult = { name: string; tarball: number; unpacked: number };
type InstallResult = { name: string; bytes: number; dependencies: number };
type ArtifactResult = {
  name: string;
  deployBytes: number;
  bundledBytes: number;
};

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const only = option("--only");
const xmcpTarball = option("--xmcp-tarball");
const compilerTarball = option("--compiler-tarball");
const metricFlags = new Set(
  process.argv.filter((arg) => arg.startsWith("--m"))
);
const runEveryMetric = metricFlags.size === 0;
const selected = fixtures.filter((fixture) => !only || fixture.name === only);

if (selected.length === 0) {
  throw new Error(`Unknown fixture: ${only}`);
}

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function runWithOutputOnError(
  command: string,
  args: string[],
  cwd: string
): string {
  try {
    return run(command, args, cwd);
  } catch (error) {
    const stdout = (error as { stdout?: string }).stdout;
    if (typeof stdout === "string") return stdout.trim();
    throw error;
  }
}

function directoryBytes(target: string): number {
  if (!fs.existsSync(target)) return 0;
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink()) return 0;
  if (stat.isFile()) return stat.size;
  return fs
    .readdirSync(target)
    .reduce(
      (total, entry) => total + directoryBytes(path.join(target, entry)),
      0
    );
}

function resetDirectory(target: string): void {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
}

async function registryMetric(fixture: Fixture): Promise<RegistryResult> {
  if (fixture.name.startsWith("xmcp-") && xmcpTarball) {
    const [packed] = JSON.parse(
      run(
        "npm",
        ["pack", path.resolve(xmcpTarball), "--dry-run", "--json"],
        benchRoot
      )
    ) as Array<{ size: number; unpackedSize: number }>;
    return {
      name: fixture.name,
      tarball: packed.size,
      unpacked: packed.unpackedSize,
    };
  }

  const spec = `${fixture.packageName}@${fixture.version}`;
  const metadata = JSON.parse(
    run(
      "npm",
      ["view", spec, "dist.tarball", "dist.unpackedSize", "--json"],
      benchRoot
    )
  ) as { "dist.tarball": string; "dist.unpackedSize": number };
  const response = await fetch(metadata["dist.tarball"], {
    headers: { "accept-encoding": "identity" },
  });
  const tarball = (await response.arrayBuffer()).byteLength;
  return {
    name: fixture.name,
    tarball,
    unpacked: metadata["dist.unpackedSize"],
  };
}

function installMetric(fixture: Fixture): InstallResult {
  const target = path.join(workRoot, "install", fixture.name);
  resetDirectory(target);
  const packageJson = JSON.parse(
    fs.readFileSync(
      path.join(fixturesRoot, fixture.name, "package.json"),
      "utf-8"
    )
  );
  delete packageJson.devDependencies;
  if (fixture.name.startsWith("xmcp-") && xmcpTarball) {
    packageJson.dependencies.xmcp = `file:${path.resolve(xmcpTarball)}`;
  }
  fs.writeFileSync(
    path.join(target, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
  run("npm", ["install", "--legacy-peer-deps", "--omit=dev"], target);
  const listed = runWithOutputOnError(
    "npm",
    ["ls", "--all", "--parseable"],
    target
  )
    .split("\n")
    .filter(Boolean).length;
  return {
    name: fixture.name,
    bytes: directoryBytes(path.join(target, "node_modules")),
    dependencies: Math.max(0, listed - 1),
  };
}

function prepareFixture(fixture: Fixture): string {
  const target = path.join(workRoot, "artifact", fixture.name);
  resetDirectory(target);
  fs.cpSync(path.join(fixturesRoot, fixture.name), target, { recursive: true });

  if (fixture.name.startsWith("xmcp-") && xmcpTarball) {
    const packageJsonPath = path.join(target, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.dependencies.xmcp = `file:${path.resolve(xmcpTarball)}`;
    if (compilerTarball) {
      packageJson.devDependencies = {
        ...(packageJson.devDependencies ?? {}),
        "@xmcp-dev/compiler": `file:${path.resolve(compilerTarball)}`,
      };
    }
    fs.writeFileSync(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`
    );
  }

  run("npm", ["install", "--legacy-peer-deps"], target);
  return target;
}

function artifactMetric(fixture: Fixture): ArtifactResult {
  const target = prepareFixture(fixture);
  const normalizedOutput = path.join(target, "normalized", "server.js");
  fs.mkdirSync(path.dirname(normalizedOutput), { recursive: true });

  if (fixture.name.startsWith("xmcp-")) {
    run("npm", ["run", "build"], target);
  } else {
    run(
      path.join(target, "node_modules", ".bin", "esbuild"),
      [
        "src/index.ts",
        "--bundle",
        "--minify",
        "--platform=node",
        "--format=esm",
        "--external:effect",
        "--external:sury",
        "--external:@valibot/to-json-schema",
        `--outfile=${normalizedOutput}`,
      ],
      target
    );
    fs.mkdirSync(path.join(target, "dist"), { recursive: true });
    run(
      path.join(target, "node_modules", ".bin", "esbuild"),
      [
        "src/index.ts",
        "--platform=node",
        "--format=esm",
        "--outfile=dist/server.js",
      ],
      target
    );
  }

  const bundledBytes = fixture.name.startsWith("xmcp-")
    ? fs.statSync(path.join(target, "dist", `${fixture.transport}.js`)).size
    : fs.statSync(normalizedOutput).size;

  if (!fixture.name.startsWith("xmcp-")) {
    run("npm", ["prune", "--omit=dev", "--legacy-peer-deps"], target);
  }

  const deployBytes = fixture.name.startsWith("xmcp-")
    ? directoryBytes(path.join(target, "dist"))
    : directoryBytes(path.join(target, "dist")) +
      directoryBytes(path.join(target, "node_modules"));

  return { name: fixture.name, deployBytes, bundledBytes };
}

function formatBytes(bytes: number): string {
  if (!bytes) return "n/a";
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

fs.mkdirSync(workRoot, { recursive: true });
const registryResults: RegistryResult[] = [];
const installResults: InstallResult[] = [];
const artifactResults: ArtifactResult[] = [];

for (const fixture of selected) {
  console.log(`benchmarking ${fixture.name}`);
  if (runEveryMetric || metricFlags.has("--m1")) {
    registryResults.push(await registryMetric(fixture));
  }
  if (runEveryMetric || metricFlags.has("--m2")) {
    installResults.push(installMetric(fixture));
  }
  if (runEveryMetric || metricFlags.has("--m3")) {
    artifactResults.push(artifactMetric(fixture));
  }
}

const nodeVersionNotice = process.versions.node.startsWith("22.")
  ? ""
  : "\n> The repository targets Node 22. These results are provisional until rerun on Node 22.\n";

const generated = `# Bundle benchmark results

Generated ${new Date().toISOString().slice(0, 10)} on ${os.type()} ${os.release()} (${os.arch()}), Node ${process.version}, npm ${run("npm", ["--version"], benchRoot)}.
${nodeVersionNotice}
The xmcp rows use ${xmcpTarball ? "the packed local 0.8.1 migration candidate" : "xmcp 0.8.0 from the registry"}. The comparison fixtures are exact-pinned: FastMCP 4.16.5, mcp-framework 0.2.22, tmcp 1.20.0, \`@modelcontextprotocol/server\`/\`node\` 2.0.0, Zod 4.4.3, and esbuild 0.28.2.

Fresh-install measurements install each complete runnable fixture with development dependencies omitted. View A follows each framework's documented deployment model: xmcp's self-contained \`dist/\`, or compiled source plus production \`node_modules\`. View B bundles non-xmcp fixtures with esbuild 0.28.2 and compares that single file with xmcp's generated transport file.

## M1 — registry package size

${table(
  ["fixture", "tarball", "unpacked"],
  registryResults.map((result) => [
    result.name,
    formatBytes(result.tarball),
    formatBytes(result.unpacked),
  ])
)}

## M2 — fresh transitive install

${table(
  ["fixture", "node_modules", "dependency entries"],
  installResults.map((result) => [
    result.name,
    formatBytes(result.bytes),
    String(result.dependencies),
  ])
)}

## M3 — user server artifact

${table(
  ["fixture", "View A deploy footprint", "View B bundled artifact"],
  artifactResults.map((result) => [
    result.name,
    formatBytes(result.deployBytes),
    formatBytes(result.bundledBytes),
  ])
)}

## Reproduce

\`pnpm bench\` runs M1–M3. Use \`--m1\`, \`--m2\`, or \`--m3\` to select a metric and \`--only <fixture>\` to select one fixture. To measure a local split build, also pass \`--xmcp-tarball <path> --compiler-tarball <path>\`.
`;

const isCompleteRun = runEveryMetric && selected.length === fixtures.length;
if (isCompleteRun) {
  fs.writeFileSync(path.join(benchRoot, "RESULTS.md"), generated);
} else {
  console.log(
    "Partial benchmark selected; RESULTS.md was left unchanged. Run every fixture and metric to regenerate it."
  );
}
console.log(generated);
