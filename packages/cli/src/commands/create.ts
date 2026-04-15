import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pascalCase, toIdentifier, toFileSafeName } from "../utils/naming.js";

export type CreateType = "tool" | "resource" | "prompt";
export type ScaffoldPreset = "standard" | "react";

export interface CreateOptions {
  type: CreateType;
  name?: string;
  preset?: string;
  directory?: string;
}

export interface CreateResult {
  status: "created" | "skipped";
  outputPath: string;
}

const DEFAULT_DIRECTORIES: Record<CreateType, string> = {
  tool: "src/tools",
  resource: "src/resources",
  prompt: "src/prompts",
};

const VALID_TYPES: CreateType[] = ["tool", "resource", "prompt"];
const VALID_PRESETS: ScaffoldPreset[] = ["standard", "react"];

export async function runCreate(options: CreateOptions): Promise<CreateResult> {
  const type = normalizeType(options.type);
  const name = await resolveName(options.name, type);

  const baseDir = options.directory ?? DEFAULT_DIRECTORIES[type];
  const resolvedDir = path.resolve(process.cwd(), baseDir);

  const nameParts = name.split("/").filter(Boolean);
  const rawFileName = nameParts.pop();

  if (!rawFileName) {
    throw new Error(`Invalid ${type} name.`);
  }

  const targetDir = nameParts.length
    ? path.join(resolvedDir, ...nameParts)
    : resolvedDir;

  fs.mkdirSync(targetDir, { recursive: true });

  const fileName = toFileSafeName(rawFileName);
  const existingOutputPath = findExistingOutputPath({ targetDir, fileName, type });

  if (existingOutputPath) {
    const relativeExistingPath = path.relative(process.cwd(), existingOutputPath);
    return {
      status: "skipped",
      outputPath: relativeExistingPath,
    };
  }

  const preset = await resolvePreset(options.preset, type);
  const extension = type === "tool" && preset === "react" ? ".tsx" : ".ts";
  const outputPath = path.join(targetDir, `${fileName}${extension}`);
  const relativeOutputPath = path.relative(process.cwd(), outputPath);

  const content = buildTemplate({ type, name: rawFileName, preset });
  fs.writeFileSync(outputPath, content);

  return {
    status: "created",
    outputPath: relativeOutputPath,
  };
}

function findExistingOutputPath({
  targetDir,
  fileName,
  type,
}: {
  targetDir: string;
  fileName: string;
  type: CreateType;
}) {
  const extensions = type === "tool" ? [".ts", ".tsx"] : [".ts"];

  for (const extension of extensions) {
    const candidate = path.join(targetDir, `${fileName}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function normalizeType(type: string): CreateType {
  if (VALID_TYPES.includes(type as CreateType)) {
    return type as CreateType;
  }

  throw new Error(
    `Invalid create type "${type}". Valid types: ${VALID_TYPES.join(", ")}`
  );
}

async function resolveName(name: string | undefined, type: CreateType) {
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (!input.isTTY) {
    throw new Error(`${capitalize(type)} name is required.`);
  }

  const answer = await prompt(`${capitalize(type)} name: `);
  if (!answer) {
    throw new Error(`${capitalize(type)} name is required.`);
  }

  return answer;
}

async function resolvePreset(
  preset: string | undefined,
  type: CreateType
): Promise<ScaffoldPreset> {
  if (typeof preset === "string" && preset.trim()) {
    const normalizedPreset = preset.trim().toLowerCase();
    if (VALID_PRESETS.includes(normalizedPreset as ScaffoldPreset)) {
      validatePresetForType(normalizedPreset as ScaffoldPreset, type);
      return normalizedPreset as ScaffoldPreset;
    }

    throw new Error(
      `Invalid preset "${preset}". Valid presets: ${VALID_PRESETS.join(", ")}`
    );
  }

  if (!input.isTTY) {
    return "standard";
  }

  const answer = (await prompt("Preset (standard/react): ")).toLowerCase();
  if (!answer) {
    return "standard";
  }

  if (VALID_PRESETS.includes(answer as ScaffoldPreset)) {
    validatePresetForType(answer as ScaffoldPreset, type);
    return answer as ScaffoldPreset;
  }

  throw new Error(
    `Invalid preset "${answer}". Valid presets: ${VALID_PRESETS.join(", ")}`
  );
}

function validatePresetForType(preset: ScaffoldPreset, type: CreateType) {
  if (preset === "react" && type !== "tool") {
    throw new Error(`Preset "react" is only supported for tools.`);
  }
}

async function prompt(message: string) {
  const rl = createInterface({ input, output });
  try {
    return (await rl.question(message)).trim();
  } finally {
    rl.close();
  }
}

function buildTemplate({
  type,
  name,
  preset,
}: {
  type: CreateType;
  name: string;
  preset: ScaffoldPreset;
}) {
  switch (type) {
    case "tool":
      return preset === "react"
        ? buildReactToolTemplate(name)
        : buildToolTemplate(name);
    case "resource":
      return buildResourceTemplate(name);
    case "prompt":
      return buildPromptTemplate(name);
  }
}

function buildToolTemplate(name: string) {
  const functionName = toIdentifier(name);
  const safeName = toFileSafeName(name);

  return `import { z } from "zod";
import { type ToolMetadata } from "xmcp";

export const schema = {
  // Add your parameters here
  // example: z.string().describe("Description of the parameter"),
};

export const metadata: ToolMetadata = {
  name: "${safeName}",
  description: "TODO: Add description",
};

export default function ${functionName}() {
  // TODO: Implement your tool logic here
  return "Hello from ${safeName}!";
}
`;
}

function buildReactToolTemplate(name: string) {
  const functionName = toIdentifier(name);
  const title = pascalCase(name);
  const safeName = toFileSafeName(name);

  return `import { type ToolMetadata } from "xmcp";
import { useState } from "react";

export const metadata: ToolMetadata = {
  name: "${safeName}",
  description: "${title} Widget",
  _meta: {
    ui: {
      csp: {
        connectDomains: [],
      },
    },
  },
};

export default function ${functionName}() {
  const [state, setState] = useState<string | null>(null);

  return (
    <div>
      <h1>${title}</h1>
      <p>TODO: Implement your UI here</p>
      <button onClick={() => setState("ready")}>Set state</button>
      {state && <p>{state}</p>}
    </div>
  );
}
`;
}

function buildResourceTemplate(name: string) {
  const functionName = toIdentifier(name);
  const title = pascalCase(name);
  const safeName = toFileSafeName(name);

  return `import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "${safeName}",
  title: "${title}",
  description: "TODO: Add description",
};

export default function ${functionName}() {
  // TODO: Implement your resource logic here
  return "Resource data for ${safeName}";
}
`;
}

function buildPromptTemplate(name: string) {
  const functionName = toIdentifier(name);
  const title = pascalCase(name);
  const safeName = toFileSafeName(name);

  return `import { z } from "zod";
import { type PromptMetadata } from "xmcp";

export const schema = {
  // Add your parameters here
  // example: z.string().describe("Description of the parameter"),
};

export const metadata: PromptMetadata = {
  name: "${safeName}",
  title: "${title}",
  description: "TODO: Add description",
  role: "user",
};

export default function ${functionName}() {
  // TODO: Implement your prompt logic here
  return "Your prompt content here";
}
`;
}

function capitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}
