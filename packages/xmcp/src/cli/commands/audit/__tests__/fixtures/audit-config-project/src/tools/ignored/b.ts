import { z } from "zod";

export const schema = {
  payload: z.any(),
};

export const metadata = {
  name: "b",
  description: "Tool b (ignored by path)",
};

export default async function b({ payload }: { payload: unknown }) {
  return payload;
}
