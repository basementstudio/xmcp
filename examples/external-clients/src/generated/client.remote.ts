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

function jsonSchemaToZodShape(schema: any): Record<string, z.ZodTypeAny> {
  if (!schema || typeof schema !== "object" || schema.type !== "object") {
    return {};
  }

  const properties = schema.properties ?? {};
  const required = new Set(
    Array.isArray(schema.required) ? (schema.required as string[]) : []
  );

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, propertySchema] of Object.entries(properties)) {
    shape[key] = jsonSchemaToZod(propertySchema, required.has(key));
  }

  return shape;
}

function jsonSchemaToZod(
  schema: any,
  isRequired: boolean
): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.any();
  }

  let zodType: z.ZodTypeAny;

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    const enumValues = schema.enum as [string, ...string[]];
    zodType = z.enum(enumValues);
  } else {
    switch (schema.type) {
      case "string":
        zodType = z.string();
        break;
      case "number":
      case "integer":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "array":
        zodType = z.array(jsonSchemaToZod(schema.items ?? {}, true));
        break;
      case "object":
        zodType = z.object(jsonSchemaToZodShape(schema));
        break;
      default:
        zodType = z.any();
    }
  }

  if (typeof schema.description === "string") {
    zodType = zodType.describe(schema.description);
  }

  if (!isRequired) {
    zodType = zodType.optional();
  }

  return zodType;
}

function jsonSchemaToZodObject(
  schema: any
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  return z.object(jsonSchemaToZodShape(schema));
}


const greetShapeJson = {
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the user to greet"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const greetShape = jsonSchemaToZodShape(greetShapeJson);
const greetSchemaObject = z.object(greetShape);
export const greetSchema = jsonSchemaToZodObject(greetShapeJson);
export type GreetArgs = z.infer<typeof greetSchemaObject>;

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
