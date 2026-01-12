import { WorkOS } from "@workos-inc/node";
import { getClientContext } from "./context.js";

export function getClient(): WorkOS {
  const { client } = getClientContext();
  if (!client) {
    throw new Error(
      "[WorkOS] Client not initialized. " +
        "Make sure workosProvider() is configured in your middleware."
    );
  }
  return client;
}
