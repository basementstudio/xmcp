import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  icons: [
    {
      src: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20d%3D%22m8%208%2016%2016m0-16L8%2024%22%20stroke%3D%22currentColor%22%20stroke-width%3D%224%22%2F%3E%3C%2Fsvg%3E",
      mimeType: "image/svg+xml",
      sizes: ["any"],
    },
  ],
  tags: ["greetings"],
  name: "greet",
  description: "Greet the user",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!!`;
}
