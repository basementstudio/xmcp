import { openai } from "@ai-sdk/openai";
import { loadAllTools } from "@xmcp/tools";
import { generateText, tool } from "ai";
import { z } from "zod";

type ReturnTypeOfTool = Awaited<ReturnType<typeof loadAllTools>>[number];

function returnValidToolFormatted(tool: ReturnTypeOfTool) {
  return {
    description: tool.metadata.description,
    inputSchema: z.object({}),
    execute: tool.handler,
  };
}

export const generateResponse = async () => {
  const tools = await loadAllTools();

  const result = await generateText({
    model: openai("gpt-4o"),
    tools: {
      getWeather: tool(
        returnValidToolFormatted(
          tools.find((tool) => tool.metadata.name === "get-weather")!
        )
      ),
    },
    maxRetries: 1,
    prompt: "Get the weather for the state of California",
  });

  // Log the full message content with proper object display
  console.log(
    "Messages content:",
    JSON.stringify(
      result.response.messages.map((m) => m.content),
      null,
      2
    )
  );

  // Alternative: Log each message content separately
  result.response.messages.forEach((message, index) => {
    console.log(`Message ${index}:`, JSON.stringify(message.content, null, 2));

    // If it's a tool result, specifically log the tool output
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (message.content as any[]).forEach((content: any, contentIndex: number) => {
      if (content.type === "tool-result") {
        console.log(
          `Tool result ${contentIndex} output:`,
          JSON.stringify(content.output, null, 2)
        );
      }
    });
  });

  return result.text;
};
