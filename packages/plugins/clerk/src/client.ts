import { ClerkClient } from "@clerk/express";
import { getClerkContextClient } from "./context.js";

export function getClerkClient(): ClerkClient {
  const { client } = getClerkContextClient();
  if (!client) {
    throw new Error(
      "[Clerk] Clerk client not initialized. " +
        "Make sure clerkProvider() is configured in your middleware."
    );
  }
  return client;
}

