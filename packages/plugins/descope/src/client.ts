import { getClientContext, type DescopeClient } from "./context.js";

export function getClient(): DescopeClient {
  const ctx = getClientContext();
  if (!ctx?.client) {
    throw new Error(
      "getClient() called outside of Descope middleware. Ensure descopeProvider middleware is registered.",
    );
  }
  return ctx.client;
}

export function getManagementClient(): DescopeClient["management"] {
  const ctx = getClientContext();
  if (!ctx?.client) {
    throw new Error(
      "getManagementClient() called outside of Descope middleware. Ensure descopeProvider middleware is registered.",
    );
  }
  if (!ctx.managementKey) {
    throw new Error(
      "getManagementClient() requires managementKey to be set in DescopeConfig.",
    );
  }
  return ctx.client.management;
}
