import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { beforeEach, afterEach, describe, it } from "node:test";
import { runCreate, type CreateType } from "../index";

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
    assert.match(content, /export const metadata: ToolMetadata/);
    assert.match(content, /name: "my-tool"/);
    assert.match(content, /export default function myTool/);
  });

  it("creates a resource in default directory", async () => {
    await runCreate({ type: "resource", name: "user-data" });

    const content = readCreatedFile(tempDir, "src/resources/user-data.ts");
    assert.match(content, /export const metadata: ResourceMetadata/);
    assert.match(content, /name: "user-data"/);
    assert.match(content, /export default function userData/);
  });

  it("creates a prompt in default directory", async () => {
    await runCreate({ type: "prompt", name: "code-review" });

    const content = readCreatedFile(tempDir, "src/prompts/code-review.ts");
    assert.match(content, /export const metadata: PromptMetadata/);
    assert.match(content, /name: "code-review"/);
    assert.match(content, /export default function codeReview/);
  });

  it("creates a widget with .tsx extension", async () => {
    await runCreate({ type: "widget", name: "dashboard" });

    const content = readCreatedFile(tempDir, "src/tools/dashboard.tsx");
    assert.match(content, /import.*useState.*from "react"/);
    assert.match(content, /export const metadata: ToolMetadata/);
    assert.match(content, /export default function dashboard/);
  });

  it("creates in custom directory with dir option", async () => {
    await runCreate({
      type: "tool",
      name: "custom",
      directory: "lib/custom-tools",
    });

    const content = readCreatedFile(tempDir, "lib/custom-tools/custom.ts");
    assert.match(content, /export const metadata: ToolMetadata/);
  });

  it("creates in nested path from name", async () => {
    await runCreate({ type: "tool", name: "api/users/get-user" });

    const content = readCreatedFile(tempDir, "src/tools/api/users/get-user.ts");
    assert.match(content, /name: "get-user"/);
    assert.match(content, /export default function getUser/);
  });

  it("errors when file already exists", async () => {
    await runCreate({ type: "tool", name: "existing" });

    await assert.rejects(
      async () => runCreate({ type: "tool", name: "existing" }),
      /File already exists/
    );
  });

  it("converts camelCase names to kebab-case files", async () => {
    await runCreate({ type: "tool", name: "myAwesomeTool" });

    const content = readCreatedFile(tempDir, "src/tools/my-awesome-tool.ts");
    assert.match(content, /name: "my-awesome-tool"/);
    assert.match(content, /export default function myAwesomeTool/);
  });
});
