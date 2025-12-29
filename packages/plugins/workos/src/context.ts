import type { IncomingHttpHeaders } from "http";
import { createContext } from "xmcp";
import type { WorkOSConfig } from "./types.js";

/**
 * JWT payload from a decoded WorkOS access token
 */
export interface JWTPayload {
  readonly sub?: string;
  readonly email?: string;
  readonly first_name?: string | null;
  readonly last_name?: string | null;
  readonly profile_picture_url?: string | null;
  readonly email_verified?: boolean;
  readonly org_id?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  readonly exp?: number;
  readonly iat?: number;
  readonly iss?: string;
  readonly aud?: string | string[];
  readonly act?: {
    readonly sub: string;
    readonly reason?: string;
  };
  readonly [key: string]: unknown;
}

/**
 * Context stored for WorkOS authentication
 */
interface WorkOSContext {
  readonly config: WorkOSConfig;
  readonly headers: IncomingHttpHeaders;
  readonly payload?: JWTPayload;
}

export const workosContext = createContext<WorkOSContext>({
  name: "workos-context",
});

export const setWorkOSContext = workosContext.setContext;

export const getWorkOSContext = workosContext.getContext;

export const workosContextProvider = workosContext.provider;
