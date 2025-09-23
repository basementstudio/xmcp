interface Configuration {
  type: "production" | "sandbox";
  token: string;
  organization_id: string;
  product_id: string;
  base_url: string;
}

interface ValidateLicenseKeyResponse {
  status: "granted" | "denied";
  usage: number;
  limit_usage: number | null;
  limit_activations: number | null;
  expires_at: string | null;
  validations: number;
  key: string;
  display_key: string;
}

interface ValidateLicenseKeyResult {
  valid: boolean;
  code: string;
  message: string;
}

interface CheckoutResponse {
  id: string;
  url: string;
}

export class PolarProvider {
  private static instance: PolarProvider | null = null;
  private readonly endpointUrl: string;

  private constructor(private readonly config: Configuration) {
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

  private async evaluate(
    licenseKey: string
  ): Promise<ValidateLicenseKeyResponse> {
    const endpoint = this.endpointUrl + "/v1/license-keys/validate";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        key: licenseKey,
        organization_id: this.config.organization_id,
      }),
    });

    const data = (await response.json()) as ValidateLicenseKeyResponse;

    return data;
  }

  private async validate(
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
      return await this.validate(response);
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
        message: `An error occurred while validating the license key. Purchase a valid license at: ${checkoutUrl}`,
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
        products: [this.config.product_id],
      }),
    });

    const data = (await response.json()) as CheckoutResponse;

    return data.url;
  }
}
