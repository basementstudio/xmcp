import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { paid, payment } from "@xmcp-dev/x402";

export const schema = {
  text: z.string().min(1).describe("The text to count words in"),
};

export const metadata: ToolMetadata = {
  name: "word-count",
  description: "Count the words in a text (paid tool - 0.001 XNO on Nano)",
};

// Paid in XNO on the nano network. The price is in XNO, not USD.
export default paid(
  { network: "nano", price: 0.001 },
  async function wordCount({ text }: InferSchema<typeof schema>) {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    const { transactionHash } = payment();

    return `${words} words (paid with Nano block ${transactionHash})`;
  }
);
