import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { runCreate } from "@/cli/commands/create";

function readCreatedFile(dir: string, relativePath: string) {
  const filePath = path.join(dir, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

describe("xmcp create command", () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-create-"));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a tool in default directory", async () => {
    await runCreate({ type: "tool", name: "my-tool" });

    const content = readCreatedFile(tempDir, "src/tools/my-tool.ts");
    expect(content).toMatch(/export const metadata: ToolMetadata/);
    expect(content).toMatch(/name: "my-tool"/);
    expect(content).toMatch(/export default function myTool/);
  });

  it("creates a resource in default directory", async () => {
    await runCreate({ type: "resource", name: "user-data" });

    const content = readCreatedFile(tempDir, "src/resources/user-data.ts");
    expect(content).toMatch(/export const metadata: ResourceMetadata/);
    expect(content).toMatch(/name: "user-data"/);
    expect(content).toMatch(/export default function userData/);
  });

  it("creates a prompt in default directory", async () => {
    await runCreate({ type: "prompt", name: "code-review" });

    const content = readCreatedFile(tempDir, "src/prompts/code-review.ts");
    expect(content).toMatch(/export const metadata: PromptMetadata/);
    expect(content).toMatch(/name: "code-review"/);
    expect(content).toMatch(/export default function codeReview/);
  });

  it("creates a widget with .tsx extension", async () => {
    await runCreate({ type: "widget", name: "dashboard" });

    const content = readCreatedFile(tempDir, "src/tools/dashboard.tsx");
    expect(content).toMatch(/import.*useState.*from "react"/);
    expect(content).toMatch(/export const metadata: ToolMetadata/);
    expect(content).toMatch(/export default function dashboard/);
  });

  it("creates in custom directory with dir option", async () => {
    await runCreate({
      type: "tool",
      name: "custom",
      directory: "lib/custom-tools",
    });

    const content = readCreatedFile(tempDir, "lib/custom-tools/custom.ts");
    expect(content).toMatch(/export const metadata: ToolMetadata/);
  });

  it("creates in nested path from name", async () => {
    await runCreate({ type: "tool", name: "api/users/get-user" });

    const content = readCreatedFile(tempDir, "src/tools/api/users/get-user.ts");
    expect(content).toMatch(/name: "get-user"/);
    expect(content).toMatch(/export default function getUser/);
  });

  it("errors when file already exists", async () => {
    await runCreate({ type: "tool", name: "existing" });

    await expect(runCreate({ type: "tool", name: "existing" })).rejects.toThrow(
      /File already exists/
    );
  });

  it("converts camelCase names to kebab-case files", async () => {
    await runCreate({ type: "tool", name: "myAwesomeTool" });

    const content = readCreatedFile(tempDir, "src/tools/my-awesome-tool.ts");
    expect(content).toMatch(/name: "my-awesome-tool"/);
    expect(content).toMatch(/export default function myAwesomeTool/);
  });
});
