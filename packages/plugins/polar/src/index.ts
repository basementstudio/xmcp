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
  Event,
} from "./types.js";

export { type Configuration, type ValidateLicenseKeyResult } from "./types.js";

export class PolarProvider {
  private static instance: PolarProvider | null = null;
  private readonly endpointUrl: string;
  private customerData: CustomerData | null = null;
  private static meterId: string | null = null; // get once
  private event: Event | null = null;

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
    console.log("[PolarProvider] Checking usage left...");
    console.log("[PolarProvider] Current meterId:", PolarProvider.meterId);
    console.log("[PolarProvider] Current event:", this.event);
    console.log("[PolarProvider] Current customerData:", this.customerData);

    if (!PolarProvider.meterId && this.event?.name) {
      console.log(
        "[PolarProvider] No meter ID set, attempting to get from product..."
      );
      try {
        PolarProvider.meterId = await this.getMeterIdFromProduct();
        console.log(
          "[PolarProvider] Retrieved meter ID:",
          PolarProvider.meterId
        );
      } catch (error) {
        console.error("[PolarProvider] Failed to get meter ID:", error);
        return { hasUsage: false, message: "Failed to get meter ID" };
      }
    }

    if (!PolarProvider.meterId || !this.customerData?.id) {
      console.log("[PolarProvider] Missing meter ID or customer ID");
      return { hasUsage: false, message: "No meter tracking configured" };
    }

    try {
      const endpoint = `${this.endpointUrl}/v1/customers/${this.customerData.id}/state`;
      console.log("[PolarProvider] Fetching customer state from:", endpoint);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      console.log(
        "[PolarProvider] Customer state response status:",
        response.status
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[PolarProvider] Customer state API failed:",
          response.status,
          errorText
        );
        return { hasUsage: false, message: "Customer state API failed" };
      }

      const data = (await response.json()) as CustomerStateResponse;
      console.log(
        "[PolarProvider] Customer state data:",
        JSON.stringify(data, null, 2)
      );

      // check if customer has any meter credit benefits
      const meterCreditBenefits =
        data.granted_benefits?.filter(
          (benefit) => benefit.benefit_type === "meter_credit"
        ) || [];

      console.log(
        "[PolarProvider] Found meter credit benefits:",
        meterCreditBenefits.length
      );

      if (meterCreditBenefits.length === 0) {
        // ONLY case for unlimited usage: no meter credit benefits set up at all
        console.log(
          "[PolarProvider] No meter credit benefits found - unlimited usage"
        );
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

      console.log(
        "[PolarProvider] Granted meter benefit for this meter:",
        grantedMeterBenefit
      );

      if (!grantedMeterBenefit) {
        console.log(
          "[PolarProvider] No granted meter benefit found for meter ID:",
          PolarProvider.meterId
        );
        return { hasUsage: false, message: "No granted meter benefit found" };
      }

      // since we're using a single event name, we expect a single meter to be associated with it
      const activeMeters = data.active_meters || [];
      console.log("[PolarProvider] Active meters:", activeMeters);

      if (activeMeters.length === 0) {
        console.log("[PolarProvider] No active meters found");
        return { hasUsage: false, message: "No active meters found" };
      }

      // use the first meter that has been credited (indicating it's active for this event)
      const creditedMeter = activeMeters.find(
        (meter) => meter.credited_units > 0
      );

      console.log("[PolarProvider] Credited meter:", creditedMeter);

      if (creditedMeter) {
        targetMeter = creditedMeter;
      } else {
        // if no meters have been credited, meter credits exist but no credits allocated yet
        console.log("[PolarProvider] No credited meters found");
        return {
          hasUsage: false,
          message: "No credited meters found - purchase credits to continue",
        };
      }

      if (!targetMeter) {
        console.log("[PolarProvider] No target meter identified");
        return { hasUsage: false, message: "No target meter found" };
      }

      const { consumed_units, credited_units, balance } = targetMeter;
      console.log(
        "[PolarProvider] Meter usage - consumed:",
        consumed_units,
        "credited:",
        credited_units,
        "balance:",
        balance
      );

      const hasUsage = balance > 0;

      if (!hasUsage) {
        console.log("[PolarProvider] No usage credits remaining");
        return {
          hasUsage: false,
          message: `Usage meter credit exhausted. You have consumed ${consumed_units} credits out of ${credited_units}.`,
        };
      }

      console.log("[PolarProvider] Usage credits available");
      return { hasUsage: true };
    } catch (error) {
      console.error(
        "[PolarProvider] Error checking customer meter usage:",
        error
      );
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
    licenseKey: string,
    event: Event
  ): Promise<ValidateLicenseKeyResult> {
    console.log("[PolarProvider] validateLicenseKey called");
    console.log("[PolarProvider] License key provided:", !!licenseKey);
    console.log("[PolarProvider] Event provided:", event);

    // Store event for use in event ingestion
    this.event = event;
    console.log("[PolarProvider] Event stored for tracking:", this.event);

    if (!licenseKey || licenseKey.trim() === "") {
      let checkoutUrl = "";
      try {
        checkoutUrl = await this.getCheckoutUrl();
      } catch (error) {
        checkoutUrl = "";
      }

      return {
        valid: false,
        code: "license_key_missing",
        message: `No license key provided. Please provide a valid license key in the 'license-key' header. Purchase a valid license at: ${checkoutUrl}`,
      };
    }

    try {
      const response = await this.evaluate(licenseKey);

      const validateResponse = await this.validate(response);

      // only check usage if we have valid license and meter tracking is configured
      if (validateResponse.valid && this.event?.name) {
        console.log(
          "[PolarProvider] License is valid and event name provided, checking usage..."
        );
        console.log("[PolarProvider] Event to track:", this.event);

        const usageResult = await this.hasUsageLeft();
        console.log("[PolarProvider] Usage check result:", usageResult);

        if (!usageResult.hasUsage) {
          console.log("[PolarProvider] No usage left, returning error");
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
        console.log(
          "[PolarProvider] Usage available, proceeding with event ingestion..."
        );
        const ingestResult = await this.ingestEvents();
        console.log("[PolarProvider] Event ingestion result:", ingestResult);
      } else {
        console.log(
          "[PolarProvider] Skipping event ingestion - license valid:",
          validateResponse.valid,
          "event name:",
          this.event?.name
        );
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
    console.log("[PolarProvider] Starting event ingestion");

    const endpoint = this.endpointUrl + "/v1/events/ingest";
    console.log("[PolarProvider] Ingestion endpoint:", endpoint);

    // Log the current state
    console.log("[PolarProvider] Current event:", this.event);
    console.log("[PolarProvider] Current customer data:", this.customerData);
    console.log("[PolarProvider] Meter ID:", PolarProvider.meterId);

    const eventPayload: EventPayload = {
      events: [
        {
          name: this.event?.name!,
          customer_id: this.customerData?.id,
          metadata: this.event?.metadata!,
        },
      ],
    };

    console.log(
      "[PolarProvider] Event payload to be sent:",
      JSON.stringify(eventPayload, null, 2)
    );

    try {
      console.log("[PolarProvider] Sending event ingestion request...");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify(eventPayload),
      });

      console.log(
        "[PolarProvider] Event ingestion response status:",
        response.status
      );
      console.log(
        "[PolarProvider] Event ingestion response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[PolarProvider] Event ingestion failed with status:",
          response.status
        );
        console.error("[PolarProvider] Error response body:", errorText);
        return {
          error: `Event ingestion failed: ${response.status} - ${errorText}`,
        };
      }

      const data = (await response.json()) as EventIngestResponse;
      console.log(
        "[PolarProvider] Event ingestion successful, response:",
        JSON.stringify(data, null, 2)
      );

      return data;
    } catch (error) {
      console.error("[PolarProvider] Event ingestion error:", error);
      return { error: `Failed to ingest event: ${error}` };
    }
  }
}
