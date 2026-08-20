import { Scalekit } from "@scalekit-sdk/node";
import { getClientContext } from "./context.js";

export function getClient(): Scalekit {
  const { client } = getClientContext();
  if (!client) {
    throw new Error(
      "[Scalekit] Client not initialized. " +
        "Make sure scalekitProvider() is configured in your middleware."
    );
  }
  return client;
}