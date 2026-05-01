import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "random-number",
  description: "Generate a random number between 0 and 1",
  annotations: {
    title: "Random Number",
    readOnlyHint: true,
    idempotentHint: false,
  },
};

// No schema — this tool takes no input parameters
export default async function randomNumber() {
  const result = Math.random();
  return result;
}
