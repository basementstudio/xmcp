/* auto-generated - do not edit */
import { z } from "zod";
import { createHTTPClient, type HttpClient, type ToolMetadata, type CustomHeaders } from "xmcp";

const DEFAULT_REMOTE_URL = "https://test-0-5-2-canary.vercel.app/mcp";

const DEFAULT_HEADERS: CustomHeaders = [
  {
    "name": "x-api-key",
    "env": "X_API_KEY"
  }
];

export const greetSchema = z.object({
  name: z.string().describe("The name of the user to greet"),
});
export type GreetArgs = z.infer<typeof greetSchema>;

export const greetMetadata: ToolMetadata = {
  "name": "greet",
  "description": "Greet the user",
  "annotations": {
    "title": "Greet the user",
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true
  }
};

async function greet(client: HttpClient, args: GreetArgs) {
  return client.callTool({
    name: "greet",
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
    greet: async (args: GreetArgs) => greet(client, args),
    rawClient: client,
  } as const;
}

export type RemoteToolClient = Awaited<
  ReturnType<typeof createRemoteToolClient>
>;

export const clientRemote = createRemoteToolClient();
