import { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "random-number",
  description: "Generate a random number (free tool)",
};

export default async function randomNumber() {
  const result = Math.random();

  return {
    content: [{ type: "text", text: result.toString() }],
  };
}
