import { Router } from "express";
import { Middleware } from "xmcp";

interface Configuration {
  type: "production" | "sandbox";
  token: string;
  organization_id: string;
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
    // Check if status is granted
    if (object.status !== "granted") {
      return {
        valid: false,
        code: "license_key_not_granted",
      };
    }

    // Check usage limits
    if (object.limit_usage !== null && object.usage >= object.limit_usage) {
      return {
        valid: false,
        code: "license_key_usage_limit_reached",
      };
    }

    // Check expiration date
    if (object.expires_at !== null) {
      const expirationDate = new Date(object.expires_at);
      const currentDate = new Date();
      if (currentDate >= expirationDate) {
        return {
          valid: false,
          code: "license_key_expired",
        };
      }
    }

    // All validations passed
    return {
      valid: true,
      code: "license_key_valid",
    };
  }

  async validateLicenseKey(
    licenseKey: string
  ): Promise<ValidateLicenseKeyResult> {
    try {
      const response = await this.evaluate(licenseKey);
      return await this.validate(response);
    } catch (error) {
      return {
        valid: false,
        code: "license_key_error",
      };
    }
  }

  async getCheckoutUrl(product_id: string): Promise<string> {
    const endpoint = this.endpointUrl + "/v1/checkouts";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        products: [product_id],
      }),
    });

    const data = (await response.json()) as CheckoutResponse;

    return data.url;
  }
}

export function polarProvider(): Middleware {
  // return a router that adds the success url to the checkout
  return {
    middleware: (req, res, next) => {
      next();
    },
    router: polarRouter(),
  };
}

function polarRouter(): Router {
  const router = Router();

  router.get("/success", (req, res) => {
    // return a 200 status code and a message with the checkout id
    res.status(200).json({ message: `Checkout ID: ${req.query.checkout_id}` });
  });

  return router;
}
