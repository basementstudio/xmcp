export type {
  GetPromptResult,
  PromptMessage,
} from "@modelcontextprotocol/server";

export type PromptMetadata = {
  name: string;
  title: string;
  description: string;
  role?: string;
};
