export const concepts = {
  tools: {
    label: "Tools",
    verb: "Perform an action.",
    description:
      "Functions a model can call to get something done. Validate the input, run your code, and return a result.",
    mechanism:
      "The press turns an input into a result, just as a tool executes a function.",
    method: "tools/call",
    file: "src/tools/greet.ts",
    action: "Call the tool",
    input: '{ "name": "Ada" }',
    result: "Hello, Ada!",
    code: `import { z } from "zod";
import type { InferSchema } from "xmcp";

export const schema = {
  name: z.string(),
};

export default function greet(
  { name }: InferSchema<typeof schema>
) {
  return \`Hello, \${name}!\`;
}`,
  },
  resources: {
    label: "Resources",
    verb: "Make context available.",
    description:
      "Read-only data identified by a URI. Applications choose which resources to read and provide to a model.",
    mechanism:
      "The cabinet opens a data card for reading. Reading a resource does not change its contents.",
    method: "resources/read",
    file: "src/resources/(config)/app.ts",
    action: "Read the resource",
    input: "config://app",
    result: '{ "name": "Acme", "timezone": "UTC" }',
    code: `export const metadata = {
  name: "app-config",
  description: "Application settings",
};

// Available at config://app
export default function app() {
  return JSON.stringify({
    name: "Acme",
    timezone: "UTC",
  });
}`,
  },
  prompts: {
    label: "Prompts",
    verb: "Give a task a starting point.",
    description:
      "Reusable, parameterized instructions that users choose. Return the messages that start a useful conversation.",
    mechanism:
      "The printer fills an instruction card from a template. It prepares the prompt; it does not run the model.",
    method: "prompts/get",
    file: "src/prompts/review.ts",
    action: "Get the prompt",
    input: '{ "code": "const sum = (a, b) => a + b;" }',
    result: "Review this code for clarity: const sum = (a, b) => a + b;",
    code: `import { z } from "zod";
import type { InferSchema } from "xmcp";

export const schema = { code: z.string() };
export const metadata = { role: "user" as const };

export default function review(
  { code }: InferSchema<typeof schema>
) {
  return \`Review this code for clarity: \${code}\`;
}`,
  },
} as const;

export type Concept = keyof typeof concepts;
export const conceptKeys = Object.keys(concepts) as Concept[];
