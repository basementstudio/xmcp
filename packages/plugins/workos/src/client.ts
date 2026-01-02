import { WorkOS } from "@workos-inc/node";

let workosClient: WorkOS | null = null;

/**
 * Initialize the WorkOS SDK client
 * @param apiKey - WorkOS API key
 * @param clientId - WorkOS Client ID
 * @returns Initialized WorkOS client
 */
export function initWorkOS(apiKey: string, clientId: string): WorkOS {
  workosClient = new WorkOS(apiKey, { clientId });
  return workosClient;
}

/**
 * Get the initialized WorkOS SDK client
 * @throws Error if client not initialized
 * @returns WorkOS client instance
 */
export function getWorkOSClient(): WorkOS {
  if (!workosClient) {
    throw new Error(
      "WorkOS client not initialized. Ensure workosProvider() is configured correctly."
    );
  }
  return workosClient;
}
