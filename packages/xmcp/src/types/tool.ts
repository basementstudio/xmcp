import { z } from "zod/v3";
import type { ZodType as ZodTypeV4, infer as inferV4 } from "zod";
import type { ElicitResult as McpElicitResult } from "@modelcontextprotocol/sdk/types";
import { UIMetadata } from "./ui-meta";
import type { McpClientInfo } from "./client-info";

export interface ToolAnnotations {
  /** Human-readable title for the tool */
  title?: string;
  /** If true, the tool does not modify its environment */
  readOnlyHint?: boolean;
  /** If true, the tool may perform destructive updates */
  destructiveHint?: boolean;
  /** If true, repeated calls with same args have no additional effect */
  idempotentHint?: boolean;
  /** If true, tool interacts with external entities */
  openWorldHint?: boolean;
  [key: string]: any;
}

export interface ToolMetadata {
  /** Unique identifier for the tool */
  name: string;
  /** Human-readable description */
  description: string;
  /** Optional hints about tool behavior */
  annotations?: ToolAnnotations;
  /** Metadata for the tool. */
  _meta?: {
    ui?: UIMetadata;
    [key: string]: unknown;
  };
}

type CompatibleZodType = z.ZodTypeAny | ZodTypeV4<unknown>;
type InferCompatibleZodType<T extends CompatibleZodType> =
  T extends z.ZodTypeAny
    ? z.infer<T>
    : T extends ZodTypeV4<unknown>
      ? inferV4<T>
      : never;

export type ToolSchema = Record<string, CompatibleZodType>;
export type ToolOutputSchema = Record<string, CompatibleZodType>;
export type ElicitResult = McpElicitResult;

export interface ToolRequestOptions {
  /** Progress notification callback */
  onprogress?: (progress: any) => void;
  /** Abort signal for cancelling the request */
  signal?: AbortSignal;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether receiving progress notifications resets the timeout */
  resetTimeoutOnProgress?: boolean;
  /** Maximum total time to wait for a response */
  maxTotalTimeout?: number;
  /** Additional transport-specific options */
  [key: string]: unknown;
}

type ElicitStringFormat = "date" | "uri" | "email" | "date-time";

interface ElicitFieldBase {
  title?: string;
  description?: string;
}

export interface ElicitStringField extends ElicitFieldBase {
  type: "string";
  minLength?: number;
  maxLength?: number;
  format?: ElicitStringFormat;
  default?: string;
}

export interface ElicitEnumField extends ElicitFieldBase {
  type: "string";
  enum: string[];
  enumNames?: string[];
  default?: string;
}

export interface ElicitBooleanField extends ElicitFieldBase {
  type: "boolean";
  default?: boolean;
}

export interface ElicitNumberField extends ElicitFieldBase {
  type: "number" | "integer";
  minimum?: number;
  maximum?: number;
  default?: number;
}

export type ElicitFormField =
  | ElicitStringField
  | ElicitEnumField
  | ElicitBooleanField
  | ElicitNumberField;

export interface ElicitFormSchema {
  type: "object";
  properties: Record<string, ElicitFormField>;
  required?: string[];
}

export interface ElicitFormRequest {
  mode?: "form";
  message: string;
  requestedSchema: ElicitFormSchema;
}

export interface ElicitUrlRequest {
  mode: "url";
  message: string;
  url: string;
  elicitationId: string;
}

export type ElicitRequest = ElicitFormRequest | ElicitUrlRequest;

// The ToolExtraArguments type is based on Parameters<ToolCallback<undefined>>[0]
// from @modelcontextprotocol/sdk, with xmcp-specific extensions.
/**
 * Extra arguments passed to MCP tool functions.
 */
export interface ToolExtraArguments {
  /** An abort signal used to communicate if the request was cancelled from the sender's side */
  signal: AbortSignal;

  /** Information about a validated access token, provided to request handlers */
  authInfo?: {
    /** The access token */
    token: string;
    /** The client ID associated with this token */
    clientId: string;
    /** Scopes associated with this token */
    scopes: string[];
    /** When the token expires (in seconds since epoch) */
    expiresAt?: number;
    /** The RFC 8707 resource server identifier for which this token is valid */
    resource?: URL;
    /** Additional data associated with the token */
    extra?: Record<string, unknown>;
  };

  /** The session ID from the transport, if available */
  sessionId?: string;

  /** Metadata from the original request */
  _meta?: {
    /** Progress token for tracking long-running operations */
    progressToken?: string | number;
  };

  /** The JSON-RPC ID of the request being handled */
  requestId: string | number;

  /** The original HTTP request information */
  requestInfo?: {
    /** The headers of the request */
    headers: Record<string, string | string[] | undefined>;
  };

  /** MCP client metadata from initialize.params.clientInfo, when available */
  clientInfo?: McpClientInfo;

  /** Sends a notification that relates to the current request being handled */
  sendNotification: (notification: any) => Promise<void>;

  /** Sends a request that relates to the current request being handled */
  sendRequest: <U extends CompatibleZodType>(
    request: any,
    resultSchema: U,
    options?: ToolRequestOptions
  ) => Promise<InferCompatibleZodType<U>>;

  /** Requests user input from the connected client */
  elicit: (
    request: ElicitRequest,
    options?: ToolRequestOptions
  ) => Promise<ElicitResult>;
}

export type InferSchema<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny
    ? z.infer<T[K]>
    : T[K] extends ZodTypeV4<unknown>
      ? inferV4<T[K]>
      : never;
};
