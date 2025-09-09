"use server";

import { generateResponse } from "./utils/generate-response";

export async function handleSubmit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: { input: string; response: any },
  formData: FormData
) {
  const input = formData.get("input") as string;
  if (!input) return { input: "", response: null };

  const response = await generateResponse(input);

  return {
    input,
    response,
  };
}
