import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = {
  city: z.string().describe("The city to look up"),
};

export const outputSchema = {
  city: z.string(),
  temperatureCelsius: z.number(),
  conditions: z.enum(["sunny", "cloudy", "rainy"]),
};

export const metadata: ToolMetadata = {
  name: "get-weather",
  description: "Get the current weather for a city",
  annotations: { readOnlyHint: true },
};

export default function getWeather({ city }: InferSchema<typeof schema>) {
  return {
    structuredContent: {
      city,
      temperatureCelsius: 22.5,
      conditions: "cloudy",
    },
  };
}
