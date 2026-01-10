import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { paid } from "@xmcp-dev/x402";

export const schema = {
  input: z
    .string()
    .min(1, "Input string is required")
    .describe("The string to hash"),
};

export const metadata: ToolMetadata = {
  name: "hash-string",
  description: "Hash a string using SHA-256 (paid tool - $0.05)",
};

// Paid tool with custom price
export default paid(
  { price: "0.05" },
  async function hashString({ input }: InferSchema<typeof schema>) {
    if (!input || typeof input !== "string")
      return {
        content: [{ type: "text", text: "Invalid input: string required" }],
      };

    // Use Web Crypto API for SHA-256 hashing
    async function sha256(str: string) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    const hash = await sha256(input);

    return {
      content: [{ type: "text", text: hash }],
    };
  }
);
