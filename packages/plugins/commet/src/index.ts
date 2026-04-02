import { Commet } from "@commet/node";
import type {
  Configuration,
  CheckResult,
  TrackOptions,
  TrackResult,
} from "./types.js";

export {
  type Configuration,
  type CheckResult,
  type TrackOptions,
  type TrackResult,
} from "./types.js";

type CustomerContext = ReturnType<Commet["customer"]>;

export class CommetProvider {
  private static instance: CommetProvider | null = null;
  private readonly client: Commet;

  private constructor(config: Configuration) {
    this.client = new Commet({
      apiKey: config.apiKey,
      environment: config.environment ?? "production",
    });
  }

  static getInstance(config: Configuration): CommetProvider {
    if (!CommetProvider.instance) {
      CommetProvider.instance = new CommetProvider(config);
    }
    return CommetProvider.instance;
  }

  /**
   * Check if a boolean feature is enabled for a customer.
   * No usage is tracked — this is a pure access gate.
   */
  async check(externalId: string, feature: string): Promise<CheckResult> {
    if (!externalId || externalId.trim() === "") {
      return {
        allowed: false,
        code: "customer_missing",
        message: "No customer identifier provided.",
      };
    }

    const customer = this.client.customer(externalId);

    try {
      const [featureResponse, subscriptionResponse] = await Promise.all([
        customer.features.check(feature),
        customer.subscription.get(),
      ]);

      const planName = subscriptionResponse.data?.plan.name;

      if (!featureResponse.success || !featureResponse.data?.allowed) {
        return this.buildDeniedCheckResult(customer, feature, planName);
      }

      return {
        allowed: true,
        code: "feature_enabled",
        message: "Feature is enabled.",
        plan: planName,
      };
    } catch {
      return {
        allowed: false,
        code: "check_failed",
        message: "An error occurred while checking feature access.",
      };
    }
  }

  /**
   * Check access to a feature and track consumption.
   * Supports simple units or AI token tracking by model.
   */
  async track(externalId: string, options: TrackOptions): Promise<TrackResult> {
    if (!externalId || externalId.trim() === "") {
      return {
        allowed: false,
        code: "customer_missing",
        message: "No customer identifier provided.",
      };
    }

    const customer = this.client.customer(externalId);

    try {
      const [featureResponse, subscriptionResponse] = await Promise.all([
        customer.features.get(options.feature),
        customer.subscription.get(),
      ]);

      const planName = subscriptionResponse.data?.plan.name;

      if (!featureResponse.success || !featureResponse.data) {
        return {
          allowed: false,
          code: "feature_check_failed",
          message: "Unable to verify feature access.",
        };
      }

      const featureAccess = featureResponse.data;

      if (!featureAccess.allowed) {
        return this.buildDeniedTrackResult(customer, featureAccess, planName);
      }

      await this.reportUsage(externalId, customer, options);

      return {
        allowed: true,
        code: "tracked",
        message: "Usage tracked.",
        plan: planName,
        remaining: featureAccess.remaining,
        included: featureAccess.included,
        overage: featureAccess.overage,
        unlimited: featureAccess.unlimited,
      };
    } catch {
      return {
        allowed: false,
        code: "track_failed",
        message: "An error occurred while tracking usage.",
      };
    }
  }

  // ── Internal ──

  private async reportUsage(
    externalId: string,
    customer: CustomerContext,
    options: TrackOptions
  ): Promise<void> {
    if ("model" in options && options.model) {
      await this.client.usage.track({
        feature: options.feature,
        externalId,
        model: options.model,
        inputTokens: options.inputTokens,
        outputTokens: options.outputTokens,
        cacheReadTokens: options.cacheReadTokens,
        cacheWriteTokens: options.cacheWriteTokens,
      });
    } else {
      await customer.usage.track(options.feature, options.units);
    }
  }

  private async buildDeniedCheckResult(
    customer: CustomerContext,
    feature: string,
    planName?: string
  ): Promise<CheckResult> {
    const portalUrl = await this.fetchPortalUrl(customer);

    const message = planName
      ? `Your ${planName} plan does not include this feature.`
      : "No active subscription found.";

    return {
      allowed: false,
      code: "feature_not_allowed",
      message,
      plan: planName,
      portalUrl,
    };
  }

  private async buildDeniedTrackResult(
    customer: CustomerContext,
    featureAccess: { code: string; name: string },
    planName?: string
  ): Promise<TrackResult> {
    const portalUrl = await this.fetchPortalUrl(customer);

    const message = planName
      ? `Your ${planName} plan does not include ${featureAccess.name}.`
      : "No active subscription found.";

    return {
      allowed: false,
      code: "feature_not_allowed",
      message,
      plan: planName,
      portalUrl,
    };
  }

  private async fetchPortalUrl(
    customer: CustomerContext
  ): Promise<string | undefined> {
    try {
      const portalResponse = await customer.portal.getUrl();
      if (portalResponse.success && portalResponse.data) {
        return portalResponse.data.portalUrl;
      }
    } catch {
      // Portal URL is best-effort
    }
    return undefined;
  }
}
