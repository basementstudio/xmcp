import type { Commet } from "@commet/node";
import { getCommetContext } from "./context.js";

export function getClient(): Commet {
  const { client } = getCommetContext();
  if (!client) {
    throw new Error(
      "[Commet] Client not initialized. " +
        "Ensure this is called within a request context with commetProvider configured."
    );
  }
  return client;
}

export function getCustomerId(): string {
  const { customerId } = getCommetContext();
  if (!customerId) {
    throw new Error(
      "[Commet] No customer ID found in request. " +
        "Ensure the request includes the customer header configured in commetProvider."
    );
  }
  return customerId;
}
