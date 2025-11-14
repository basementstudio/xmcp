import { Request, Response, NextFunction, RequestHandler } from "express";
import * as z from "zod";

const apiKeyAuthMiddlewareConfigSchema = z
  .strictObject({
    apiKey: z.string().optional(),
    headerName: z.string().optional(),
    validateApiKey: z
      .function({
        input: z.tuple([z.string()]),
        output: z.promise(z.boolean()),
      })
      .optional(),
  })
  .refine(
    (config) =>
      config.apiKey !== undefined || config.validateApiKey !== undefined,
    {
      error: "Either 'apiKey' or 'validateApiKey' must be provided",
    }
  )
  .refine(
    (config) =>
      !(config.apiKey !== undefined && config.validateApiKey !== undefined),
    {
      error:
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

export function apiKeyAuthMiddleware(
  config: StaticApiKeyConfig
): RequestHandler;

export function apiKeyAuthMiddleware(
  config: CustomValidationConfig
): RequestHandler;

/**
 * Middleware to authenticate requests using an API key.
 * @param config - Configuration object containing either a static API key or a function to validate the API key.
 * @returns Express middleware function.
 *
 * @example
 * ```ts
 * const middleware = apiKeyAuthMiddleware({
 *   apiKey: process.env.API_KEY!,
 * });
 * ```
 *
 * @example
 * ```ts
 * const middleware = apiKeyAuthMiddleware({
 *   validateApiKey: async (key) => {
 *     return key === process.env.API_KEY!;
 *   },
 * });
 * ```
 */
export function apiKeyAuthMiddleware(
  config: StaticApiKeyConfig | CustomValidationConfig
): RequestHandler {
  // To do, we can maybe work on better error handling here, like typing the error messages etc
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

  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.header(headerName);
    if (!apiKeyHeader) {
      res.status(401).json({ error: errorMessage });
      return;
    }
    if ("apiKey" in config && apiKeyHeader !== apiKey) {
      res.status(401).json({ error: errorMessage });
      return;
    }
    if (validateApiKey) {
      const isValid = await validateApiKey(apiKeyHeader);
      if (!isValid) {
        res.status(401).json({ error: errorMessage });
        return;
      }
    }
    next();
  };
}
