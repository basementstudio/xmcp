import type { ManagementClient } from "auth0";
import type { Auth0Config } from "./types.js";

interface ResourceServer {
  readonly identifier?: string;
  readonly scopes?: Array<{ readonly value: string }>;
}

export async function fetchApiPermissions(
  config: Auth0Config,
  managementClient: ManagementClient | null
): Promise<readonly string[]> {
  if (!config.management || !managementClient) {
    return [];
  }

  try {
    const { data: resourceServers } =
      await managementClient.resourceServers.list();

    const targetIdentifier =
      config.management.resourceServerIdentifier ??
      config.audience.replace(/\/+$/, "/");

    const match = (resourceServers as ResourceServer[]).find(
      (rs) =>
        rs.identifier === targetIdentifier ||
        rs.identifier === targetIdentifier.replace(/\/+$/, "") ||
        targetIdentifier === `${rs.identifier}/`
    );

    if (!match) {
      return [];
    }

    return match.scopes?.map((s) => s.value) ?? [];
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        throw new Error(
          `[Auth0] Management API returned 401 Unauthorized. ` +
            `Your M2M application needs the 'read:resource_servers' permission.`
        );
      }
      if (error.message.includes("403")) {
        throw new Error(
          `[Auth0] Management API returned 403 Forbidden. ` +
            `Your M2M application doesn't have access to the Management API.`
        );
      }
    }
    throw error;
  }
}
