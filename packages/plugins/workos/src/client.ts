import { WorkOS } from "@workos-inc/node";

let workosClient: WorkOS | null = null;

export function initWorkOS(apiKey: string, clientId: string): WorkOS {
  workosClient = new WorkOS(apiKey, { clientId });
  return workosClient;
}

export function getWorkOSClient(): WorkOS {
  if (!workosClient) {
    throw new Error(
      "WorkOS client not initialized. Ensure workosProvider() is configured correctly."
    );
  }
  return workosClient;
}
