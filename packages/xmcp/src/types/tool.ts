import { z } from "zod/v3";
import type { ZodType as ZodTypeV4, infer as inferV4 } from "zod";
import { OpenAIMetadata } from "./openai-meta";

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
  /** Metadata for the tool. Supports nested OpenAI metadata and other vendor extensions. */
  _meta?: {
    openai?: OpenAIMetadata;
    ui?: OpenAIMetadata;
    [key: string]: unknown;
  };
}

type CompatibleZodType = z.ZodTypeAny | ZodTypeV4<unknown>;

export type ToolSchema = Record<string, CompatibleZodType>;

// The ToolExtraArguments type is equivalent to Parameters<ToolCallback<undefined>>[0] from @modelcontextprotocol/sdk but fully resolved to avoid external type dependencies.
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

  /** Sends a notification that relates to the current request being handled */
  sendNotification: (notification: any) => Promise<void>;

  /** Sends a request that relates to the current request being handled */
  sendRequest: <U extends z.ZodType<object>>(
    request: any,
    resultSchema: U,
    options?: {
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
  ) => Promise<z.infer<U>>;
}

export type InferSchema<T extends ToolSchema> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny
    ? z.infer<T[K]>
    : T[K] extends ZodTypeV4<unknown>
      ? inferV4<T[K]>
      : never;
};
