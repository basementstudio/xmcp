import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = {
  code: z.string().describe("Station code, e.g. EZE"),
};

export const outputSchema = z.union([
  z.object({
    found: z.literal(true),
    code: z.string(),
    name: z.string(),
  }),
  z.object({ found: z.literal(false) }),
]);

export const metadata: ToolMetadata = {
  name: "find-station",
  description: "Look up a weather station by its code",
  annotations: { readOnlyHint: true },
};

const STATIONS: Record<string, string> = {
  EZE: "Ezeiza",
  AEP: "Aeroparque",
};

export default function findStation({ code }: InferSchema<typeof schema>) {
  const name = STATIONS[code];
  return name ? { found: true, code, name } : { found: false };
}
