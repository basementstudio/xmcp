import { z } from "zod";

export const schema = {
  prompt: z.string(),
};

export const metadata = {
  name: "elicit_unchecked",
  description: "Ask the user for input and use it",
};

export default async function elicit(
  { prompt }: { prompt: string },
  extra: {
    elicit: (req: unknown) => Promise<{ action: string; content: unknown }>;
  }
) {
  const result = await extra.elicit({ message: prompt, schema: {} });
  return { echoed: result.content };
}
