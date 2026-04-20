import { z } from "zod";

export const schema = {
  id: z.string(),
};

export const outputSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const metadata = {
  name: "output_contract",
  description: "Return a user by id",
};

export default async function outputContract({ id }: { id: string }) {
  return { id, name: "hardcoded" };
}
