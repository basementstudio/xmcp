import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { generateConfig } from "../helpers/generate-config.js";

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
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(configContent.includes("tools: false"), "Should include tools: false");
    assert(configContent.includes("prompts: false"), "Should include prompts: false");
    assert(configContent.includes("resources: false"), "Should include resources: false");

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });

  it("should generate config with tools path set and prompts/resources as false", () => {
    generateConfig(projectPath, "nextjs", "./tools");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(
      configContent.includes('tools: "./tools"'),
      "Should include tools path"
    );
    assert(configContent.includes("prompts: false"), "Should include prompts: false");
    assert(configContent.includes("resources: false"), "Should include resources: false");

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });

  it("should generate config with prompts path set and tools/resources as false", () => {
    generateConfig(projectPath, "nextjs", undefined, "./prompts");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(
      configContent.includes('prompts: "./prompts"'),
      "Should include prompts path"
    );
    assert(configContent.includes("tools: false"), "Should include tools: false");
    assert(configContent.includes("resources: false"), "Should include resources: false");

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });

  it("should generate config with all paths set to their string values when all are provided", () => {
    generateConfig(projectPath, "nextjs", "./tools", "./prompts", "./resources");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(
      configContent.includes('tools: "./tools"'),
      "Should include tools path"
    );
    assert(
      configContent.includes('prompts: "./prompts"'),
      "Should include prompts path"
    );
    assert(
      configContent.includes('resources: "./resources"'),
      "Should include resources path"
    );

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });

  it("should generate config with only resources path set and tools/prompts as false", () => {
    generateConfig(projectPath, "nextjs", undefined, undefined, "./resources");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(configContent.includes("tools: false"), "Should include tools: false");
    assert(configContent.includes("prompts: false"), "Should include prompts: false");
    assert(
      configContent.includes('resources: "./resources"'),
      "Should include resources path"
    );

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });

  it("should generate config with mixed paths (tools and resources set, prompts false)", () => {
    generateConfig(projectPath, "nextjs", "./tools", undefined, "./resources");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(
      configContent.includes('tools: "./tools"'),
      "Should include tools path"
    );
    assert(configContent.includes("prompts: false"), "Should include prompts: false");
    assert(
      configContent.includes('resources: "./resources"'),
      "Should include resources path"
    );

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });
});
