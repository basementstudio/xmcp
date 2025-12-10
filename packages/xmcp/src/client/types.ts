import type { createHTTPClient, StdioClientConnection } from ".";
import { CustomHeaders } from "..";

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

export type StdioIOStrategy = "pipe" | "inherit" | "ignore";

export type HttpClientDefinition = {
  type: "http";
  name: string;
  url: string;
  headers?: CustomHeaders;
};

export type StdioClientDefinition = {
  type: "stdio";
  name: string;
  command: string;
  args: string[];
  npm?: string;
  npmArgs?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stderr?: StdioIOStrategy;
};

export type ClientDefinition = HttpClientDefinition | StdioClientDefinition;

export type HttpClientConfig = {
  /**
   * Optional friendly name. When omitted, the key in the exported map is used.
   */
  name?: string;
  /**
   * Explicit transport hint. Defaults to HTTP when a URL is present.
   */
  type?: "http";
  url: string;
  headers?: CustomHeaders;
};

export type StdioClientConfig = {
  /**
   * Optional friendly name. When omitted, the key in the exported map is used.
   */
  name?: string;
  /**
   * Explicit transport hint. Defaults to stdio when npm/command are provided.
   */
  type?: "stdio";
  command?: string;
  args?: string[];
  npm?: string;
  npmArgs?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stderr?: StdioIOStrategy;
};

export type ClientConnectionEntry =
  | string
  | HttpClientConfig
  | StdioClientConfig
  | ClientDefinition;

export type ClientConnections =
  | Record<string, ClientConnectionEntry>
  | ClientConnectionEntry[];
