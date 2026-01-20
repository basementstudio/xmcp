import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  timezone: z
    .string()
    .optional()
    .describe("The timezone to get the time for (e.g., 'America/New_York')"),
};

export const metadata: ToolMetadata = {
  name: "get-time",
  description: "Get the current time, optionally in a specific timezone",
  annotations: {
    title: "Get Current Time",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function getTime({ timezone }: InferSchema<typeof schema>) {
  const now = new Date();

  let timeString: string;
  if (timezone) {
    try {
      timeString = now.toLocaleString("en-US", { timeZone: timezone });
    } catch {
      return {
        content: [{ type: "text", text: `Invalid timezone: ${timezone}` }],
        isError: true,
      };
    }
  } else {
    timeString = now.toLocaleString();
  }

  return {
    content: [
      {
        type: "text",
        text: `Current time${timezone ? ` in ${timezone}` : ""}: ${timeString}`,
      },
    ],
  };
}
