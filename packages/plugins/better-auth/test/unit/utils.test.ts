import { describe, it, expect } from "vitest";
import { processProvidersResponse } from "../../src/utils.js";
import type { BetterAuthConfig } from "../../src/types.js";

type Providers = NonNullable<BetterAuthConfig["providers"]>;

describe("processProvidersResponse", () => {
  it("returns an empty providers map when given undefined", () => {
    const result = processProvidersResponse(undefined);
    expect(result).toEqual({ providers: {} });
  });

  it("forwards emailAndPassword config when enabled", () => {
    const providers: Providers = {
      emailAndPassword: { enabled: true, minPasswordLength: 12 },
    };
    const result = processProvidersResponse(providers);
    expect(result.providers.emailAndPassword).toEqual({
      enabled: true,
      minPasswordLength: 12,
    });
  });

  it("omits emailAndPassword when disabled", () => {
    const providers: Providers = {
      emailAndPassword: { enabled: false },
    };
    const result = processProvidersResponse(providers);
    expect(result.providers.emailAndPassword).toBeUndefined();
  });

  it("exposes only an enabled flag for google — never the secret or id", () => {
    const providers: Providers = {
      emailAndPassword: { enabled: false },
      google: { clientId: "id-abc", clientSecret: "secret-xyz" },
    };
    const result = processProvidersResponse(providers);
    expect(result.providers.google).toEqual({ enabled: true });
    expect(JSON.stringify(result)).not.toContain("secret-xyz");
    expect(JSON.stringify(result)).not.toContain("id-abc");
  });

  it("drops google when only one of clientId / clientSecret is set", () => {
    const onlyId = processProvidersResponse({
      emailAndPassword: { enabled: false },
      google: { clientId: "id-abc", clientSecret: "" },
    } as Providers);
    expect(onlyId.providers.google).toBeUndefined();

    const onlySecret = processProvidersResponse({
      emailAndPassword: { enabled: false },
      google: { clientId: "", clientSecret: "secret-xyz" },
    } as Providers);
    expect(onlySecret.providers.google).toBeUndefined();
  });
});
