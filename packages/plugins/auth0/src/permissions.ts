import type { Auth0Config, Auth0ManagementConfig } from "./types.js";

interface ManagementTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
}

interface ResourceServer {
  readonly id: string;
  readonly identifier: string;
  readonly scopes?: Array<{ readonly value: string }>;
}

export async function getManagementToken(
  domain: string,
  management: Auth0ManagementConfig
): Promise<string> {
  const audience = management.audience ?? `https://${domain}/api/v2/`;

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: management.clientId,
      client_secret: management.clientSecret,
      audience,
    }),
  });

  if (!response.ok) {
    const text = await response.text();

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `[Auth0] Failed to get Management API token: ${response.status}. ` +
          `Check that AUTH0_MGMT_CLIENT_ID and AUTH0_MGMT_CLIENT_SECRET are correct. Raw error: ${text}`
      );
    }

    throw new Error(
      `[Auth0] Failed to get management token: ${response.status} ${text}`
    );
  }

  const data = (await response.json()) as ManagementTokenResponse;
  if (!data.access_token) {
    throw new Error("[Auth0] Management token response missing access_token");
  }
  return data.access_token;
}

async function getResourceServers(
  domain: string,
  token: string
): Promise<ResourceServer[]> {
  const response = await fetch(
    `https://${domain}/api/v2/resource-servers?include_totals=false`,
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();

    if (response.status === 401) {
      throw new Error(
        `[Auth0] Management API returned 401 Unauthorized. ` +
          `Your M2M application likely needs the 'read:resource_servers' permission. ` +
          `Go to Auth0 Dashboard > Applications > APIs > Auth0 Management API > Machine to Machine Applications > ` +
          `Find your M2M app and grant the 'read:resource_servers' permission. Raw error: ${text}`
      );
    }

    if (response.status === 403) {
      throw new Error(
        `[Auth0] Management API returned 403 Forbidden. ` +
          `Your M2M application doesn't have access to the Management API. ` +
          `Ensure your M2M app is authorized for the Auth0 Management API. Raw error: ${text}`
      );
    }

    throw new Error(
      `[Auth0] Failed to list resource servers: ${response.status} ${text}`
    );
  }

  return (await response.json()) as ResourceServer[];
}

export async function fetchApiPermissions(
  config: Auth0Config
): Promise<readonly string[]> {
  if (!config.management) {
    return [];
  }

  const token = await getManagementToken(config.domain, config.management);
  const resourceServers = await getResourceServers(config.domain, token);

  const targetIdentifier =
    config.management.resourceServerIdentifier ??
    config.audience.replace(/\/+$/, "/");

  const match = resourceServers.find(
    (rs) =>
      rs.identifier === targetIdentifier ||
      rs.identifier === targetIdentifier.replace(/\/+$/, "") ||
      targetIdentifier === `${rs.identifier}/`
  );

  if (!match) {
    return [];
  }

  const permissions = match.scopes?.map((s) => s.value) ?? [];
  return permissions;
}
