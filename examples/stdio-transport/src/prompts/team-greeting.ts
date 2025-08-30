import { z } from "zod";
import { type InferSchema, type PromptMetadata, completable } from "xmcp";

// Define the schema for prompt parameters
export const schema = {
  department: completable(z.string(), (value) => {
    return ["engineering", "sales", "marketing", "support"].filter((d) =>
      d.startsWith(value)
    );
  }),
  name: completable(z.string(), (value, context) => {
    const department = context?.arguments?.["department"];
    if (department === "engineering") {
      return ["Alice", "Bob", "Charlie"].filter((n) => n.startsWith(value));
    } else if (department === "sales") {
      return ["David", "Eve", "Frank"].filter((n) => n.startsWith(value));
    } else if (department === "marketing") {
      return ["Grace", "Henry", "Iris"].filter((n) => n.startsWith(value));
    }
    return ["Guest"].filter((n) => n.startsWith(value));
  }),
};

// Define prompt metadata
export const metadata: PromptMetadata = {
  name: "team-greeting",
  title: "Team Greeting",
  description: "Generate a greeting for team members",
  role: "assistant",
};

// Prompt implementation
export default function teamGreeting({
  department,
  name,
}: InferSchema<typeof schema>) {
  return `Hello ${name}, welcome to the ${department} team!`;
}
