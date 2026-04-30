import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildFixture,
  mcpjamDoctor,
  mcpjamPromptGet,
  mcpjamPromptsList,
  mcpjamResourceRead,
  mcpjamResourcesList,
  mcpjamStdioTarget,
  mcpjamToolsCall,
  mcpjamToolsList,
  spawnHttpServer,
  type McpjamTarget,
  type ServerHandle,
} from "./_utils";

// End-to-end conformance suite: drives built fixtures through `@mcpjam/cli`
// (a real third-party MCP client) across both transports and the full
// tool/resource/prompt surface. Tests tagged [fast] are exercised on every
// PR via `pnpm e2e:fast`; the full suite runs on canary/main and on PRs
// labeled `full-e2e` via `pnpm e2e:full`. Both scripts set MCPJAM_E2E=1.
// Without the env, `pnpm test` skips this file so the default suite stays
// independent of @mcpjam/cli network/cold-start variance.

const E2E_ENABLED = process.env.MCPJAM_E2E === "1";

describe.skipIf(!E2E_ENABLED)(
  "mcpjam conformance — basic-tools fixture (tools-only)",
  () => {
    let httpServer: ServerHandle;
    const stdio = mcpjamStdioTarget("basic-tools");
    let http: McpjamTarget;

    beforeAll(async () => {
      const built = await buildFixture("basic-tools");
      expect(built.exitCode).toBe(0);
      httpServer = await spawnHttpServer("basic-tools");
      http = { transport: "http", url: httpServer.url };
    }, 90_000);

    afterAll(async () => {
      await httpServer?.stop();
    });

    it("[fast] server doctor (stdio) reports ready with the echo tool", async () => {
      const report = await mcpjamDoctor(stdio);
      expect(report.status).toBe("ready");
      expect(report.connection.status).toBe("connected");
      expect(report.tools.map((t) => t.name)).toContain("echo");
      expect(report.checks.tools?.status).toBe("ok");
    });

    it("[fast] tools call echo (stdio) round-trips the message", async () => {
      const result = await mcpjamToolsCall(stdio, "echo", { message: "ping" });
      expect(result.content[0]?.text).toBe("echo: ping");
    });

    it("server doctor (http) reports ready", async () => {
      const report = await mcpjamDoctor(http);
      expect(report.status).toBe("ready");
      expect(report.tools.map((t) => t.name)).toContain("echo");
    });

    it("tools call echo (http) round-trips the message", async () => {
      const result = await mcpjamToolsCall(http, "echo", { message: "pong" });
      expect(result.content[0]?.text).toBe("echo: pong");
    });
  }
);

describe.skipIf(!E2E_ENABLED)(
  "mcpjam conformance — mcpjam-testbed fixture (full surface)",
  () => {
    let httpServer: ServerHandle;
    const stdio = mcpjamStdioTarget("mcpjam-testbed");
    let http: McpjamTarget;

    beforeAll(async () => {
      const built = await buildFixture("mcpjam-testbed");
      expect(built.exitCode).toBe(0);
      httpServer = await spawnHttpServer("mcpjam-testbed");
      http = { transport: "http", url: httpServer.url };
    }, 90_000);

    afterAll(async () => {
      await httpServer?.stop();
    });

    for (const transport of ["stdio", "http"] as const) {
      describe(`${transport} transport`, () => {
        const target = (): McpjamTarget =>
          transport === "stdio" ? stdio : http;

        it(`[fast] server doctor surfaces tool, resource, and prompt`, async () => {
          const report = await mcpjamDoctor(target());
          expect(report.status).toBe("ready");
          expect(report.tools.map((t) => t.name)).toContain("echo");
          expect(report.resources.map((r) => r.uri)).toContain(
            "testbed://readme"
          );
          expect(report.prompts.map((p) => p.name)).toContain("greet");
          expect(report.checks.tools?.status).toBe("ok");
          expect(report.checks.resources?.status).toBe("ok");
          expect(report.checks.prompts?.status).toBe("ok");
        });

        it("tools list returns the echo tool", async () => {
          const result = await mcpjamToolsList(target());
          expect(result.tools.map((t) => t.name)).toContain("echo");
        });

        it("tools call echo returns the message", async () => {
          const result = await mcpjamToolsCall(target(), "echo", {
            message: `via-${transport}`,
          });
          expect(result.content[0]?.text).toBe(`echo: via-${transport}`);
        });

        it("resources list returns the readme", async () => {
          const result = await mcpjamResourcesList(target());
          expect(result.resources.map((r) => r.uri)).toContain(
            "testbed://readme"
          );
        });

        it("resources read returns the readme contents", async () => {
          const result = await mcpjamResourceRead(target(), "testbed://readme");
          const contents = result.content.contents;
          expect(contents.length).toBeGreaterThan(0);
          expect(contents[0]?.uri).toBe("testbed://readme");
          expect(contents[0]?.text ?? "").toContain("mcpjam-testbed readme");
        });

        it("prompts list returns the greet prompt", async () => {
          const result = await mcpjamPromptsList(target());
          expect(result.prompts.map((p) => p.name)).toContain("greet");
        });

        it("prompts get renders the greeting", async () => {
          const result = await mcpjamPromptGet(target(), "greet", {
            name: "world",
          });
          const messages = result.content.messages;
          expect(messages.length).toBeGreaterThan(0);
          expect(messages[0]?.content.text ?? "").toContain("Hello, world!");
        });
      });
    }
  }
);
