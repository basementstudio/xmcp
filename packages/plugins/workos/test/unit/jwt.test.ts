import { describe, it, expect } from "vitest";
import { claimsToSession, extractBearerToken } from "../../src/jwt.js";
import { getAuthKitBaseUrl } from "../../src/utils.js";
import type { JWTClaims } from "../../src/types.js";

describe("getAuthKitBaseUrl", () => {
  it("prepends https:// to a bare authkit domain", () => {
    expect(getAuthKitBaseUrl("auth.example.com")).toBe(
      "https://auth.example.com"
    );
  });
});

describe("extractBearerToken", () => {
  it("returns the token when the header is well-formed", () => {
    expect(extractBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("is case-insensitive on the scheme name", () => {
    expect(extractBearerToken("bearer abc")).toBe("abc");
    expect(extractBearerToken("BEARER abc")).toBe("abc");
  });

  it("returns null for missing, malformed, or non-Bearer headers", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken("")).toBeNull();
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("Bearer abc def")).toBeNull();
  });
});

describe("claimsToSession", () => {
  it("converts unix-second exp/iat to Date and forwards optional org fields", () => {
    const claims: JWTClaims = {
      sub: "user_1",
      sid: "sess_1",
      org_id: "org_1",
      role: "admin",
      permissions: ["read", "write"],
      iss: "https://auth.example.com",
      exp: 1_700_000_000,
      iat: 1_699_996_400,
    } as JWTClaims;

    const session = claimsToSession(claims);
    expect(session.userId).toBe("user_1");
    expect(session.sessionId).toBe("sess_1");
    expect(session.organizationId).toBe("org_1");
    expect(session.role).toBe("admin");
    expect(session.permissions).toEqual(["read", "write"]);
    expect(session.expiresAt.getTime()).toBe(1_700_000_000_000);
    expect(session.issuedAt.getTime()).toBe(1_699_996_400_000);
    expect(session.claims).toBe(claims);
  });
});
