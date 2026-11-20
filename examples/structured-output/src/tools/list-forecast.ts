import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = {
  days: z.number().int().min(1).max(3).describe("Number of days, 1 to 3"),
};

export const outputSchema = z.array(
  z.object({ day: z.string(), high: z.number(), low: z.number() })
);

export const metadata: ToolMetadata = {
  name: "list-forecast",
  description: "List the forecast for the next few days",
  annotations: { readOnlyHint: true },
};

const FORECAST = [
  { day: "Mon", high: 24, low: 15 },
  { day: "Tue", high: 21, low: 13 },
  { day: "Wed", high: 19, low: 12 },
];

export default function listForecast({ days }: InferSchema<typeof schema>) {
  return FORECAST.slice(0, days);
}
