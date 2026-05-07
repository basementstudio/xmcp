import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PolarProvider } from "../../src/index.js";
import type { Configuration } from "../../src/types.js";

const baseConfig: Configuration = {
  token: "tok_test",
  organizationId: "org_test",
  productId: "prod_test",
};

describe("PolarProvider singleton", () => {
  beforeEach(() => {
    // PolarProvider's instance is held in a module-level static, so it leaks
    // between tests unless reset. The class doesn't expose a reset hook —
    // poke through the cast since the singleton behaviour is the contract
    // under test.
    (PolarProvider as unknown as { instance: null }).instance = null;
  });

  it("returns the same instance on repeat calls regardless of the second config", () => {
    const a = PolarProvider.getInstance(baseConfig);
    const b = PolarProvider.getInstance({ ...baseConfig, token: "different" });
    expect(b).toBe(a);
  });

  it("defaults config.type to production and routes to the production endpoint", async () => {
    // Spy on global fetch so we observe the URL the provider builds, without
    // hitting the real Polar API.
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ benefits: [{ id: "b1", type: "meter_credit" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    const provider = PolarProvider.getInstance(baseConfig);
    await provider.getMeterIdFromProduct();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0]![0];
    expect(url).toBe("https://api.polar.sh/v1/products/prod_test");
    fetchSpy.mockRestore();
  });

  it("routes to the sandbox endpoint when type is 'sandbox'", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ benefits: [{ id: "b1", type: "meter_credit" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    const provider = PolarProvider.getInstance({
      ...baseConfig,
      type: "sandbox",
    });
    await provider.getMeterIdFromProduct();

    const url = fetchSpy.mock.calls[0]![0];
    expect(url).toBe("https://sandbox-api.polar.sh/v1/products/prod_test");
    fetchSpy.mockRestore();
  });
});

describe("PolarProvider.getMeterIdFromProduct", () => {
  let restoreInstance: () => void;

  beforeEach(() => {
    (PolarProvider as unknown as { instance: null }).instance = null;
    restoreInstance = () => {
      (PolarProvider as unknown as { instance: null }).instance = null;
    };
  });

  afterEach(() => {
    restoreInstance();
    vi.restoreAllMocks();
  });

  it("prefers benefit.meter_id over benefit.id when both are present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          benefits: [
            {
              id: "benefit-uuid",
              type: "meter_credit",
              meter_id: "meter-uuid",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const provider = PolarProvider.getInstance(baseConfig);
    const meterId = await provider.getMeterIdFromProduct();
    expect(meterId).toBe("meter-uuid");
  });

  it("throws when no meter_credit benefit is present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          benefits: [{ id: "b1", type: "downloadable" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const provider = PolarProvider.getInstance(baseConfig);
    await expect(provider.getMeterIdFromProduct()).rejects.toThrow(
      /meter credit benefit/i
    );
  });
});
