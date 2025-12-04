import type { createHTTPClient, StdioClientConnection } from ".";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonSchemaConst = {
  const: JsonValue;
  title?: string;
  description?: string;
};

export type JsonSchemaType = {
  type?:
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "array"
    | "object"
    | "null"
    | (
        | "string"
        | "number"
        | "integer"
        | "boolean"
        | "array"
        | "object"
        | "null"
      )[];
  title?: string;
  description?: string;
  required?: string[];
  default?: JsonValue;
  properties?: Record<string, JsonSchemaType>;
  items?: JsonSchemaType;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  nullable?: boolean;
  pattern?: string;
  format?: string;
  enum?: string[];
  const?: JsonValue;
  oneOf?: (JsonSchemaType | JsonSchemaConst)[];
  anyOf?: (JsonSchemaType | JsonSchemaConst)[];
  $ref?: string;
};

export type HttpClient = Awaited<ReturnType<typeof createHTTPClient>>;
export type StdioClient = StdioClientConnection["client"];
