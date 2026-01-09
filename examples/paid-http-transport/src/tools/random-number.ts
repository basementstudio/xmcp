import { ToolMetadata } from "xmcp";
import { paid } from "xmcp/x402";

export const metadata: ToolMetadata = {
  name: "random-number",
  description: "Generate a random number (paid tool - $0.01)",
};

// // Tool implementation
// export default paid(async function randomNumber() {
//   const result = Math.random();
//   return {
//     content: [{ type: "text", text: result.toString() }],
//   };
// });

export default async function randomNumber() {
  const result = Math.random();

  return {
    content: [{ type: "text", text: result.toString() }],
  };
}
