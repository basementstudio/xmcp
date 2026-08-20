import fs from "node:fs";
import path from "node:path";
import { toKebabCase } from "../../utils/naming";
import {
  generateToolTemplate,
  generateResourceTemplate,
  generatePromptTemplate,
  generateWidgetTemplate,
} from "./templates";

export type CreateType = "tool" | "resource" | "prompt" | "widget";

export interface CreateOptions {
  type: CreateType;
  name: string;
  directory?: string;
}

const DEFAULT_DIRECTORIES: Record<CreateType, string> = {
  tool: "src/tools",
  resource: "src/resources",
  prompt: "src/prompts",
  widget: "src/tools",
};

const FILE_EXTENSIONS: Record<CreateType, string> = {
  tool: ".ts",
  resource: ".ts",
  prompt: ".ts",
  widget: ".tsx",
};

const TEMPLATE_GENERATORS: Record<CreateType, (name: string) => string> = {
  tool: generateToolTemplate,
  resource: generateResourceTemplate,
  prompt: generatePromptTemplate,
  widget: generateWidgetTemplate,
};

export async function runCreate(options: CreateOptions): Promise<string> {
  const { type, name, directory } = options;

  const baseDir = directory ?? DEFAULT_DIRECTORIES[type];
  const resolvedDir = path.resolve(process.cwd(), baseDir);

  // Parse the name for nested paths (e.g., "api/users" -> creates in api/users/)
  const nameParts = name.split("/");
  const fileName = nameParts.pop()!;
  const subPath = nameParts.join("/");

  const targetDir = subPath ? path.join(resolvedDir, subPath) : resolvedDir;

  // Create directory if it doesn't exist
  fs.mkdirSync(targetDir, { recursive: true });

  const extension = FILE_EXTENSIONS[type];
  const outputPath = path.join(
    targetDir,
    `${toKebabCase(fileName)}${extension}`
  );

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    throw new Error(
      `File already exists: ${path.relative(process.cwd(), outputPath)}`
    );
  }

  const generateTemplate = TEMPLATE_GENERATORS[type];
  const content = generateTemplate(fileName);
  fs.writeFileSync(outputPath, content);

  return path.relative(process.cwd(), outputPath);
}
