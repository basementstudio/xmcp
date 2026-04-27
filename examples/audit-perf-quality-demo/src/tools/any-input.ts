import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  payload: z.any(),
};

export const metadata: ToolMetadata = {
  name: "echo_any",
  description: "Echo back whatever payload was sent.",
};

export default async function echoAny({ payload }: InferSchema<typeof schema>) {
  return payload;
}
