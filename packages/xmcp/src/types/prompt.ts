import type { ComponentMetadata } from "./component";

export type {
  GetPromptResult,
  PromptMessage,
} from "@modelcontextprotocol/server";

export type PromptMetadata = ComponentMetadata & {
  name: string;
  title: string;
  description: string;
  role?: string;
  /** Metadata exposed in prompts/list. */
  _meta?: Record<string, unknown>;
};
