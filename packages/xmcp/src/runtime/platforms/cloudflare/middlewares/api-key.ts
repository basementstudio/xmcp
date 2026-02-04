import { z } from "zod/v3";
import type { WebMiddleware } from "@/types/middleware";

const apiKeyAuthMiddlewareConfigSchema = z
  .object({
    apiKey: z.string().optional(),
    headerName: z.string().optional(),
    validateApiKey: z
      .function()
      .args(z.string())
      .returns(z.promise(z.boolean()))
      .optional(),
  })
  .strict()
  .refine(
    (config) =>
      config.apiKey !== undefined || config.validateApiKey !== undefined,
    {
      message: "Either 'apiKey' or 'validateApiKey' must be provided",
    }
  )
  .refine(
    (config) =>
      !(config.apiKey !== undefined && config.validateApiKey !== undefined),
    {
      message:
        "'apiKey' and 'validateApiKey' are mutually exclusive - provide only one",
    }
  );

const errorMessage = "Unauthorized: Missing or invalid API key";

type StaticApiKeyConfig = {
  /** The static API key to validate against */
  apiKey: string;
  /** Optional header name to read the API key from. Defaults to 'x-api-key' */
  headerName?: string;
};

type CustomValidationConfig = {
  /** Optional header name to read the API key from. Defaults to 'x-api-key' */
  headerName?: string;
  /** Custom validation function that receives the API key and returns a Promise<boolean> */
  validateApiKey: (key: string) => Promise<boolean>;
};

export function cloudflareApiKeyAuthMiddleware(
  config: StaticApiKeyConfig
): WebMiddleware;

export function cloudflareApiKeyAuthMiddleware(
  config: CustomValidationConfig
): WebMiddleware;

export function cloudflareApiKeyAuthMiddleware(
  config: StaticApiKeyConfig | CustomValidationConfig
): WebMiddleware {
  const response = apiKeyAuthMiddlewareConfigSchema.safeParse(config);
  if (!response.success) {
    const hasApiKey = "apiKey" in config;
    const hasValidateApiKey = "validateApiKey" in config;

    if (hasApiKey && hasValidateApiKey) {
      throw new Error(
        "'apiKey' and 'validateApiKey' are mutually exclusive - provide only one"
      );
    } else if (!hasApiKey && !hasValidateApiKey) {
      throw new Error("Either 'apiKey' or 'validateApiKey' must be provided");
    } else {
      throw new Error(`Invalid configuration: ${response.error.message}`);
    }
  }

  const headerName = config.headerName ?? "x-api-key";
  const apiKey = "apiKey" in config ? config.apiKey : undefined;
  const validateApiKey =
    "validateApiKey" in config ? config.validateApiKey : undefined;

  return async (request) => {
    const apiKeyHeader = request.headers.get(headerName);
    if (!apiKeyHeader) {
      return jsonUnauthorized(errorMessage);
    }
    if ("apiKey" in config && apiKeyHeader !== apiKey) {
      return jsonUnauthorized(errorMessage);
    }
    if (validateApiKey) {
      const isValid = await validateApiKey(apiKeyHeader);
      if (!isValid) {
        return jsonUnauthorized(errorMessage);
      }
    }
    return;
  };
}

function jsonUnauthorized(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
