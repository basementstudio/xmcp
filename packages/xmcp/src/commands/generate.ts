import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

interface ToolTemplate {
  name: string;
  description: string;
  content: string;
}

const BASIC_TEMPLATE = `import { z } from "zod";
import { type InferSchema } from "xmcp";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata = {
  name: "{{toolName}}",
  description: "{{toolDescription}}",
  annotations: {
    title: "{{toolTitle}}",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function {{functionName}}({ name }: InferSchema<typeof schema>) {
  const result = \`Hello, \${name}!\`;

  return {
    content: [{ type: "text", text: result }],
  };
}`;

const ADVANCED_TEMPLATE = `import { z } from "zod";
import { type InferSchema } from "xmcp";

// Define the schema for tool parameters
export const schema = {
  input: z.string().describe("The input to process"),
  options: z.object({
    format: z.enum(["json", "text", "html"]).optional().default("text").describe("Output format"),
    limit: z.number().optional().default(100).describe("Maximum number of results"),
  }).optional().describe("Processing options"),
};

// Define tool metadata
export const metadata = {
  name: "{{toolName}}",
  description: "{{toolDescription}}",
  annotations: {
    title: "{{toolTitle}}",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function {{functionName}}({ input, options }: InferSchema<typeof schema>) {
  try {
    const { format = "text", limit = 100 } = options || {};
    
    // Process the input based on format
    let result: string;
    
    switch (format) {
      case "json":
        result = JSON.stringify({ input, processed: true, limit });
        break;
      case "html":
        result = \`<div>Processed: \${input}</div>\`;
        break;
      default:
        result = \`Processed: \${input} (limit: \${limit})\`;
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: \`Error processing input: \${error instanceof Error ? error.message : "Unknown error"}\` 
      }],
      isError: true,
    };
  }
}`;

const TOOL_TEMPLATES: Record<string, ToolTemplate> = {
  basic: {
    name: "Basic Tool",
    description: "A simple tool with string input and text output",
    content: BASIC_TEMPLATE,
  },
  advanced: {
    name: "Advanced Tool",
    description: "An advanced tool with complex schema and error handling",
    content: ADVANCED_TEMPLATE,
  },
};

function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function kebabToPascalCase(str: string): string {
  return str.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase());
}

function validateProjectStructure(): boolean {
  // Check if we're in an xmcp project
  const configFiles = ["xmcp.config.ts", "xmcp.config.js"];
  return configFiles.some((file) =>
    fs.existsSync(path.join(process.cwd(), file))
  );
}

function ensureToolsDirectory(): string {
  const toolsDir = path.join(process.cwd(), "src", "tools");
  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
  }
  return toolsDir;
}

function generateToolFile(
  toolName: string,
  templateType: string = "basic"
): void {
  if (!validateProjectStructure()) {
    console.error(
      "❌ Error: Not in an xmcp project directory. Please run this command from the root of an xmcp project."
    );
    process.exit(1);
  }

  const template = TOOL_TEMPLATES[templateType];
  if (!template) {
    console.error(
      `❌ Error: Unknown template type "${templateType}". Available types: ${Object.keys(TOOL_TEMPLATES).join(", ")}`
    );
    process.exit(1);
  }

  const toolsDir = ensureToolsDirectory();
  const toolFileName = `${toolName}.ts`;
  const toolFilePath = path.join(toolsDir, toolFileName);

  // Check if tool already exists
  if (fs.existsSync(toolFilePath)) {
    console.error(
      `❌ Error: Tool "${toolName}" already exists at ${toolFilePath}`
    );
    process.exit(1);
  }

  // Get template content
  let templateContent = template.content;

  // Replace template variables
  const functionName = kebabToCamelCase(toolName);
  const toolTitle = kebabToPascalCase(toolName)
    .replace(/([A-Z])/g, " $1")
    .trim();
  const toolDescription = `${toolTitle} tool`;

  templateContent = templateContent
    .replace(/\{\{toolName\}\}/g, toolName)
    .replace(/\{\{functionName\}\}/g, functionName)
    .replace(/\{\{toolTitle\}\}/g, toolTitle)
    .replace(/\{\{toolDescription\}\}/g, toolDescription);

  // Write the tool file
  fs.writeFileSync(toolFilePath, templateContent);

  console.log(`✅ Generated tool "${toolName}" at ${toolFilePath}`);
  console.log(`📝 Template: ${template.name}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Edit ${toolFilePath} to customize your tool`);
  console.log(`   2. Run "xmcp dev" to test your tool`);
}

export function createGenerateCommand(): Command {
  const generateCommand = new Command("generate")
    .alias("g")
    .description("Generate code scaffolding");

  generateCommand
    .command("tools")
    .alias("tool")
    .description("Generate a new tool")
    .argument("<name>", "Tool name (kebab-case)")
    .option("-t, --template <type>", "Template type (basic, advanced)", "basic")
    .action((name: string, options: { template?: string }) => {
      generateToolFile(name, options.template);
    });

  // Add help for generate command
  generateCommand
    .command("help")
    .description("Show available generators")
    .action(() => {
      console.log("Available generators:\n");
      console.log("📦 xmcp generate tools <name>");
      console.log("   Generate a new tool from template\n");
      console.log("Templates:");
      Object.entries(TOOL_TEMPLATES).forEach(([key, template]) => {
        console.log(`   ${key.padEnd(12)} - ${template.description}`);
      });
      console.log("\nExamples:");
      console.log("   xmcp generate tools sample-tool-greet");
      console.log("   xmcp g tools my-calculator --template advanced");
    });

  return generateCommand;
}
