import { z } from "zod";
import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "structured-content",
  description: "Return structured weather data with temperature, conditions, and humidity",
  annotations: {
    title: "Structured Content",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export const outputSchema = {
  temperature: z.number(),
  conditions: z.string(),
  humidity: z.number(),
};

// Tool implementation
export default async function structuredContent() {
  const content = {
    temperature: 22.5,
    conditions: "Partly cloudy",
    humidity: 65,
  };

  return {
    // return content for backwards compatibility / fallback
    content: [{ type: "text", text: JSON.stringify(content) }],
    structuredContent: content,
  };
}
