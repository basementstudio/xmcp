import { z } from "zod";

export const schema = {
  task: z.string().describe("The task to execute"),
};

export const metadata = {
  name: "raw_error",
  description: "Expose task failure details",
};

export default async function rawError({ task }: { task: string }) {
  try {
    throw new Error(`task ${task} failed`);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: JSON.stringify(error) }],
    };
  }
}
