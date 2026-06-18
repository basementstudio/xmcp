import { getClientContext, getSessionContext } from "./context.js";
import { getManagementClient } from "./client.js";
import type { DescopeSession } from "./types.js";

type MgmtClient = ReturnType<typeof getManagementClient>;
type UserData = Awaited<ReturnType<MgmtClient["user"]["loadByUserId"]>>["data"];

export function getSession(): DescopeSession {
  const ctx = getSessionContext();
  if (!ctx) {
    throw new Error(
      "getSession() called outside of Descope middleware. Ensure descopeProvider middleware is registered.",
    );
  }
  if (ctx.session === null) {
    throw new Error("getSession() called but no authenticated session exists for this request.");
  }
  return ctx.session;
}

export async function getUser(): Promise<NonNullable<UserData>> {
  const session = getSession();
  const mgmt = getManagementClient();
  const response = await mgmt.user.loadByUserId(session.userId);
  if (!response.ok || !response.data) {
    throw new Error(`Failed to load user: ${response.error?.errorMessage ?? "unknown error"}`);
  }
  return response.data;
}

export async function fetchConnectionToken(appId: string): Promise<string> {
  const session = getSession();
  const ctx = getClientContext();
  if (!ctx) throw new Error("fetchConnectionToken() called outside of Descope middleware.");

  const resp = await fetch("https://api.descope.com/v1/mgmt/outbound/app/user/token/latest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ctx.projectId}:${session.token}`,
    },
    body: JSON.stringify({ appId, userId: session.userId }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(`Failed to fetch connection token for "${appId}": ${resp.status}${err["errorDescription"] ? ` — ${err["errorDescription"]}` : ""}`);
  }

  const data = await resp.json() as { token: { accessToken: string } };
  return data.token.accessToken;
}
