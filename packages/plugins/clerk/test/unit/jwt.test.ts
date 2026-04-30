import { describe, it, expect } from "vitest";
import {
  getIssuer,
  claimsToSession,
  extractBearerToken,
} from "../../src/jwt.js";
import type { JWTClaims } from "../../src/types.js";

describe("getIssuer", () => {
  it("normalizes a bare clerk domain to https://<domain>", () => {
    expect(getIssuer("clerk.example.com")).toBe("https://clerk.example.com");
  });

  it("strips an existing https:// prefix before re-prepending", () => {
    expect(getIssuer("https://clerk.example.com")).toBe(
      "https://clerk.example.com"
    );
  });

  it("strips an http:// prefix and upgrades to https://", () => {
    expect(getIssuer("http://clerk.example.com")).toBe(
      "https://clerk.example.com"
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
  it("converts unix-second exp/iat to Date and forwards the rest", () => {
    const claims: JWTClaims = {
      sub: "user_1",
      sid: "sess_1",
      org_id: "org_1",
      org_role: "admin",
      org_permissions: ["read", "write"],
      azp: "client_1",
      iss: "https://clerk.example.com",
      exp: 1_700_000_000,
      iat: 1_699_996_400,
    };

    const session = claimsToSession(claims);
    expect(session.userId).toBe("user_1");
    expect(session.sessionId).toBe("sess_1");
    expect(session.organizationId).toBe("org_1");
    expect(session.organizationRole).toBe("admin");
    expect(session.organizationPermissions).toEqual(["read", "write"]);
    expect(session.expiresAt.getTime()).toBe(1_700_000_000_000);
    expect(session.issuedAt.getTime()).toBe(1_699_996_400_000);
    expect(session.claims).toBe(claims);
  });
});
