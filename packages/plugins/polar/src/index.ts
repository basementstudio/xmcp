import type {
  Configuration,
  CustomerData,
  ValidateLicenseKeyResponse,
  ValidateLicenseKeyResult,
  CheckoutResponse,
  UsageResult,
  ProductResponse,
  CustomerStateResponse,
  EventPayload,
  EventIngestResponse,
  ActiveMeter,
} from "./types.js";

declare global {
  var __XMCP_CURRENT_TOOL_NAME: string | undefined;
}

export { type Configuration, type ValidateLicenseKeyResult } from "./types.js";

export class PolarProvider {
  private static instance: PolarProvider | null = null;
  private readonly endpointUrl: string;
  private customerData: CustomerData | null = null;
  private static meterId: string | null = null; // get once

  private constructor(private readonly config: Configuration) {
    this.config.type = this.config.type ?? "production";
    this.endpointUrl =
      this.config.type === "sandbox"
        ? "https://sandbox-api.polar.sh"
        : "https://api.polar.sh";
  }

  static getInstance(config: Configuration): PolarProvider {
    if (!PolarProvider.instance) {
      PolarProvider.instance = new PolarProvider(config);
    }
    return PolarProvider.instance;
  }

  async getMeterIdFromProduct(): Promise<string> {
    const endpoint = this.endpointUrl + "/v1/products/" + this.config.productId;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    const data = (await response.json()) as ProductResponse;

    // search in data.benefits (array) for type = meter credit and get the id from that object
    const meterCreditBenefit = data.benefits.find(
      (benefit) => benefit.type === "meter_credit"
    );

    if (!meterCreditBenefit) {
      throw new Error("No meter credit benefit found in product");
    }

    // the benefit ID might not be the same as the meter ID
    // We might need to use the meter_id property if it exists
    const meterId = meterCreditBenefit.meter_id || meterCreditBenefit.id;

    return meterId;
  }

  private async hasUsageLeft(): Promise<UsageResult> {
    if (!PolarProvider.meterId && this.config.eventName) {
      try {
        PolarProvider.meterId = await this.getMeterIdFromProduct();
      } catch (error) {
        return { hasUsage: false, message: "Failed to get meter ID" };
      }
    }

    if (!PolarProvider.meterId || !this.customerData?.id) {
      return { hasUsage: false, message: "No meter tracking configured" };
    }

    try {
      const endpoint = `${this.endpointUrl}/v1/customers/${this.customerData.id}/state`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        return { hasUsage: false, message: "Customer state API failed" };
      }

      const data = (await response.json()) as CustomerStateResponse;

      // check if customer has any meter credit benefits
      const meterCreditBenefits =
        data.granted_benefits?.filter(
          (benefit) => benefit.benefit_type === "meter_credit"
        ) || [];

      if (meterCreditBenefits.length === 0) {
        // ONLY case for unlimited usage: no meter credit benefits set up at all
        return { hasUsage: true };
      }

      // automatically find the meter that corresponds to this event
      let targetMeter: ActiveMeter | null = null;

      // verify customer has the granted meter credit benefit for this product
      const grantedMeterBenefit = data.granted_benefits?.find(
        (benefit) =>
          benefit.benefit_id === PolarProvider.meterId &&
          benefit.benefit_type === "meter_credit"
      );

      if (!grantedMeterBenefit) {
        return { hasUsage: false, message: "No granted meter benefit found" };
      }

      // since we're using a single event name, we expect a single meter to be associated with it
      const activeMeters = data.active_meters || [];

      if (activeMeters.length === 0) {
        return { hasUsage: false, message: "No active meters found" };
      }

      // use the first meter that has been credited (indicating it's active for this event)
      const creditedMeter = activeMeters.find(
        (meter) => meter.credited_units > 0
      );

      if (creditedMeter) {
        targetMeter = creditedMeter;
      } else {
        // if no meters have been credited, meter credits exist but no credits allocated yet
        return {
          hasUsage: false,
          message: "No credited meters found - purchase credits to continue",
        };
      }

      if (!targetMeter) {
        return { hasUsage: false, message: "No target meter found" };
      }

      const { consumed_units, credited_units, balance } = targetMeter;
      const hasUsage = balance > 0;

      if (!hasUsage) {
        return {
          hasUsage: false,
          message: `Usage meter credit exhausted. You have consumed ${consumed_units} credits out of ${credited_units}.`,
        };
      }

      return { hasUsage: true };
    } catch (error) {
      return {
        hasUsage: false,
        message: "Error checking customer meter usage",
      };
    }
  }

  async evaluate(licenseKey: string): Promise<ValidateLicenseKeyResponse> {
    const endpoint = this.endpointUrl + "/v1/license-keys/validate";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        key: licenseKey,
        organization_id: this.config.organizationId,
      }),
    });

    const data = (await response.json()) as ValidateLicenseKeyResponse;

    // save the customer Id for usage in ingestEvents in case of enabled
    this.customerData = {
      id: data.customer.id,
      external_id: data.customer.external_id,
    };

    return data;
  }

  async validate(
    object: ValidateLicenseKeyResponse
  ): Promise<ValidateLicenseKeyResult> {
    let checkoutUrl = "";
    try {
      checkoutUrl = await this.getCheckoutUrl();
    } catch (error) {
      checkoutUrl = "";
    }

    // status is granted
    if (object.status !== "granted") {
      return {
        valid: false,
        code: "license_key_not_granted",
        message: `License key access denied. Purchase a valid license at: ${checkoutUrl}`,
      };
    }

    // usage limits
    if (object.limit_usage !== null && object.usage >= object.limit_usage) {
      return {
        valid: false,
        code: "license_key_usage_limit_reached",
        message: `License key usage limit reached (${object.usage}/${object.limit_usage}). Purchase a new license at: ${checkoutUrl}`,
      };
    }

    // expiration date
    if (object.expires_at !== null) {
      const expirationDate = new Date(object.expires_at);
      const currentDate = new Date();
      if (currentDate >= expirationDate) {
        return {
          valid: false,
          code: "license_key_expired",
          message: `License key expired on ${expirationDate.toLocaleDateString()}. Purchase a new license at: ${checkoutUrl}`,
        };
      }
    }

    return {
      valid: true,
      code: "license_key_valid",
      message: "License key is valid and active",
    };
  }

  async validateLicenseKey(
    licenseKey: string
  ): Promise<ValidateLicenseKeyResult> {
    try {
      const response = await this.evaluate(licenseKey);
      const validateResponse = await this.validate(response);

      // only check usage if we have valid license and meter tracking is configured
      if (validateResponse.valid && this.config.eventName) {
        const usageResult = await this.hasUsageLeft();

        if (!usageResult.hasUsage) {
          let checkoutUrl = "";
          try {
            checkoutUrl = await this.getCheckoutUrl();
          } catch (error) {
            checkoutUrl = "";
          }
          return {
            valid: false,
            code: "meter_credit_exhausted",
            message: `${usageResult.message} Purchase additional credits at: ${checkoutUrl}`,
          };
        }

        // if we reach here, usage is available
        // ingest usage event after validation
        await this.ingestEvents();
      }

      return validateResponse;
    } catch (error) {
      let checkoutUrl: string | null;
      try {
        checkoutUrl = await this.getCheckoutUrl();
      } catch (checkoutError) {
        checkoutUrl = null;
      }

      return {
        valid: false,
        code: "license_key_error",
        message: `An error occurred while validating the license key. Please provide a valid license key in the 'license-key' header. Purchase a valid license at: ${checkoutUrl}`,
      };
    }
  }

  async getCheckoutUrl(): Promise<string> {
    const endpoint = this.endpointUrl + "/v1/checkouts";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        products: [this.config.productId],
      }),
    });

    const data = (await response.json()) as CheckoutResponse;
    return data.url;
  }

  async ingestEvents(): Promise<EventIngestResponse> {
    const finalToolName = global.__XMCP_CURRENT_TOOL_NAME;

    if (!finalToolName) {
      return { error: "No tool name available" };
    }

    const endpoint = this.endpointUrl + "/v1/events/ingest";

    const customerType = this.customerData?.id
      ? "customer_id"
      : "external_customer_id";

    const customerId =
      customerType === "customer_id"
        ? this.customerData?.id
        : this.customerData?.external_id;

    const eventPayload: EventPayload = {
      events: [
        {
          name: this.config.eventName!,
          [customerType]: customerId,
          metadata: {
            tool_name: finalToolName,
            calls: 1,
          },
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify(eventPayload),
    });

    const data = (await response.json()) as EventIngestResponse;
    return data;
  }
}
