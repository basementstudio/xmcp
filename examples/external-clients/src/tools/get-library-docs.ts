import { InferSchema, type ToolMetadata } from "xmcp";
import { generatedClients } from "../generated/client.index";
import { z } from "zod";

export const schema = {
  libraryName: z.string().describe("The name of the library to get docs for"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get-library-docs",
  description: "Get the docs for a library",
};

// Tool implementation
export default async function handler({
  libraryName,
}: InferSchema<typeof schema>) {
  const libraryDocs = await generatedClients.context.getLibraryDocs({
    context7CompatibleLibraryID: libraryName,
  });

  const result = (libraryDocs.content as any)[0].text;

  return `Library docs: ${result}`;
}
