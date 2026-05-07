import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

import { config as loadEnv } from "dotenv";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  buildAt,
  mcpjamDoctor,
  mcpjamPromptGet,
  mcpjamPromptsList,
  mcpjamResourceRead,
  mcpjamResourcesList,
  mcpjamToolsCall,
  mcpjamToolsList,
  postJsonRpc,
  spawnHttpEntry,
  type BuildResult,
  type McpjamTarget,
  type ServerHandle,
} from "./_utils";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

loadEnv({ path: path.join(REPO_ROOT, ".env.local"), quiet: true });

const LIVE_ENABLED = process.env.LLM_GENERATED_E2E === "1";
const SCENARIO_FILTER = process.env.LLM_GENERATED_E2E_SCENARIO;
const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
const LIVE_TEST_TIMEOUT_MS = 180_000;
const OPENROUTER_REQUEST_TIMEOUT_MS = 90_000;
const DOC_CONTEXT_CHAR_LIMIT = 28_000;
const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
const ARTIFACTS_ROOT = path.join(
  PACKAGE_ROOT,
  "test",
  ".artifacts",
  "llm-generated-server",
  "latest"
);
const requireFromTest = createRequire(__filename);

const BASE_DOCS = [
  "apps/website/content/docs/getting-started/installation.mdx",
  "apps/website/content/docs/getting-started/project-structure.mdx",
  "apps/website/content/docs/core-concepts/tools.mdx",
  "apps/website/content/docs/core-concepts/resources.mdx",
  "apps/website/content/docs/core-concepts/prompts.mdx",
  "apps/website/content/docs/configuration/transports.mdx",
  "apps/website/content/docs/configuration/server-info.mdx",
];

const BASE_REQUIRED_FILES = ["package.json", "tsconfig.json", "xmcp.config.ts"];

const handles: ServerHandle[] = [];
const tempDirs: string[] = [];

beforeAll(async () => {
  if (LIVE_ENABLED && !SCENARIO_FILTER) {
    await fs.rm(ARTIFACTS_ROOT, { recursive: true, force: true });
  }
});

afterEach(async () => {
  while (handles.length > 0) {
    await handles.pop()!.stop();
  }
});

afterAll(async () => {
  for (const dir of tempDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe("LLM-generated project validation", () => {
  it("extracts JSON from a fenced model response", () => {
    const parsed = parseGeneratedProject(
      `\`\`\`json\n${JSON.stringify({
        rationale: validRationale(),
        files: {},
      })}\n\`\`\``
    );
    expect(parsed).toEqual({ rationale: validRationale(), files: {} });
  });

  it("rejects generated projects missing rationale", () => {
    expect(() =>
      validateGeneratedProject({
        project: { files: {} } as GeneratedProject,
        requiredFiles: [],
      })
    ).toThrow(/rationale/);
  });

  it("rejects generated projects with empty rationale steps", () => {
    expect(() =>
      validateGeneratedProject({
        project: {
          rationale: { ...validRationale(), steps: [] },
          files: {},
        },
        requiredFiles: [],
      })
    ).toThrow(/rationale.steps/);
  });

  it("rejects unsafe generated paths before writing files", () => {
    expect(() =>
      validateGeneratedProject({
        project: {
          rationale: validRationale(),
          files: { "../package.json": "{}" },
        },
        requiredFiles: BASE_REQUIRED_FILES,
      })
    ).toThrow(/unsafe path/);
  });

  it("rejects generated projects missing required xmcp surfaces", () => {
    expect(() =>
      validateGeneratedProject({
        project: {
          rationale: validRationale(),
          files: { "package.json": "{}" },
        },
        requiredFiles: BASE_REQUIRED_FILES,
      })
    ).toThrow(/missing required file/);
  });

  it("rejects package.json configured as an ES module package", () => {
    expect(() =>
      validateGeneratedProject({
        project: {
          rationale: validRationale(),
          files: {
            "package.json": JSON.stringify({
              name: "bad-module-project",
              type: "module",
            }),
          },
        },
        requiredFiles: ["package.json"],
      })
    ).toThrow(/type.*module/);
  });
});

const SCENARIOS: LlmScenario[] = [
  {
    id: "baseline-core-surface",
    title: "baseline tool/resource/prompt server",
    docs: BASE_DOCS,
    prompt: baselinePrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "src/tools/llm_echo.ts",
      "src/resources/(llm)/status.ts",
      "src/prompts/llm_greet.ts",
    ],
    validate: validateDefaultPromptRole,
    verify: verifyCoreSurface,
  },
  {
    id: "custom-paths",
    title: "custom paths for tools/resources/prompts",
    docs: [
      ...BASE_DOCS,
      "apps/website/content/docs/configuration/custom-directories.mdx",
    ],
    prompt: customPathsPrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "lib/xmcp-tools/llm_echo.ts",
      "lib/xmcp-resources/(llm)/status.ts",
      "lib/xmcp-prompts/llm_greet.ts",
    ],
    validate(project) {
      for (const forbidden of [
        "src/tools/llm_echo.ts",
        "src/resources/(llm)/status.ts",
        "src/prompts/llm_greet.ts",
      ]) {
        expect(project.files[forbidden], `${forbidden} should not exist`).toBe(
          undefined
        );
      }
      assertPromptRole(project.files["lib/xmcp-prompts/llm_greet.ts"] ?? "");
    },
    verify: verifyCoreSurface,
  },
  {
    id: "api-key-auth",
    title: "API-key protected HTTP server",
    docs: [
      ...BASE_DOCS,
      "apps/website/content/docs/authentication/api-key.mdx",
    ],
    prompt: apiKeyPrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "src/middleware.ts",
      "src/tools/secure_echo.ts",
    ],
    validate(project) {
      const middleware = project.files["src/middleware.ts"] ?? "";
      expect(middleware).toContain("apiKeyAuthMiddleware");
      expect(middleware).toContain("export default");
      expect(middleware).toContain("llm-secret");
    },
    verify: verifyApiKeyAuth,
  },
  {
    id: "nextjs-adapter",
    title: "Next.js adapter output",
    docs: [...BASE_DOCS, "apps/website/content/docs/adapters/nextjs.mdx"],
    prompt: nextjsAdapterPrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "app/mcp/route.ts",
      "src/tools/llm_echo.ts",
    ],
    verify: verifyNextjsAdapter,
  },
  {
    id: "malformed-input-diagnostics",
    title: "malformed project reports missing tools path",
    docs: [
      ...BASE_DOCS,
      "apps/website/content/docs/configuration/custom-directories.mdx",
    ],
    prompt: malformedDiagnosticsPrompt(),
    requiredFiles: BASE_REQUIRED_FILES,
    expectBuildFailure: true,
    verify: verifyMalformedDiagnostics,
  },
  {
    id: "docs-answer-to-project",
    title: "docs-style request becomes a working project",
    docs: BASE_DOCS,
    prompt: docsAnswerPrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "src/tools/llm_echo.ts",
      "src/resources/(llm)/status.ts",
      "src/prompts/llm_greet.ts",
    ],
    validate: validateDefaultPromptRole,
    verify: verifyCoreSurface,
  },
  {
    id: "jwt-auth",
    title: "JWT protected HTTP server",
    docs: [...BASE_DOCS, "apps/website/content/docs/authentication/jwt.mdx"],
    prompt: jwtAuthPrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "src/middleware.ts",
      "src/tools/secure_echo.ts",
    ],
    validate(project) {
      const middleware = project.files["src/middleware.ts"] ?? "";
      expect(middleware).toContain("jwtAuthMiddleware");
      expect(middleware).toContain("export default");
      expect(middleware).toContain("llm-jwt-secret");
      expect(middleware).toContain("HS256");
    },
    verify: verifyJwtAuth,
  },
  {
    id: "header-aware-middleware",
    title: "custom middleware exposes request headers to tools",
    docs: [
      ...BASE_DOCS,
      "apps/website/content/docs/core-concepts/middlewares.mdx",
    ],
    prompt: headerAwareMiddlewarePrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "src/middleware.ts",
      "src/tools/tenant_echo.ts",
    ],
    validate(project) {
      const middleware = project.files["src/middleware.ts"] ?? "";
      const tool = project.files["src/tools/tenant_echo.ts"] ?? "";
      expect(middleware).toContain("x-tenant-id");
      expect(middleware).toContain("tenant-a");
      expect(middleware).toContain("export default");
      expect(tool).toContain("xmcp/headers");
      expect(tool).toContain("headers()");
    },
    verify: verifyHeaderAwareMiddleware,
  },
  {
    id: "dynamic-resource-template",
    title: "dynamic resource template reads path parameters",
    docs: BASE_DOCS,
    prompt: dynamicResourcePrompt(),
    requiredFiles: [
      ...BASE_REQUIRED_FILES,
      "src/resources/(users)/[userId]/profile.ts",
    ],
    validate(project) {
      const resource =
        project.files["src/resources/(users)/[userId]/profile.ts"] ?? "";
      expect(resource).toContain("userId");
      expect(resource).toContain("z.string");
    },
    verify: verifyDynamicResourceTemplate,
  },
  {
    id: "server-info-template",
    title: "server info template reaches home page and initialize",
    docs: [
      ...BASE_DOCS,
      "apps/website/content/docs/configuration/server-info.mdx",
    ],
    prompt: serverInfoTemplatePrompt(),
    requiredFiles: [...BASE_REQUIRED_FILES, "src/tools/llm_echo.ts"],
    validate(project) {
      const config = project.files["xmcp.config.ts"] ?? "";
      expect(config).toContain("LLM Test Server");
      expect(config).toContain("Generated server-info scenario");
      expect(config).toContain("Call llm_echo before reporting success");
      expect(config).toContain("LLM Home Ready");
    },
    verify: verifyServerInfoTemplate,
  },
  {
    id: "express-adapter",
    title: "Express adapter output",
    docs: [...BASE_DOCS, "apps/website/content/docs/adapters/express.mdx"],
    prompt: expressAdapterPrompt(),
    requiredFiles: [...BASE_REQUIRED_FILES, "src/tools/llm_echo.ts"],
    validate(project) {
      const config = project.files["xmcp.config.ts"] ?? "";
      expect(config).toContain("express");
    },
    verify: (context) =>
      verifyAdapterOutput(context, "express", ["xmcpHandler"]),
  },
  {
    id: "nestjs-adapter",
    title: "NestJS adapter output",
    docs: [...BASE_DOCS, "apps/website/content/docs/adapters/nestjs.mdx"],
    prompt: nestjsAdapterPrompt(),
    requiredFiles: [...BASE_REQUIRED_FILES, "src/tools/llm_echo.ts"],
    validate(project) {
      const config = project.files["xmcp.config.ts"] ?? "";
      expect(config).toContain("nestjs");
    },
    verify: (context) =>
      verifyAdapterOutput(context, "nestjs", ["XmcpService", "XmcpController"]),
  },
  {
    id: "http-cors-config",
    title: "HTTP CORS configuration reaches preflight responses",
    docs: [
      ...BASE_DOCS,
      "apps/website/content/docs/configuration/transports.mdx",
    ],
    prompt: httpCorsPrompt(),
    requiredFiles: [...BASE_REQUIRED_FILES, "src/tools/llm_echo.ts"],
    validate(project) {
      const config = project.files["xmcp.config.ts"] ?? "";
      expect(config).toContain("https://llm.example");
      expect(config).toContain("x-llm-test");
      expect(config).toContain("x-llm-result");
      expect(config).toContain("123");
    },
    verify: verifyHttpCorsConfig,
  },
  {
    id: "stdio-silent-logs",
    title: "stdio silent mode survives tool console logs",
    docs: [
      ...BASE_DOCS,
      "apps/website/content/docs/configuration/transports.mdx",
    ],
    prompt: stdioSilentLogsPrompt(),
    requiredFiles: [...BASE_REQUIRED_FILES, "src/tools/noisy_echo.ts"],
    validate(project) {
      const config = project.files["xmcp.config.ts"] ?? "";
      const tool = project.files["src/tools/noisy_echo.ts"] ?? "";
      expect(config).toContain("silent");
      expect(config).toContain("true");
      expect(tool).toContain("console.log");
    },
    verify: verifyStdioSilentLogs,
  },
];

const ACTIVE_SCENARIOS = SCENARIO_FILTER
  ? SCENARIOS.filter((scenario) => scenario.id === SCENARIO_FILTER)
  : SCENARIOS;

describe.skipIf(!LIVE_ENABLED)(
  "LLM-generated xmcp scenarios (LLM_GENERATED_E2E=1)",
  () => {
    it("has a valid scenario filter", () => {
      if (!SCENARIO_FILTER) return;
      expect(
        ACTIVE_SCENARIOS.length,
        `Unknown LLM_GENERATED_E2E_SCENARIO="${SCENARIO_FILTER}". Valid scenarios: ${SCENARIOS.map((scenario) => scenario.id).join(", ")}`
      ).toBe(1);
    });

    for (const scenario of ACTIVE_SCENARIOS) {
      it(
        scenario.title,
        async () => {
          if (!process.env.OPENROUTER_API_KEY) {
            throw new Error(
              "LLM_GENERATED_E2E=1 requires OPENROUTER_API_KEY in the environment."
            );
          }
          await runScenario(scenario);
        },
        LIVE_TEST_TIMEOUT_MS
      );
    }
  }
);

interface GeneratedProject {
  rationale: LlmRationale;
  files: Record<string, string>;
}

interface LlmRationale {
  summary: string;
  steps: string[];
  docsUsed: string[];
  assumptions: string[];
  expectedChecks: string[];
}

interface LlmScenario {
  id: string;
  title: string;
  docs: string[];
  prompt: string;
  requiredFiles: string[];
  expectBuildFailure?: boolean;
  validate?(project: GeneratedProject): void | Promise<void>;
  verify(context: ScenarioContext): Promise<void>;
}

interface ScenarioContext {
  scenario: LlmScenario;
  project: GeneratedProject;
  projectDir: string;
  artifactsDir: string;
  safeEnv: NodeJS.ProcessEnv;
  build: BuildResult;
  summary: RunSummary;
}

interface RunSummary {
  scenario: string;
  model: string;
  projectDir: string;
  artifactsDir: string;
  rationale: LlmRationale;
  httpUrl?: string;
  checks: string[];
}

async function runScenario(scenario: LlmScenario): Promise<void> {
  const artifactsDir = await prepareArtifactsDir(scenario.id);
  const docs = await readDocsContext(scenario.docs);
  await writeTextArtifact(artifactsDir, "docs-context.md", docs);

  const rawModelResponse = await generateProjectFromDocs({
    docs,
    prompt: scenario.prompt,
    scenarioId: scenario.id,
  });
  await writeTextArtifact(
    artifactsDir,
    "raw-model-response.txt",
    rawModelResponse
  );

  const project = validateGeneratedProject({
    project: parseGeneratedProject(rawModelResponse),
    requiredFiles: scenario.requiredFiles,
  });
  await scenario.validate?.(project);
  await writeJsonArtifact(artifactsDir, "generated-project.json", project);
  await writeJsonArtifact(artifactsDir, "rationale.json", project.rationale);
  await writeTextArtifact(
    artifactsDir,
    "rationale.md",
    formatRationaleMarkdown(project.rationale)
  );

  const projectDir = await writeGeneratedProject(project, scenario.id);
  tempDirs.push(projectDir);
  await linkWorkspaceDeps(projectDir);

  const safeEnv = scrubModelSecrets(process.env);
  const build = await buildAt(projectDir, { env: safeEnv });
  await writeTextArtifact(
    artifactsDir,
    "build/stdout.log",
    build.stdoutChunks.join("")
  );
  await writeTextArtifact(
    artifactsDir,
    "build/stderr.log",
    build.stderrChunks.join("")
  );
  await copyProjectArtifact(projectDir, path.join(artifactsDir, "project"));

  const summary: RunSummary = {
    scenario: scenario.id,
    model: OPENROUTER_MODEL,
    projectDir,
    artifactsDir,
    rationale: project.rationale,
    checks: [],
  };

  const shouldPassBuild = !scenario.expectBuildFailure;
  expect(
    build.exitCode === 0,
    `${scenario.id}: xmcp build ${shouldPassBuild ? "failed" : "succeeded unexpectedly"}.\nstdout:\n${build.stdoutChunks.join("")}\nstderr:\n${build.stderrChunks.join("")}`
  ).toBe(shouldPassBuild);

  await scenario.verify({
    scenario,
    project,
    projectDir,
    artifactsDir,
    safeEnv,
    build,
    summary,
  });

  await writeJsonArtifact(artifactsDir, "summary.json", summary);
  console.info(`LLM-generated E2E artifacts (${scenario.id}): ${artifactsDir}`);
}

async function verifyCoreSurface(context: ScenarioContext): Promise<void> {
  const { artifactsDir, build, projectDir, safeEnv, summary } = context;
  const stdio: McpjamTarget = {
    transport: "stdio",
    command: process.execPath,
    args: [path.join(build.distDir, "stdio.js")],
    cwd: projectDir,
  };
  const httpServer = await spawnHttpEntry(path.join(build.distDir, "http.js"), {
    env: safeEnv,
  });
  handles.push(httpServer);
  summary.httpUrl = httpServer.url;
  const http: McpjamTarget = { transport: "http", url: httpServer.url };

  for (const { label, target } of [
    { label: "stdio", target: stdio },
    { label: "http", target: http },
  ] as const) {
    await assertCoreSurfaceTarget({
      label,
      target,
      artifactsDir,
      safeEnv,
      summary,
    });
  }
}

function validateDefaultPromptRole(project: GeneratedProject): void {
  assertPromptRole(project.files["src/prompts/llm_greet.ts"] ?? "");
}

function assertPromptRole(promptSource: string): void {
  expect(promptSource).toContain("role");
  expect(promptSource).toMatch(/role:\s*["']user["']/);
}

async function verifyApiKeyAuth(context: ScenarioContext): Promise<void> {
  const { artifactsDir, build, safeEnv, summary } = context;
  const httpServer = await spawnHttpEntry(path.join(build.distDir, "http.js"), {
    env: safeEnv,
  });
  handles.push(httpServer);
  summary.httpUrl = httpServer.url;

  const unauthenticated: McpjamTarget = {
    transport: "http",
    url: httpServer.url,
  };
  const authenticated: McpjamTarget = {
    transport: "http",
    url: httpServer.url,
    headers: { "x-api-key": "llm-secret" },
  };

  await expectMcpjamFailure({
    artifactsDir,
    artifactName: "mcpjam/http-unauthenticated-doctor-error.json",
    action: () => mcpjamDoctor(unauthenticated, { env: safeEnv }),
  });
  summary.checks.push("http: unauthenticated request failed");

  const doctor = await mcpjamDoctor(authenticated, { env: safeEnv });
  await writeJsonArtifact(artifactsDir, "mcpjam/http-auth-doctor.json", doctor);
  expect(doctor.status).toBe("ready");
  summary.checks.push("http: authenticated server doctor ready");

  const tools = await mcpjamToolsList(authenticated, { env: safeEnv });
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/http-auth-tools-list.json",
    tools
  );
  expect(tools.tools.map((tool) => tool.name)).toContain("secure_echo");

  const call = await mcpjamToolsCall(
    authenticated,
    "secure_echo",
    { phrase: "docs-built" },
    { env: safeEnv }
  );
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/http-auth-tools-call.json",
    call
  );
  expect(call.content[0]?.text).toContain("secure_echo: docs-built");
  summary.checks.push("http: authenticated secure_echo returned expected text");
}

async function verifyJwtAuth(context: ScenarioContext): Promise<void> {
  const { artifactsDir, build, safeEnv, summary } = context;
  const httpServer = await spawnHttpEntry(path.join(build.distDir, "http.js"), {
    env: safeEnv,
  });
  handles.push(httpServer);
  summary.httpUrl = httpServer.url;

  const unauthenticated: McpjamTarget = {
    transport: "http",
    url: httpServer.url,
  };
  const authenticated: McpjamTarget = {
    transport: "http",
    url: httpServer.url,
    headers: {
      authorization: `Bearer ${signJwtHs256(
        { sub: "llm-user", aud: "xmcp-tests" },
        "llm-jwt-secret"
      )}`,
    },
  };

  await expectMcpjamFailure({
    artifactsDir,
    artifactName: "mcpjam/http-jwt-unauthenticated-doctor-error.json",
    action: () => mcpjamDoctor(unauthenticated, { env: safeEnv }),
  });
  summary.checks.push("http: missing JWT request failed");

  const doctor = await mcpjamDoctor(authenticated, { env: safeEnv });
  await writeJsonArtifact(artifactsDir, "mcpjam/http-jwt-doctor.json", doctor);
  expect(doctor.status).toBe("ready");
  summary.checks.push("http: JWT-authenticated server doctor ready");

  const call = await mcpjamToolsCall(
    authenticated,
    "secure_echo",
    { phrase: "docs-built" },
    { env: safeEnv }
  );
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/http-jwt-tools-call.json",
    call
  );
  expect(call.content[0]?.text).toContain("secure_echo: docs-built");
  summary.checks.push(
    "http: JWT-authenticated secure_echo returned expected text"
  );
}

async function verifyHeaderAwareMiddleware(
  context: ScenarioContext
): Promise<void> {
  const { artifactsDir, build, safeEnv, summary } = context;
  const httpServer = await spawnHttpEntry(path.join(build.distDir, "http.js"), {
    env: safeEnv,
  });
  handles.push(httpServer);
  summary.httpUrl = httpServer.url;

  const missingTenant: McpjamTarget = {
    transport: "http",
    url: httpServer.url,
  };
  const tenantA: McpjamTarget = {
    transport: "http",
    url: httpServer.url,
    headers: { "x-tenant-id": "tenant-a" },
  };

  await expectMcpjamFailure({
    artifactsDir,
    artifactName: "mcpjam/http-missing-tenant-doctor-error.json",
    action: () => mcpjamDoctor(missingTenant, { env: safeEnv }),
  });
  summary.checks.push("http: missing tenant header request failed");

  const doctor = await mcpjamDoctor(tenantA, { env: safeEnv });
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/http-tenant-doctor.json",
    doctor
  );
  expect(doctor.status).toBe("ready");
  summary.checks.push("http: tenant header server doctor ready");

  const call = await mcpjamToolsCall(
    tenantA,
    "tenant_echo",
    { phrase: "docs-built" },
    { env: safeEnv }
  );
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/http-tenant-tools-call.json",
    call
  );
  expect(call.content[0]?.text).toContain("tenant tenant-a: docs-built");
  summary.checks.push("http: tenant_echo read x-tenant-id from headers()");
}

async function verifyNextjsAdapter(context: ScenarioContext): Promise<void> {
  await verifyAdapterOutput(context, "nextjs", ["xmcpHandler"]);
}

async function verifyAdapterOutput(
  context: ScenarioContext,
  adapter: "express" | "nestjs" | "nextjs",
  expectedExports: string[]
): Promise<void> {
  const { artifactsDir, projectDir, summary } = context;
  const xmcpDir = path.join(projectDir, ".xmcp");
  const adapterEntry = path.join(xmcpDir, `adapter-${adapter}.js`);
  const adapterIndexJs = path.join(xmcpDir, "adapter", "index.js");
  const adapterIndexDts = path.join(xmcpDir, "adapter", "index.d.ts");

  await expect(fs.access(adapterEntry)).resolves.toBeUndefined();
  await expect(fs.access(adapterIndexJs)).resolves.toBeUndefined();
  await expect(fs.access(adapterIndexDts)).resolves.toBeUndefined();

  const dts = await fs.readFile(adapterIndexDts, "utf8");
  await writeTextArtifact(artifactsDir, "adapter/index.d.ts", dts);
  for (const expectedExport of expectedExports) {
    expect(dts).toMatch(new RegExp(`\\b${expectedExport}\\b`));
  }
  summary.checks.push(`${adapter}: adapter files emitted`);
  summary.checks.push(`${adapter}: expected type surface emitted`);
}

async function verifyMalformedDiagnostics(
  context: ScenarioContext
): Promise<void> {
  const combined =
    context.build.stdoutChunks.join("") + context.build.stderrChunks.join("");
  await writeTextArtifact(context.artifactsDir, "build/combined.log", combined);
  expect(combined).toMatch(/tools/i);
  expect(combined).toMatch(/does not exist|missing|not found/i);
  context.summary.checks.push("build: missing tools path diagnostic surfaced");
}

async function verifyDynamicResourceTemplate(
  context: ScenarioContext
): Promise<void> {
  const { artifactsDir, build, projectDir, safeEnv, summary } = context;
  const stdio: McpjamTarget = {
    transport: "stdio",
    command: process.execPath,
    args: [path.join(build.distDir, "stdio.js")],
    cwd: projectDir,
  };
  const httpServer = await spawnHttpEntry(path.join(build.distDir, "http.js"), {
    env: safeEnv,
  });
  handles.push(httpServer);
  summary.httpUrl = httpServer.url;
  const http: McpjamTarget = { transport: "http", url: httpServer.url };

  for (const { label, target } of [
    { label: "stdio", target: stdio },
    { label: "http", target: http },
  ] as const) {
    const doctor = await mcpjamDoctor(target, { env: safeEnv });
    await writeJsonArtifact(
      artifactsDir,
      `mcpjam/${label}-dynamic-doctor.json`,
      doctor
    );
    expect(doctor.status).toBe("ready");

    const read = await mcpjamResourceRead(target, "users://ada/profile", {
      env: safeEnv,
    });
    await writeJsonArtifact(
      artifactsDir,
      `mcpjam/${label}-dynamic-resource-read.json`,
      read
    );
    expect((read.content.contents[0]?.text ?? "").toLowerCase()).toContain(
      "profile for ada"
    );
    summary.checks.push(`${label}: dynamic resource read userId from URI`);
  }
}

async function verifyServerInfoTemplate(
  context: ScenarioContext
): Promise<void> {
  const { artifactsDir, build, safeEnv, summary } = context;
  const httpServer = await spawnHttpEntry(path.join(build.distDir, "http.js"), {
    env: safeEnv,
  });
  handles.push(httpServer);
  summary.httpUrl = httpServer.url;

  const home = await fetch(httpServer.url.replace(/\/mcp$/, "/"));
  const homeText = await home.text();
  await writeTextArtifact(artifactsDir, "http/home.html", homeText);
  expect(home.status).toBe(200);
  expect(homeText).toContain("LLM Home Ready");
  summary.checks.push("http: custom home page served");

  const initialize = await postJsonRpc(httpServer.url, {
    jsonrpc: "2.0",
    id: "server-info-init",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "vitest", version: "1.0.0" },
    },
  });
  await writeJsonArtifact(artifactsDir, "jsonrpc/initialize.json", {
    status: initialize.status,
    body: initialize.body,
  });
  expect(initialize.status).toBe(200);

  const result = getJsonRpcResult(initialize.body) as {
    serverInfo?: { name?: string; description?: string };
    instructions?: string;
  };
  expect(result.serverInfo?.name).toBe("LLM Test Server");
  expect(result.serverInfo?.description).toContain(
    "Generated server-info scenario"
  );
  expect(result.instructions).toContain(
    "Call llm_echo before reporting success"
  );
  summary.checks.push("http: initialize returned serverInfo and instructions");
}

async function verifyHttpCorsConfig(context: ScenarioContext): Promise<void> {
  const { artifactsDir, build, safeEnv, summary } = context;
  const httpServer = await spawnHttpEntry(path.join(build.distDir, "http.js"), {
    env: safeEnv,
  });
  handles.push(httpServer);
  summary.httpUrl = httpServer.url;

  const preflight = await fetch(httpServer.url, {
    method: "OPTIONS",
    headers: {
      Origin: "https://llm.example",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "x-llm-test",
    },
  });
  const headers = Object.fromEntries(preflight.headers.entries());
  await writeJsonArtifact(artifactsDir, "http/cors-preflight.json", {
    status: preflight.status,
    headers,
  });
  expect(preflight.status).toBe(204);
  expect(preflight.headers.get("access-control-allow-origin")).toBe(
    "https://llm.example"
  );
  expect(preflight.headers.get("access-control-allow-methods")).toContain(
    "POST"
  );
  expect(preflight.headers.get("access-control-allow-headers")).toContain(
    "x-llm-test"
  );
  expect(preflight.headers.get("access-control-expose-headers")).toContain(
    "x-llm-result"
  );
  expect(preflight.headers.get("access-control-allow-credentials")).toBe(
    "true"
  );
  expect(preflight.headers.get("access-control-max-age")).toBe("123");
  summary.checks.push("http: configured CORS preflight headers returned");

  const target: McpjamTarget = { transport: "http", url: httpServer.url };
  const call = await mcpjamToolsCall(
    target,
    "llm_echo",
    { phrase: "docs-built" },
    { env: safeEnv }
  );
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/http-cors-tools-call.json",
    call
  );
  expect(call.content[0]?.text).toContain("llm_echo: docs-built");
  summary.checks.push("http: CORS-configured server handled MCP tool call");
}

async function verifyStdioSilentLogs(context: ScenarioContext): Promise<void> {
  const { artifactsDir, build, projectDir, safeEnv, summary } = context;
  const stdio: McpjamTarget = {
    transport: "stdio",
    command: process.execPath,
    args: [path.join(build.distDir, "stdio.js")],
    cwd: projectDir,
  };
  const doctor = await mcpjamDoctor(stdio, { env: safeEnv });
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/stdio-silent-doctor.json",
    doctor
  );
  expect(doctor.status).toBe("ready");
  summary.checks.push("stdio: silent server doctor ready");

  const call = await mcpjamToolsCall(
    stdio,
    "noisy_echo",
    { phrase: "docs-built" },
    { env: safeEnv }
  );
  await writeJsonArtifact(
    artifactsDir,
    "mcpjam/stdio-silent-tools-call.json",
    call
  );
  expect(call.content[0]?.text).toContain("noisy_echo: docs-built");
  summary.checks.push("stdio: noisy tool logs did not corrupt protocol");
}

async function assertCoreSurfaceTarget(options: {
  label: "stdio" | "http";
  target: McpjamTarget;
  artifactsDir: string;
  safeEnv: NodeJS.ProcessEnv;
  summary: RunSummary;
}): Promise<void> {
  const { label, target, artifactsDir, safeEnv, summary } = options;
  const doctor = await mcpjamDoctor(target, { env: safeEnv });
  await writeJsonArtifact(artifactsDir, `mcpjam/${label}-doctor.json`, doctor);
  expect(doctor.status).toBe("ready");
  summary.checks.push(`${label}: server doctor ready`);

  const tools = await mcpjamToolsList(target, { env: safeEnv });
  await writeJsonArtifact(
    artifactsDir,
    `mcpjam/${label}-tools-list.json`,
    tools
  );
  expect(tools.tools.map((tool) => tool.name)).toContain("llm_echo");
  const call = await mcpjamToolsCall(
    target,
    "llm_echo",
    { phrase: "docs-built" },
    { env: safeEnv }
  );
  await writeJsonArtifact(
    artifactsDir,
    `mcpjam/${label}-tools-call.json`,
    call
  );
  expect(call.content[0]?.text).toContain("llm_echo: docs-built");
  summary.checks.push(`${label}: llm_echo returned expected text`);

  const resources = await mcpjamResourcesList(target, { env: safeEnv });
  await writeJsonArtifact(
    artifactsDir,
    `mcpjam/${label}-resources-list.json`,
    resources
  );
  expect(resources.resources.map((resource) => resource.uri)).toContain(
    "llm://status"
  );
  const read = await mcpjamResourceRead(target, "llm://status", {
    env: safeEnv,
  });
  await writeJsonArtifact(
    artifactsDir,
    `mcpjam/${label}-resource-read.json`,
    read
  );
  expect((read.content.contents[0]?.text ?? "").toLowerCase()).toContain(
    "llm resource ready"
  );
  summary.checks.push(`${label}: llm://status returned expected text`);

  const prompts = await mcpjamPromptsList(target, { env: safeEnv });
  await writeJsonArtifact(
    artifactsDir,
    `mcpjam/${label}-prompts-list.json`,
    prompts
  );
  expect(prompts.prompts.map((prompt) => prompt.name)).toContain("llm_greet");
  const prompt = await mcpjamPromptGet(
    target,
    "llm_greet",
    { name: "xmcp" },
    { env: safeEnv }
  );
  await writeJsonArtifact(
    artifactsDir,
    `mcpjam/${label}-prompt-get.json`,
    prompt
  );
  expect(prompt.content.messages[0]?.content.text ?? "").toContain(
    "LLM says hello, xmcp"
  );
  summary.checks.push(`${label}: llm_greet returned expected text`);
}

async function expectMcpjamFailure(options: {
  artifactsDir: string;
  artifactName: string;
  action(): Promise<unknown>;
}): Promise<void> {
  try {
    const value = await options.action();
    await writeJsonArtifact(options.artifactsDir, options.artifactName, {
      unexpectedSuccess: value,
    });
    throw new Error("Expected mcpjam command to fail, but it succeeded.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await writeJsonArtifact(options.artifactsDir, options.artifactName, {
      error: message,
    });
    expect(message).toMatch(/exited|unauthorized|401|403|invalid|api key/i);
  }
}

function signJwtHs256(
  payload: Record<string, unknown>,
  secret: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body = { iat: now, exp: now + 3600, ...payload };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(body)}`;
  const signature = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function getJsonRpcResult(body: unknown): unknown {
  if (typeof body === "string") {
    const dataLine = body
      .split("\n")
      .find((line) => line.trim().startsWith("data:"));
    if (dataLine) {
      return getJsonRpcResult(JSON.parse(dataLine.replace(/^data:\s*/, "")));
    }
  }
  if (body && typeof body === "object" && "result" in body) {
    return (body as { result: unknown }).result;
  }
  throw new Error(`JSON-RPC response did not include a result.`);
}

async function readDocsContext(docPaths: string[]): Promise<string> {
  const chunks = await Promise.all(
    docPaths.map(async (docPath) => {
      const absolute = path.join(REPO_ROOT, docPath);
      const text = await fs.readFile(absolute, "utf8");
      return `# ${docPath}\n\n${stripFrontmatter(text)}`;
    })
  );
  return chunks.join("\n\n").slice(0, DOC_CONTEXT_CHAR_LIMIT);
}

function stripFrontmatter(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

function validRationale(): LlmRationale {
  return {
    summary: "Generated a minimal xmcp project from the docs.",
    steps: ["Configured xmcp and added the requested surface files."],
    docsUsed: ["apps/website/content/docs/tools.mdx tool metadata"],
    assumptions: ["The local workspace provides xmcp and zod dependencies."],
    expectedChecks: ["xmcp build validates the generated project."],
  };
}

function formatRationaleMarkdown(rationale: LlmRationale): string {
  return [
    "# LLM Rationale",
    "",
    rationale.summary,
    "",
    "## Steps",
    ...rationale.steps.map((step) => `- ${step}`),
    "",
    "## Docs Used",
    ...rationale.docsUsed.map((doc) => `- ${doc}`),
    "",
    "## Assumptions",
    ...rationale.assumptions.map((assumption) => `- ${assumption}`),
    "",
    "## Expected Checks",
    ...rationale.expectedChecks.map((check) => `- ${check}`),
    "",
  ].join("\n");
}

async function generateProjectFromDocs(options: {
  docs: string;
  prompt: string;
  scenarioId: string;
}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    OPENROUTER_REQUEST_TIMEOUT_MS
  );
  timer.unref();

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/basementstudio/xmcp",
          "X-Title": `xmcp LLM generated e2e: ${options.scenarioId}`,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          temperature: 0.1,
          max_tokens: 5_500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You generate small TypeScript xmcp projects from docs. Return only valid JSON. Include concise audit rationale, not hidden chain-of-thought. Do not include markdown.",
            },
            {
              role: "user",
              content: `${options.prompt}\n\nDocs:\n${options.docs}`,
            },
          ],
        }),
      }
    );

    const payload = (await response
      .json()
      .catch(() => null)) as OpenRouterResponse | null;
    if (!response.ok) {
      throw new Error(
        `OpenRouter request failed with ${response.status}: ${JSON.stringify(payload)}`
      );
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`OpenRouter response did not include content.`);
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function baselinePrompt(): string {
  return `${projectJsonInstructions()}

Create a minimal xmcp server project.

Required behavior:
- The project must build with xmcp.
- Enable both http and stdio transports.
- Create a tool named "llm_echo" in src/tools/llm_echo.ts.
- The tool must accept { phrase: string } and return exactly "llm_echo: <phrase>".
- Create a resource at src/resources/(llm)/status.ts with metadata name "status".
- The resource URI must be "llm://status" and reading it must include "llm resource ready".
- Create a prompt named "llm_greet" in src/prompts/llm_greet.ts.
- The prompt must accept { name: string } and render text containing "LLM says hello, <name>".
- The prompt metadata must set role: "user".
- Use zod schemas where xmcp docs show schemas.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/tools/llm_echo.ts
- src/resources/(llm)/status.ts
- src/prompts/llm_greet.ts`;
}

function customPathsPrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp server project that proves you understand custom directories.

Required behavior:
- Enable both http and stdio transports.
- In xmcp.config.ts, set paths.tools to "lib/xmcp-tools", paths.resources to "lib/xmcp-resources", and paths.prompts to "lib/xmcp-prompts".
- Do not create src/tools, src/resources, or src/prompts files.
- Create a tool named "llm_echo" in lib/xmcp-tools/llm_echo.ts.
- The tool must accept { phrase: string } and return exactly "llm_echo: <phrase>".
- Create a resource at lib/xmcp-resources/(llm)/status.ts with metadata name "status".
- The resource URI must be "llm://status" and reading it must include "llm resource ready".
- Create a prompt named "llm_greet" in lib/xmcp-prompts/llm_greet.ts.
- The prompt must accept { name: string } and render text containing "LLM says hello, <name>".
- The prompt metadata must set role: "user".

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- lib/xmcp-tools/llm_echo.ts
- lib/xmcp-resources/(llm)/status.ts
- lib/xmcp-prompts/llm_greet.ts`;
}

function apiKeyPrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp HTTP server protected by API-key middleware.

Required behavior:
- Enable http transport.
- Stdio may be disabled.
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Create src/middleware.ts using apiKeyAuthMiddleware from xmcp.
- src/middleware.ts must import { apiKeyAuthMiddleware, type Middleware } from "xmcp".
- src/middleware.ts must default-export the middleware, for example:
  const middleware: Middleware = apiKeyAuthMiddleware({ headerName: "x-api-key", apiKey: "llm-secret" });
  export default middleware;
- The middleware must require header "x-api-key" with value "llm-secret".
- Create a tool named "secure_echo" in src/tools/secure_echo.ts.
- The tool must accept { phrase: string } and return exactly "secure_echo: <phrase>".
- Do not create resources or prompts.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/middleware.ts
- src/tools/secure_echo.ts`;
}

function nextjsAdapterPrompt(): string {
  return `${projectJsonInstructions()}

Create a minimal xmcp project configured for the Next.js adapter.

Required behavior:
- In xmcp.config.ts, enable http and set experimental.adapter to "nextjs".
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Create app/mcp/route.ts that imports xmcpHandler from "@xmcp/adapter" and exports it as GET and POST.
- Create a tool named "llm_echo" in src/tools/llm_echo.ts.
- The tool must accept { phrase: string } and return exactly "llm_echo: <phrase>".
- Include a tsconfig path mapping for "@xmcp/*" to "./.xmcp/*".

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- app/mcp/route.ts
- src/tools/llm_echo.ts`;
}

function malformedDiagnosticsPrompt(): string {
  return `${projectJsonInstructions()}

Create a deliberately malformed xmcp project for testing diagnostics.

Required behavior:
- The project should be valid JSON as a file map, but xmcp build must fail.
- In xmcp.config.ts, configure paths.tools to "missing-tools".
- Do not create the missing-tools directory or any tool file.
- Disable prompts and resources.
- Enable stdio or http; either is fine.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts`;
}

function docsAnswerPrompt(): string {
  return `${projectJsonInstructions()}

Act like a documentation reader. Answer this user request by generating a complete xmcp project:
"Build me a small xmcp server with a tool, a resource, a prompt, and both transports."

The generated project must still satisfy this observable contract:
- It must include src/tools/llm_echo.ts.
- It must include src/resources/(llm)/status.ts.
- It must include src/prompts/llm_greet.ts.
- It must expose a tool named "llm_echo" that accepts { phrase: string } and returns exactly "llm_echo: <phrase>".
- It must expose a resource with URI "llm://status" whose text includes "llm resource ready".
- To produce the "llm://status" resource URI with default resource paths, use src/resources/(llm)/status.ts.
- It must expose a prompt named "llm_greet" that accepts { name: string } and renders text containing "LLM says hello, <name>".
- The prompt metadata must set role: "user".
- It must build with xmcp and work over both stdio and http.

You may choose the file paths based on the docs, but stay inside package.json, tsconfig.json, xmcp.config.ts, src/, lib/, app/, tools/, resources/, or prompts/.`;
}

function jwtAuthPrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp HTTP server protected by JWT middleware.

Required behavior:
- Enable http transport.
- Stdio may be disabled.
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Create src/middleware.ts using jwtAuthMiddleware from xmcp.
- src/middleware.ts must import { jwtAuthMiddleware, type Middleware } from "xmcp".
- src/middleware.ts must default-export the middleware.
- Configure jwtAuthMiddleware with secret "llm-jwt-secret" and algorithms: ["HS256"].
- Do not read the JWT secret from process.env.
- Create a tool named "secure_echo" in src/tools/secure_echo.ts.
- The tool must accept { phrase: string } and return exactly "secure_echo: <phrase>".
- Do not create resources or prompts.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/middleware.ts
- src/tools/secure_echo.ts`;
}

function headerAwareMiddlewarePrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp HTTP server that proves custom middleware and xmcp/headers work together.

Required behavior:
- Enable http transport.
- Stdio may be disabled because xmcp/headers only works inside HTTP request context.
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Create src/middleware.ts with a custom Middleware from xmcp.
- The middleware must require request header "x-tenant-id" to equal "tenant-a".
- If the header is missing or different, respond with HTTP 401 and JSON { error: "Invalid tenant" }, then return without calling next().
- If the header is valid, call next().
- Create a tool named "tenant_echo" in src/tools/tenant_echo.ts.
- The tool must import { headers } from "xmcp/headers".
- The tool must accept { phrase: string } and return exactly "tenant <tenant>: <phrase>", where <tenant> comes from headers()["x-tenant-id"].
- Do not create resources or prompts.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/middleware.ts
- src/tools/tenant_echo.ts`;
}

function dynamicResourcePrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp server project that proves you understand dynamic resource URI templates.

Required behavior:
- Enable both http and stdio transports.
- In xmcp.config.ts, set paths.tools to false, paths.prompts to false, and paths.resources to "src/resources".
- Create a dynamic resource at src/resources/(users)/[userId]/profile.ts.
- The resource URI template must be "users://{userId}/profile".
- Use a zod schema with userId: z.string().
- The resource handler must return exactly "profile for <userId>".
- Do not create tools or prompts.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/resources/(users)/[userId]/profile.ts`;
}

function serverInfoTemplatePrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp HTTP server project that proves you understand server-info template configuration.

Required behavior:
- Enable http transport.
- Stdio may be disabled.
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- In xmcp.config.ts, configure template.name exactly "LLM Test Server".
- Configure template.description to include exactly "Generated server-info scenario".
- Configure template.instructions to include exactly "Call llm_echo before reporting success".
- Configure template.homePage as inline HTML that includes "LLM Home Ready".
- Create a tool named "llm_echo" in src/tools/llm_echo.ts.
- The tool must accept { phrase: string } and return exactly "llm_echo: <phrase>".
- Do not create resources or prompts.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/tools/llm_echo.ts`;
}

function expressAdapterPrompt(): string {
  return `${projectJsonInstructions()}

Create a minimal xmcp project configured for the Express adapter.

Required behavior:
- In xmcp.config.ts, enable http and set experimental.adapter to "express".
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Do not create an Express app file and do not add express as a package dependency; this test only verifies xmcp adapter output.
- Create a tool named "llm_echo" in src/tools/llm_echo.ts.
- The tool must accept { phrase: string } and return exactly "llm_echo: <phrase>".
- Include a tsconfig path mapping for "@xmcp/*" to "./.xmcp/*".

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/tools/llm_echo.ts`;
}

function nestjsAdapterPrompt(): string {
  return `${projectJsonInstructions()}

Create a minimal xmcp project configured for the NestJS adapter.

Required behavior:
- In xmcp.config.ts, enable http and set experimental.adapter to "nestjs".
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Do not create a NestJS app file and do not add NestJS packages as package dependencies; this test only verifies xmcp adapter output.
- Create a tool named "llm_echo" in src/tools/llm_echo.ts.
- The tool must accept { phrase: string } and return exactly "llm_echo: <phrase>".
- Include a tsconfig path mapping for "@xmcp/*" to "./.xmcp/*".

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/tools/llm_echo.ts`;
}

function httpCorsPrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp HTTP server project that proves you understand CORS transport configuration.

Required behavior:
- Enable http transport with an object config.
- Set http.cors.origin to "https://llm.example".
- Set http.cors.methods to ["POST", "OPTIONS"].
- Set http.cors.allowedHeaders to include "Content-Type" and "x-llm-test".
- Set http.cors.exposedHeaders to include "x-llm-result".
- Set http.cors.credentials to true.
- Set http.cors.maxAge to 123.
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Create a tool named "llm_echo" in src/tools/llm_echo.ts.
- The tool must accept { phrase: string } and return exactly "llm_echo: <phrase>".
- Do not create resources or prompts.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/tools/llm_echo.ts`;
}

function stdioSilentLogsPrompt(): string {
  return `${projectJsonInstructions()}

Create an xmcp stdio server project that proves you understand stdio silent mode.

Required behavior:
- Enable stdio transport with { silent: true }.
- HTTP may be disabled.
- In xmcp.config.ts, set paths.tools to "src/tools", paths.prompts to false, and paths.resources to false.
- Create a tool named "noisy_echo" in src/tools/noisy_echo.ts.
- The tool must accept { phrase: string }.
- Inside the tool handler, call console.log with any debug message before returning.
- The tool must return exactly "noisy_echo: <phrase>".
- Do not create resources or prompts.

Required files:
- package.json
- tsconfig.json
- xmcp.config.ts
- src/tools/noisy_echo.ts`;
}

function projectJsonInstructions(): string {
  return `Return only this JSON shape:
{
  "rationale": {
    "summary": "brief implementation summary",
    "steps": [
      "concise observable implementation step"
    ],
    "docsUsed": [
      "docs/page.md section or concept used"
    ],
    "assumptions": [
      "concise assumption made from the docs"
    ],
    "expectedChecks": [
      "observable behavior the test should verify"
    ]
  },
  "files": {
    "relative/path.ext": "file contents"
  }
}

General requirements:
- Do not include markdown fences.
- The rationale is an audit summary, not hidden chain-of-thought. Keep each item concise and focused on docs used, implementation choices, assumptions, and expected test behavior.
- Use TypeScript.
- Keep package dependencies to xmcp and zod only.
- Do not set "type": "module" in package.json. The generated xmcp production server is executed as CommonJS by this test.
- Do not include lockfiles, node_modules, generated dist files, or absolute paths.
- The test invokes xmcp build directly; package scripts will not be run.`;
}

function parseGeneratedProject(text: string): GeneratedProject {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const jsonText = fenced?.[1] ?? trimmed;
  return JSON.parse(jsonText) as GeneratedProject;
}

function validateGeneratedProject(options: {
  project: GeneratedProject;
  requiredFiles: string[];
}): GeneratedProject {
  const { project, requiredFiles } = options;
  if (!project || typeof project !== "object" || !project.files) {
    throw new Error("Generated project must contain a files object.");
  }
  validateRationale(project.rationale);
  validatePackageJson(project.files["package.json"]);
  for (const [relativePath, contents] of Object.entries(project.files)) {
    assertSafeGeneratedPath(relativePath);
    if (typeof contents !== "string") {
      throw new Error(
        `Generated file ${relativePath} must have string contents.`
      );
    }
  }
  for (const required of requiredFiles) {
    if (!Object.prototype.hasOwnProperty.call(project.files, required)) {
      throw new Error(`Generated project missing required file: ${required}`);
    }
  }
  return project;
}

function validatePackageJson(packageJson: string | undefined): void {
  if (packageJson === undefined) {
    return;
  }
  let parsed: { type?: unknown };
  try {
    parsed = JSON.parse(packageJson) as { type?: unknown };
  } catch {
    return;
  }
  if (parsed.type === "module") {
    throw new Error('Generated package.json must not set "type": "module".');
  }
}

function validateRationale(rationale: LlmRationale): void {
  if (!rationale || typeof rationale !== "object") {
    throw new Error("Generated project must contain a rationale object.");
  }
  assertNonEmptyString(rationale.summary, "rationale.summary");
  assertNonEmptyStringArray(rationale.steps, "rationale.steps");
  assertNonEmptyStringArray(rationale.docsUsed, "rationale.docsUsed");
  assertNonEmptyStringArray(rationale.assumptions, "rationale.assumptions");
  assertNonEmptyStringArray(
    rationale.expectedChecks,
    "rationale.expectedChecks"
  );
}

function assertNonEmptyString(value: unknown, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Generated project must include non-empty ${label}.`);
  }
}

function assertNonEmptyStringArray(value: unknown, label: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Generated project must include non-empty ${label}.`);
  }
  for (const [index, item] of value.entries()) {
    assertNonEmptyString(item, `${label}[${index}]`);
  }
}

function assertSafeGeneratedPath(relativePath: string): void {
  if (
    path.isAbsolute(relativePath) ||
    relativePath.includes("..") ||
    relativePath.includes("\\")
  ) {
    throw new Error(`Generated project contains unsafe path: ${relativePath}`);
  }
  const basename = path.basename(relativePath);
  if (
    basename === "package-lock.json" ||
    basename === "pnpm-lock.yaml" ||
    basename === "yarn.lock" ||
    relativePath.includes("node_modules") ||
    relativePath.startsWith("dist/") ||
    relativePath.startsWith(".xmcp/")
  ) {
    throw new Error(
      `Generated project contains unsupported path: ${relativePath}`
    );
  }
  const allowed =
    relativePath === "package.json" ||
    relativePath === "tsconfig.json" ||
    relativePath === "xmcp.config.ts" ||
    relativePath === "xmcp-env.d.ts" ||
    relativePath.startsWith("src/") ||
    relativePath.startsWith("lib/") ||
    relativePath.startsWith("app/") ||
    relativePath.startsWith("tools/") ||
    relativePath.startsWith("resources/") ||
    relativePath.startsWith("prompts/");
  if (!allowed) {
    throw new Error(
      `Generated project contains unsupported path: ${relativePath}`
    );
  }
}

async function writeGeneratedProject(
  project: GeneratedProject,
  scenarioId: string
): Promise<string> {
  const projectDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `xmcp-llm-${scenarioId}-`)
  );
  for (const [relativePath, contents] of Object.entries(project.files)) {
    const absolute = path.join(projectDir, relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, contents, "utf8");
  }
  return projectDir;
}

async function prepareArtifactsDir(scenarioId: string): Promise<string> {
  const dir = path.join(ARTIFACTS_ROOT, scenarioId);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeTextArtifact(
  artifactsDir: string,
  relativePath: string,
  contents: string
): Promise<void> {
  const absolute = path.join(artifactsDir, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, contents, "utf8");
}

async function writeJsonArtifact(
  artifactsDir: string,
  relativePath: string,
  value: unknown
): Promise<void> {
  await writeTextArtifact(
    artifactsDir,
    relativePath,
    `${JSON.stringify(value, null, 2)}\n`
  );
}

async function copyProjectArtifact(
  projectDir: string,
  artifactProjectDir: string
): Promise<void> {
  await fs.rm(artifactProjectDir, { recursive: true, force: true });
  await fs.cp(projectDir, artifactProjectDir, {
    recursive: true,
    filter: (entry) => path.basename(entry) !== "node_modules",
  });
}

async function linkWorkspaceDeps(projectDir: string): Promise<void> {
  const nodeModules = path.join(projectDir, "node_modules");
  await fs.mkdir(path.join(nodeModules, ".bin"), { recursive: true });
  await fs.symlink(PACKAGE_ROOT, path.join(nodeModules, "xmcp"));
  const zodPackage = requireFromTest.resolve("zod/package.json");
  await fs.symlink(path.dirname(zodPackage), path.join(nodeModules, "zod"));
}

function scrubModelSecrets(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const scrubbed: NodeJS.ProcessEnv = { ...env };
  for (const key of Object.keys(scrubbed)) {
    if (key.includes("OPENROUTER") || key.includes("OPENAI")) {
      delete scrubbed[key];
    }
  }
  return scrubbed;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}
