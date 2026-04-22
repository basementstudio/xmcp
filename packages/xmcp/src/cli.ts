#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { xmcpLogo } from "./utils/cli-icons";
import { runCreate, type CreateType } from "./cli/commands/create";

const { version } = require("../package.json");

const program = new Command();

program.name("xmcp").description("The MCP framework CLI").version(version);

program
  .command("dev")
  .description("Start development mode")
  .option("--cf", "Enable Cloudflare Workers output in development")
  .action(async (options) => {
    const [{ compile }, { compilerContextProvider }] = await Promise.all([
      import("./compiler"),
      import("./compiler/compiler-context"),
    ]);
    console.log(`${xmcpLogo} Starting development mode...`);
    const isCloudflareDev = options.cf || process.env.CF_PAGES === "1";
    await compilerContextProvider(
      {
        mode: "development",
        platforms: {
          cloudflare: isCloudflareDev,
        },
      },
      async () => {
        await compile();
      }
    );
  });

program
  .command("build")
  .description("Build for production")
  .option("--vercel", "Build for Vercel deployment")
  .option("--cf", "Build for Cloudflare Workers deployment")
  .option("--audit", "Run a static audit before bundling")
  .action(async (options) => {
    console.log(`${xmcpLogo} Building for production...`);
    const isVercelBuild = options.vercel || process.env.VERCEL === "1";
    const isCloudflareBuild = options.cf || process.env.CF_PAGES === "1";

    if (options.audit === true) {
      const { runAudit } = await import("./cli/commands/audit");
      const auditResult = await runAudit({
        path: process.cwd(),
        format: "terminal",
        noDeps: true,
        noHeuristics: true,
        strictExecutionErrors: true,
      });
      if (auditResult.exitCode !== 0) {
        process.exit(auditResult.exitCode);
      }
    }

    const [{ compile }, { compilerContext, compilerContextProvider }] =
      await Promise.all([
        import("./compiler"),
        import("./compiler/compiler-context"),
      ]);

    await compilerContextProvider(
      {
        mode: "production",
        platforms: {
          vercel: isVercelBuild,
          cloudflare: isCloudflareBuild,
        },
      },
      async () => {
        await compile({
          onBuild: async () => {
            const [{ buildVercelOutput }, { buildCloudflareOutput }] =
              await Promise.all([
                import("./platforms/build-vercel-output"),
                import("./platforms/build-cloudflare-output"),
              ]);
            const { xmcpConfig } = compilerContext.getContext();
            const isUsingAdapter = !!xmcpConfig?.experimental?.adapter;

            if (isVercelBuild && !isUsingAdapter) {
              console.log(`${xmcpLogo} Building for Vercel...`);
              try {
                await buildVercelOutput();
              } catch (error) {
                console.error(
                  chalk.red("❌ Failed to create Vercel output structure:"),
                  error
                );
              }
            }
            if (isCloudflareBuild) {
              console.log(`${xmcpLogo} Building for Cloudflare Workers...`);
              try {
                await buildCloudflareOutput();
              } catch (error) {
                console.error(
                  chalk.red("❌ Failed to create Cloudflare output structure:"),
                  error
                );
              }
            }
          },
        });
      }
    );
  });

const VALID_CREATE_TYPES: CreateType[] = [
  "tool",
  "resource",
  "prompt",
  "widget",
];

program
  .command("create <type> <name>")
  .description("Scaffold a new tool, resource, prompt, or widget")
  .option("-d, --dir <path>", "Custom output directory")
  .action(async (type: string, name: string, options: { dir?: string }) => {
    if (!VALID_CREATE_TYPES.includes(type as CreateType)) {
      console.error(chalk.red(`Invalid type "${type}".`));
      console.error(`Valid types: ${VALID_CREATE_TYPES.join(", ")}`);
      process.exit(1);
    }

    try {
      const outputPath = await runCreate({
        type: type as CreateType,
        name,
        directory: options.dir,
      });
      console.log(`${xmcpLogo} Created ${type} "${name}" -> ${outputPath}`);
    } catch (error) {
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error))
      );
      process.exit(1);
    }
  });

const parseList = (value: string): string[] =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

program
  .command("audit [path]")
  .description("Run a static audit on an xmcp project")
  .option(
    "--concern <names>",
    "Comma-separated concerns: security,compliance,quality,performance",
    parseList
  )
  .option(
    "-f, --format <format>",
    "Output format: terminal|json|sarif",
    "terminal"
  )
  .option(
    "-s, --severity <level>",
    "Minimum severity: info|low|medium|high|critical",
    "info"
  )
  .option(
    "--fail-on <level>",
    "Exit 1 if findings at or above this level",
    "high"
  )
  .option("--disable-rule <ids>", "Comma-separated rule IDs to skip", parseList)
  .option("--enable-rule <ids>", "Exclusive allowlist of rule IDs", parseList)
  .option("--no-heuristics", "Skip heuristic rules for deterministic scans")
  .option("--no-deps", "Skip dependency vulnerability scan")
  .option("-o, --output <file>", "Write report to a file")
  .option("--ci", "CI mode: no colors, imply --fail-on high")
  .option(
    "--baseline [file]",
    "Filter out findings present in the baseline file (default: .xmcp-audit-baseline.json)"
  )
  .option(
    "--update-baseline",
    "Write current findings to the baseline file and exit"
  )
  .option(
    "--since <ref>",
    "Scan only files changed between <ref> and HEAD (file-scope rules; project-scope rules still see the full project)"
  )
  .option(
    "--changed",
    "Scan only files changed in the working tree (staged + unstaged + untracked)"
  )
  .action(async (maybePath: string | undefined, options) => {
    const { runAudit } = await import("./cli/commands/audit");
    const result = await runAudit({
      path: maybePath ?? process.cwd(),
      concern: options.concern,
      format: options.format,
      severity: options.severity,
      failOn: options.failOn,
      disableRule: options.disableRule,
      enableRule: options.enableRule,
      noHeuristics: options.heuristics === false,
      noDeps: options.deps === false,
      output: options.output,
      ci: options.ci,
      strictExecutionErrors: options.ci === true,
      baseline:
        options.baseline === true
          ? ""
          : typeof options.baseline === "string"
            ? options.baseline
            : undefined,
      updateBaseline: options.updateBaseline === true,
      since: typeof options.since === "string" ? options.since : undefined,
      changed: options.changed === true,
    });
    process.exit(result.exitCode);
  });

program
  .command("audit:list-rules")
  .description("List all available audit rules")
  .option(
    "--concern <names>",
    "Filter by concerns: security,compliance,quality,performance",
    parseList
  )
  .option("-f, --format <format>", "Output format: terminal|json", "terminal")
  .action(async (options) => {
    const { runListRules } = await import("./cli/commands/audit");
    const result = await runListRules({
      concern: options.concern,
      format: options.format,
    });
    process.exit(result.exitCode);
  });

program
  .command("audit:explain <rule-id>")
  .description("Explain a single audit rule with rationale and examples")
  .action(async (ruleId: string) => {
    const { runExplain } = await import("./cli/commands/audit");
    const result = await runExplain(ruleId);
    process.exit(result.exitCode);
  });

program.parse();
