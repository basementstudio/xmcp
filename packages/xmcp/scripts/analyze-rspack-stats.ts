import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";

interface StatsAsset {
  name: string;
  size: number;
  type?: string;
  emitted?: boolean;
  chunkNames?: string[];
}

interface StatsSummary {
  assets?: StatsAsset[];
  time?: number;
}

interface BuildStats {
  label: string;
  file: string;
  stats: StatsSummary;
  assets: StatsAsset[];
  totalSize: number;
}

interface PackageFootprint {
  tarballSize: number;
  distSize: number;
  nodeModulesSize: number;
}

const STAT_FILES = [
  { label: "Main Compiler", file: "stats-main.json" },
  { label: "Runtime Compiler", file: "stats-runtime.json" },
];

function ensureStatsFiles(): void {
  const missing = STAT_FILES.filter(({ file }) =>
    fs.existsSync(path.join(process.cwd(), file)) ? false : true
  ).map(({ file }) => file);

  if (missing.length === 0) {
    return;
  }

  console.log(
    `[bundle-analysis] Missing stats files (${missing.join(
      ", "
    )}). Running build with GENERATE_STATS=true...`
  );

  execFileSync("pnpm", ["build"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      GENERATE_STATS: "true",
    },
  });

  const stillMissing = STAT_FILES.filter(({ file }) =>
    fs.existsSync(path.join(process.cwd(), file)) ? false : true
  ).map(({ file }) => file);

  if (stillMissing.length > 0) {
    throw new Error(
      `[bundle-analysis] Could not generate stats files: ${stillMissing.join(", ")}`
    );
  }
}

function readStatsFile(file: string): StatsSummary {
  const statsPath = path.join(process.cwd(), file);
  if (!fs.existsSync(statsPath)) {
    throw new Error(
      `Missing stats file: ${file}. Did you run the build with GENERATE_STATS=true?`
    );
  }

  return JSON.parse(fs.readFileSync(statsPath, "utf8"));
}

function formatKb(size: number): string {
  return (size / 1024).toFixed(2);
}

function formatMb(size: number): string {
  return (size / (1024 * 1024)).toFixed(2);
}

function formatMs(time?: number): string {
  if (!time && time !== 0) {
    return "n/a";
  }
  return `${(time / 1000).toFixed(2)}s`;
}

function createTableRows(assets: StatsAsset[]): string {
  if (assets.length === 0) {
    return "_No emitted assets found._";
  }

  const header =
    "| Asset | Chunk | Size (KB) | Size (MB) |\n| --- | --- | ---: | ---: |";

  const rows = assets
    .map((asset) => {
      const chunk = asset.chunkNames?.join(", ") || "—";
      return `| \`${asset.name}\` | ${chunk} | ${formatKb(asset.size)} | ${formatMb(asset.size)} |`;
    })
    .join("\n");

  return `${header}\n${rows}`;
}

function getDirectorySize(rootPath: string): number {
  if (!fs.existsSync(rootPath)) {
    return 0;
  }

  const stack: string[] = [fs.realpathSync(rootPath)];
  const visited = new Set<string>();
  let total = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      const stats = fs.lstatSync(entryPath);

      if (stats.isDirectory()) {
        stack.push(entryPath);
      } else if (stats.isSymbolicLink()) {
        const realPath = fs.realpathSync(entryPath);
        const realStats = fs.statSync(realPath);
        if (realStats.isDirectory()) {
          stack.push(realPath);
        } else {
          total += realStats.size;
        }
      } else {
        total += stats.size;
      }
    }
  }

  return total;
}

function measurePackageFootprint(): PackageFootprint {
  const packageRoot = process.cwd();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-footprint-"));

  try {
    const packOutput = execFileSync("npm", ["pack", "--json"], {
      cwd: packageRoot,
    }).toString();
    const packResult = JSON.parse(packOutput);

    if (!Array.isArray(packResult) || packResult.length === 0) {
      throw new Error("npm pack produced no output");
    }

    const { filename, size: tarballSize } = packResult[0];
    if (!filename) {
      throw new Error("npm pack response missing filename");
    }

    const tarballPath = path.join(packageRoot, filename);
    execFileSync("tar", ["-xzf", tarballPath, "-C", tempDir]);
    fs.rmSync(tarballPath);

    const extractedDir = path.join(tempDir, "package");
    if (!fs.existsSync(extractedDir)) {
      throw new Error("Failed to extract npm pack tarball");
    }

    execFileSync(
      "npm",
      [
        "install",
        "--production",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
      ],
      {
        cwd: extractedDir,
        stdio: "inherit",
      }
    );

    const distSize = getDirectorySize(path.join(extractedDir, "dist"));
    const nodeModulesSize = getDirectorySize(
      path.join(extractedDir, "node_modules")
    );

    return {
      tarballSize: typeof tarballSize === "number" ? tarballSize : 0,
      distSize,
      nodeModulesSize,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function analyze(): void {
  ensureStatsFiles();

  const builds: BuildStats[] = STAT_FILES.map(({ label, file }) => {
    const stats = readStatsFile(file);
    const assets =
      stats.assets
        ?.filter(
          (asset) =>
            asset.emitted &&
            asset.type === "asset" &&
            typeof asset.size === "number" &&
            /\.(js|mjs|cjs)$/.test(asset.name)
        )
        .sort((a, b) => b.size - a.size) ?? [];

    const totalSize = assets.reduce((acc, asset) => acc + asset.size, 0);

    return {
      label,
      file,
      stats,
      assets,
      totalSize,
    };
  });

  const summaryHeader =
    "| Build | Assets | Total Size (MB) | Build Time |\n| --- | ---: | ---: | ---: |";
  const summaryRows = builds
    .map((build) => {
      const sizeMb = formatMb(build.totalSize);
      const assetCount = build.assets.length;
      const time = formatMs(build.stats.time);

      return `| ${build.label} | ${assetCount} | ${sizeMb} | ${time} |`;
    })
    .join("\n");

  const packageFootprint = measurePackageFootprint();

  let output = "# Rspack Bundle Analysis\n\n";
  output += `${summaryHeader}\n${summaryRows}\n\n`;

  for (const build of builds) {
    output += `## ${build.label}\n\n`;
    output += `Source: \`${build.file}\`\n\n`;
    output += createTableRows(build.assets);
    output += `\n\n**Total emitted JS:** ${formatMb(build.totalSize)} MB\n\n`;
  }

  output += "## Package Footprint (npm pack + npm install)\n\n";
  output +=
    "| Item | Size (KB) | Size (MB) |\n| --- | ---: | ---: |\n" +
    `| Tarball (.tgz) | ${formatKb(packageFootprint.tarballSize)} | ${formatMb(
      packageFootprint.tarballSize
    )} |\n` +
    `| dist/ | ${formatKb(packageFootprint.distSize)} | ${formatMb(
      packageFootprint.distSize
    )} |\n` +
    `| node_modules/ | ${formatKb(packageFootprint.nodeModulesSize)} | ${formatMb(
      packageFootprint.nodeModulesSize
    )} |\n` +
    `| dist + node_modules | ${formatKb(
      packageFootprint.distSize + packageFootprint.nodeModulesSize
    )} | ${formatMb(packageFootprint.distSize + packageFootprint.nodeModulesSize)} |\n\n`;

  const destination = path.join(process.cwd(), "bundle-analysis.md");
  fs.writeFileSync(destination, output);
  console.log(output);
}

try {
  analyze();
} catch (error) {
  console.error("[bundle-analysis] Failed to generate report:\n", error);
  process.exit(1);
}
