/* auto-generated - do not edit */
import { z } from "zod";
import { createHTTPClient, type HttpClient, type ToolMetadata, type CustomHeaders } from "xmcp";

const DEFAULT_REMOTE_URL = "https://mcp.context7.com/mcp";

const DEFAULT_HEADERS: CustomHeaders = [
  {
    "name": "CONTEXT7_API_KEY",
    "env": "CONTEXT7_API_KEY"
  }
];

export const resolveLibraryIdSchema = z.object({
  libraryName: z.string().describe("Library name to search for and retrieve a Context7-compatible library ID."),
});
export type ResolveLibraryIdArgs = z.infer<typeof resolveLibraryIdSchema>;

export const resolveLibraryIdMetadata: ToolMetadata = {
  "name": "resolve-library-id",
  "description": "Resolves a package/product name to a Context7-compatible library ID and returns a list of matching libraries.\n\nYou MUST call this function before 'get-library-docs' to obtain a valid Context7-compatible library ID UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query.\n\nSelection Process:\n1. Analyze the query to understand what library/package the user is looking for\n2. Return the most relevant match based on:\n- Name similarity to the query (exact matches prioritized)\n- Description relevance to the query's intent\n- Documentation coverage (prioritize libraries with higher Code Snippet counts)\n- Source reputation (consider libraries with High or Medium reputation more authoritative)\n- Benchmark Score: Quality indicator (100 is the highest score)\n\nResponse Format:\n- Return the selected library ID in a clearly marked section\n- Provide a brief explanation for why this library was chosen\n- If multiple good matches exist, acknowledge this but proceed with the most relevant one\n- If no good matches exist, clearly state this and suggest query refinements\n\nFor ambiguous queries, request clarification before proceeding with a best-guess match."
};

async function resolveLibraryId(client: HttpClient, args: ResolveLibraryIdArgs) {
  return client.callTool({
    name: "resolve-library-id",
    arguments: args,
  });
}

export const getLibraryDocsSchema = z.object({
  context7CompatibleLibraryID: z.string().describe("Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js', '/supabase/supabase', '/vercel/next.js/v14.3.0-canary.87') retrieved from 'resolve-library-id' or directly from user query in the format '/org/project' or '/org/project/version'."),
  mode: z.enum(["code", "info"]).describe("Documentation mode: 'code' for API references and code examples (default), 'info' for conceptual guides, narrative information, and architectural questions.").optional(),
  topic: z.string().describe("Topic to focus documentation on (e.g., 'hooks', 'routing').").optional(),
  page: z.number().describe("Page number for pagination (start: 1, default: 1). If the context is not sufficient, try page=2, page=3, page=4, etc. with the same topic.").optional(),
});
export type GetLibraryDocsArgs = z.infer<typeof getLibraryDocsSchema>;

export const getLibraryDocsMetadata: ToolMetadata = {
  "name": "get-library-docs",
  "description": "Fetches up-to-date documentation for a library. You must call 'resolve-library-id' first to obtain the exact Context7-compatible library ID required to use this tool, UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query. Use mode='code' (default) for API references and code examples, or mode='info' for conceptual guides, narrative information, and architectural questions."
};

async function getLibraryDocs(client: HttpClient, args: GetLibraryDocsArgs) {
  return client.callTool({
    name: "get-library-docs",
    arguments: args,
  });
}


export interface RemoteToolClientOptions {
  url?: string;
  headers?: CustomHeaders;
}

export async function createRemoteToolClient(
  options: RemoteToolClientOptions = {}
) {
  const client = await createHTTPClient({
    url: options.url ?? DEFAULT_REMOTE_URL,
    headers: options.headers ?? DEFAULT_HEADERS,
  });

  return {
    resolveLibraryId: async (args: ResolveLibraryIdArgs) => resolveLibraryId(client, args),
    getLibraryDocs: async (args: GetLibraryDocsArgs) => getLibraryDocs(client, args),
    rawClient: client,
  } as const;
}

export type RemoteToolClient = Awaited<
  ReturnType<typeof createRemoteToolClient>
>;

export const clientContext = createRemoteToolClient();
