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

  it("should generate config without paths when both toolsPath and promptsPath are falsy", () => {
    generateConfig(projectPath, "nextjs");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(
      !configContent.includes("paths:"),
      "Should not include paths key when both are falsy"
    );

    const pathsMatches = configContent.match(/paths:/g);
    assert(!pathsMatches, "Should not contain any paths key");
  });

  it("should generate config with paths object containing only tools when toolsPath is truthy", () => {
    generateConfig(projectPath, "nextjs", "./tools");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(
      configContent.includes('tools: "./tools"'),
      "Should include tools path"
    );
    assert(
      !configContent.includes("prompts:"),
      "Should not include prompts path"
    );

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });

  it("should generate config with paths object containing only prompts when promptsPath is truthy", () => {
    generateConfig(projectPath, "nextjs", undefined, "./prompts");

    const configPath = path.join(projectPath, "xmcp.config.ts");
    assert(fs.existsSync(configPath), "Config file should be created");

    const configContent = fs.readFileSync(configPath, "utf-8");
    assert(configContent.includes("paths: {"), "Should include paths object");
    assert(
      configContent.includes('prompts: "./prompts"'),
      "Should include prompts path"
    );
    assert(!configContent.includes("tools:"), "Should not include tools path");

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });

  it("should generate config with paths object containing both when both are truthy", () => {
    generateConfig(projectPath, "nextjs", "./tools", "./prompts");

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

    const pathsMatches = configContent.match(/paths:/g);
    assert(
      pathsMatches && pathsMatches.length === 1,
      "Should contain exactly one paths object"
    );
  });
});
