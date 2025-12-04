import { InferSchema, type ToolMetadata } from "xmcp";
import { generatedClients } from "../generated/client.index";
import { z } from "zod";

export const schema = {
  url: z.string().describe("The URL to navigate to"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "browser-navigate",
  description: "Navigate to a URL",
};

// Tool implementation
export default async function handler({ url }: InferSchema<typeof schema>) {
  await generatedClients.playwright.browserNavigate({
    url,
  });

  return `Navigated to: ${url}`;
}
