import { ClerkClient } from "@clerk/express";
import { getClientContext } from "./context.js";

export function getClient(): ClerkClient {
  const { client } = getClientContext();
  if (!client) {
    throw new Error(
      "[Clerk] Clerk client not initialized. " +
        "Make sure clerkProvider() is configured in your middleware."
    );
  }
  return client;
}

