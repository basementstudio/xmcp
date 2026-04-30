import { describe, it, expect, vi } from "vitest";
import {
  isToolPermissionDefined,
  userHasToolPermission,
  fetchResourceServerScopes,
  fetchUserPermissions,
} from "../../src/permissions.js";

// auth0's ManagementClient surface is large — we only need the two methods the
// helpers actually invoke. Cast the stub through `unknown` so tests stay
// decoupled from the SDK's full type without the auth0 package being installed
// in this test runner.
type StubClient = {
  resourceServers: { get: (id: string) => Promise<unknown> };
  users: {
    permissions: {
      list: (id: string, opts?: unknown) => Promise<{ data: unknown[] }>;
    };
  };
};

const asClient = (s: StubClient) =>
  s as unknown as Parameters<typeof fetchResourceServerScopes>[0];

describe("auth0 permissions — null-client guards", () => {
  it("isToolPermissionDefined returns null when management client is null", async () => {
    const result = await isToolPermissionDefined(null, "aud", "greet");
    expect(result).toBeNull();
  });

  it("userHasToolPermission returns null when management client is null", async () => {
    const result = await userHasToolPermission(null, "user_1", "aud", "greet");
    expect(result).toBeNull();
  });

  it("isToolPermissionDefined returns null (not throws) when the SDK call rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = asClient({
      resourceServers: {
        get: () => Promise.reject(new Error("network")),
      },
      users: { permissions: { list: () => Promise.resolve({ data: [] }) } },
    });
    const result = await isToolPermissionDefined(client, "aud", "greet");
    expect(result).toBeNull();
    errorSpy.mockRestore();
  });
});

describe("auth0 permissions — happy path", () => {
  it("fetchResourceServerScopes collects scope.value strings into a Set", async () => {
    const client = asClient({
      resourceServers: {
        get: () =>
          Promise.resolve({
            scopes: [
              { value: "tool:greet" },
              { value: "tool:echo" },
              // Guards: missing value, non-string value, no scopes array.
              { description: "no value" },
              { value: 123 },
            ],
          }),
      },
      users: { permissions: { list: () => Promise.resolve({ data: [] }) } },
    });

    const scopes = await fetchResourceServerScopes(client, "aud");
    expect(scopes).toEqual(new Set(["tool:greet", "tool:echo"]));
  });

  it("isToolPermissionDefined returns true / false based on scope presence", async () => {
    const client = asClient({
      resourceServers: {
        get: () =>
          Promise.resolve({
            scopes: [{ value: "tool:greet" }],
          }),
      },
      users: { permissions: { list: () => Promise.resolve({ data: [] }) } },
    });

    expect(await isToolPermissionDefined(client, "aud", "greet")).toBe(true);
    expect(await isToolPermissionDefined(client, "aud", "missing")).toBe(false);
  });

  it("fetchUserPermissions filters to the configured audience and ignores unnamed entries", async () => {
    const client = asClient({
      resourceServers: { get: () => Promise.resolve({ scopes: [] }) },
      users: {
        permissions: {
          list: () =>
            Promise.resolve({
              data: [
                {
                  resource_server_identifier: "aud",
                  permission_name: "tool:greet",
                },
                // Wrong audience — must be filtered out.
                {
                  resource_server_identifier: "other-aud",
                  permission_name: "tool:greet",
                },
                // Right audience but missing name — also filtered out.
                {
                  resource_server_identifier: "aud",
                  permission_name: undefined,
                },
              ],
            }),
        },
      },
    });

    const permissions = await fetchUserPermissions(client, "user_1", "aud");
    expect(permissions).toEqual(new Set(["tool:greet"]));
  });
});
