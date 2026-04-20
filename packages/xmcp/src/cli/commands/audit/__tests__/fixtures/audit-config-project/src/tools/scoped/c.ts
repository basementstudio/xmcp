import { z } from "zod";

export const schema = {
  payload: z.any(),
  free: z.string(),
};

export const metadata = {
  name: "c",
  description: "Tool c (scoped ignore)",
};

export default async function c({
  payload,
  free,
}: {
  payload: unknown;
  free: string;
}) {
  return { payload, free };
}
