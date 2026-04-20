import { z } from "zod";

export const schema = {
  id: z.string(),
};

export const metadata = {
  name: "bad_description",
  description: "Delete user {userId} — will cascade through {tenant}",
};

export default async function bad({ id }: { id: string }) {
  return { id };
}
