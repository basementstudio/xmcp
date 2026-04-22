import { z } from "zod";

export const schema = {
  id: z.string(),
};

export const metadata = {
  name: "user_profile",
  title: "User Profile",
  description: "Read a user profile resource",
  mimeType: "application/json",
};

export default async function profile({ id }: { id: string }) {
  return {
    contents: [
      {
        uri: `users://${id}/profile`,
        mimeType: "application/json",
        text: JSON.stringify({ id }),
      },
    ],
  };
}
