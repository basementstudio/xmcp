import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { generateConfig } from "../../src/helpers/generate-config.js";

describe("generateConfig", () => {
  let tempDir: string;
  let projectPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-test-"));
    projectPath = tempDir;
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  it("should generate config with all paths set to false when all paths are skipped", () => {
    generateConfig(projectPath, "nextjs");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("paths: {");
    expect(configContent).toContain("tools: false");
    expect(configContent).toContain("prompts: false");
    expect(configContent).toContain("resources: false");

    const pathsMatches = configContent.match(/paths:/g);
    expect(pathsMatches).toHaveLength(1);
  });

  it("should generate config with tools path set and prompts/resources as false", () => {
    generateConfig(projectPath, "nextjs", "./tools");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("paths: {");
    expect(configContent).toContain('tools: "./tools"');
    expect(configContent).toContain("prompts: false");
    expect(configContent).toContain("resources: false");

    const pathsMatches = configContent.match(/paths:/g);
    expect(pathsMatches).toHaveLength(1);
  });

  it("should generate config with prompts path set and tools/resources as false", () => {
    generateConfig(projectPath, "nextjs", undefined, "./prompts");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("paths: {");
    expect(configContent).toContain('prompts: "./prompts"');
    expect(configContent).toContain("tools: false");
    expect(configContent).toContain("resources: false");

    const pathsMatches = configContent.match(/paths:/g);
    expect(pathsMatches).toHaveLength(1);
  });

  it("should generate config with all paths set to their string values when all are provided", () => {
    generateConfig(
      projectPath,
      "nextjs",
      "./tools",
      "./prompts",
      "./resources"
    );

    const configPath = path.join(projectPath, "xmcp.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("paths: {");
    expect(configContent).toContain('tools: "./tools"');
    expect(configContent).toContain('prompts: "./prompts"');
    expect(configContent).toContain('resources: "./resources"');

    const pathsMatches = configContent.match(/paths:/g);
    expect(pathsMatches).toHaveLength(1);
  });

  it("should generate config with only resources path set and tools/prompts as false", () => {
    generateConfig(
      projectPath,
      "nextjs",
      undefined,
      undefined,
      "./resources"
    );

    const configPath = path.join(projectPath, "xmcp.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("paths: {");
    expect(configContent).toContain("tools: false");
    expect(configContent).toContain("prompts: false");
    expect(configContent).toContain('resources: "./resources"');

    const pathsMatches = configContent.match(/paths:/g);
    expect(pathsMatches).toHaveLength(1);
  });

  it("should generate config with mixed paths (tools and resources set, prompts false)", () => {
    generateConfig(projectPath, "nextjs", "./tools", undefined, "./resources");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("paths: {");
    expect(configContent).toContain('tools: "./tools"');
    expect(configContent).toContain("prompts: false");
    expect(configContent).toContain('resources: "./resources"');

    const pathsMatches = configContent.match(/paths:/g);
    expect(pathsMatches).toHaveLength(1);
  });
});
