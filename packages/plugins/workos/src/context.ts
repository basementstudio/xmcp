import type { WorkOS } from "@workos-inc/node";
import { createContext } from "xmcp";
import type { WorkOSContext } from "./types.js";

export const workosContext = createContext<WorkOSContext>({
  name: "workos-context",
});

export const setWorkOSContext = workosContext.setContext;

export const getWorkOSContext = workosContext.getContext;

export const workosContextProvider = workosContext.provider;

/**
 * Get the WorkOS SDK client instance from the current context.
 * Useful for advanced use cases where you need direct access to WorkOS APIs.
 *
 * @throws Error if called outside of a workosProvider context
 * @returns The WorkOS SDK client instance
 *
 * @example
 * ```ts
 * import { getWorkOSClient } from "@xmcp-dev/workos";
 *
 * export default async function myTool() {
 *   const workos = getWorkOSClient();
 *   const orgs = await workos.organizations.listOrganizations();
 *   return orgs;
 * }
 * ```
 */
export function getWorkOSClient(): WorkOS {
  const context = getWorkOSContext();

  if (!context) {
    throw new Error(
      "getWorkOSClient must be used within a workosProvider authenticated request"
    );
  }

  return context.config.client;
}
