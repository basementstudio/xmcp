import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface InitUiOptions {
  cwd?: string;
  force?: boolean;
  dryRun?: boolean;
}

interface ScaffoldFile {
  path: string;
  content: string;
}

const dependencies = {
  "@xmcp-dev/ui": "latest",
  react: "^19.2.3",
  "react-dom": "^19.2.3",
  xmcp: "latest",
  zod: "^4.0.0",
};

const devDependencies = {
  "@tailwindcss/postcss": "^4.1.17",
  "@types/react": "^19.2.7",
  "@types/react-dom": "^19.2.3",
  postcss: "^8.5.6",
  tailwindcss: "^4.1.18",
};

const files: ScaffoldFile[] = [
  {
    path: "src/globals.css",
    content: `@import "tailwindcss";
@import "@xmcp-dev/ui/styles.css";

@theme {
  --font-mono:
    "SFMono-Regular", "SF Mono", "IBM Plex Mono", "JetBrains Mono", "Fira Code",
    ui-monospace, monospace;
  --font-sans:
    "Geist", "Avenir Next", "Segoe UI", "Helvetica Neue", Arial,
    ui-sans-serif, sans-serif;
}
`,
  },
  {
    path: "postcss.config.mjs",
    content: `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`,
  },
  {
    path: "src/tools/render-json.tsx",
    content: `import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool({
  transportMode: "auto",
});

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
`,
  },
  {
    path: "src/tools/ui-kit-demo.tsx",
    content: `import { useRef, useState } from "react";
import {
  AppShell,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  StatCard,
  useAutoMcpAppSize,
  useMcpApp,
} from "@xmcp-dev/ui";
import { type ToolMetadata } from "xmcp";

import "../globals.css";

export const metadata: ToolMetadata = {
  name: "uiKitDemo",
  description: "Starter MCP App built with @xmcp-dev/ui components.",
  _meta: {
    ui: {
      prefersBorder: true,
    },
  },
};

export default function UiKitDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isConnected, requestDisplayMode, openLink } = useMcpApp();
  const [modeRequests, setModeRequests] = useState(0);

  useAutoMcpAppSize(rootRef);

  async function handleFullscreen() {
    setModeRequests((count) => count + 1);

    if (isConnected) {
      await requestDisplayMode("fullscreen");
    }
  }

  return (
    <div ref={rootRef}>
      <AppShell>
        <PageHeader>
          <PageEyebrow>@xmcp-dev/ui starter</PageEyebrow>
          <PageTitle>MCP App UI Kit</PageTitle>
          <PageDescription>
            A compact starter for handwritten MCP Apps and schema-driven UI.
          </PageDescription>
        </PageHeader>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Host bridge</CardTitle>
                  <CardDescription>
                    Use the host when available, keep the UI useful while local.
                  </CardDescription>
                </div>
                <Badge variant={isConnected ? "default" : "outline"}>
                  {isConnected ? "Connected" : "Local preview"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={handleFullscreen}>Request fullscreen</Button>
              <Button
                variant="secondary"
                onClick={() => openLink("https://xmcp.dev/docs")}
              >
                Open docs
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <StatCard label="Display requests" value={modeRequests} />
            <StatCard label="Schema tool" value="renderJson" detail="Ready" />
          </div>
        </div>
      </AppShell>
    </div>
  );
}
`,
  },
];

function mergeMissing(
  target: Record<string, string> | undefined,
  additions: Record<string, string>
): Record<string, string> {
  return {
    ...additions,
    ...(target ?? {}),
  };
}

function updatePackageJson(cwd: string, dryRun: boolean): string[] {
  const packageJsonPath = path.join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) {
    throw new Error(
      "package.json not found. Run this command from an xmcp project root."
    );
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const missingDependency = Object.keys(dependencies).some(
    (name) => !packageJson.dependencies?.[name]
  );
  const missingDevDependency = Object.keys(devDependencies).some(
    (name) => !packageJson.devDependencies?.[name]
  );
  const changed = missingDependency || missingDevDependency;

  if (!changed) {
    return [];
  }

  const nextPackageJson = {
    ...packageJson,
    dependencies: mergeMissing(packageJson.dependencies, dependencies),
    devDependencies: mergeMissing(packageJson.devDependencies, devDependencies),
  };

  if (!dryRun) {
    writeFileSync(
      packageJsonPath,
      `${JSON.stringify(nextPackageJson, null, 2)}\n`
    );
  }

  return ["package.json"];
}

export function initUi(options: InitUiOptions = {}): string[] {
  const cwd = options.cwd ?? process.cwd();
  const force = options.force ?? false;
  const dryRun = options.dryRun ?? false;

  const existingFiles = files
    .map((file) => file.path)
    .filter((filePath) => existsSync(path.join(cwd, filePath)));

  if (existingFiles.length > 0 && !force) {
    throw new Error(
      `Refusing to overwrite existing files:\n${existingFiles
        .map((filePath) => `  - ${filePath}`)
        .join("\n")}\nPass --force to replace them.`
    );
  }

  const changed = updatePackageJson(cwd, dryRun);

  for (const file of files) {
    const absolutePath = path.join(cwd, file.path);
    changed.push(file.path);

    if (dryRun) continue;

    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, file.content);
  }

  return changed;
}
