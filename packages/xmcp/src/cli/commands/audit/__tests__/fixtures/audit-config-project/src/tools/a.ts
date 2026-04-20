import { z } from "zod";

export const schema = {
  payload: z.any(),
  free: z.string(),
};

export const metadata = {
  name: "a",
  description: "Tool a",
};

export default async function a({
  payload,
  free,
}: {
  payload: unknown;
  free: string;
}) {
  return { payload, free };
}
