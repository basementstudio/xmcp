import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { parseResponse } from "./parse-response";
import { toolRegistry } from "@xmcp/tools";

export const generateResponse = async (promptInput: string) => {
  const tools = await toolRegistry();

  const result = await generateText({
    model: openai("gpt-4o"),
    tools,
    prompt: promptInput,
  });

  return parseResponse(result);
};
