import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "random_number",
  description: "Generate a random number",
};

export default function random_number(): number {
  return Math.floor(Math.random() * 100);
}
