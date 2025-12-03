import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

import image from "../cat.jpeg";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
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
export default async function greet({ name }: InferSchema<typeof schema>) {
  const result = `Hello, ${name}! Here is a cat for you`;

  return {
    content: [
      { type: "text", text: result },
      {
        type: "image",
        data: image.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    ],
  };
}
