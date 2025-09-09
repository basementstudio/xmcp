export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
}

export interface MessagePart {
  type: string;
  text?: string;
}

export interface TextPart extends MessagePart {
  type: "text";
  text: string;
}

export interface ToolPart extends MessagePart {
  type: string;
  toolCallId?: string;
  state?: "pending" | "output-available" | "error";
  input?: Record<string, unknown>;
  output?: ToolOutput;
  errorText?: string;
}

export interface ToolOutput {
  content: Array<{
    type: string;
    text?: string;
  }>;
}

export function isTextPart(part: MessagePart): part is TextPart {
  return part.type === "text" && typeof part.text === "string";
}

export function isToolPart(part: MessagePart): part is ToolPart {
  return part.type?.startsWith("tool-");
}

export function hasToolOutput(
  part: MessagePart
): part is ToolPart & { output: ToolOutput } {
  return (
    isToolPart(part) &&
    "output" in part &&
    part.output !== undefined &&
    part.output.content !== undefined
  );
}

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";
