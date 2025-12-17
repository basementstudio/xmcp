import { z } from "zod/v3";

// ------------------------------------------------------------
// OAuth endpoints schema
// ------------------------------------------------------------
export const oauthEndpointsSchema = z.object({
  authorizationUrl: z.string(),
  tokenUrl: z.string(),
  revocationUrl: z.string().optional(),
  userInfoUrl: z.string().optional(),
  registerUrl: z.string(),
});

export type OauthEndpoints = z.infer<typeof oauthEndpointsSchema>;

// ------------------------------------------------------------
// OAuth config schema
// ------------------------------------------------------------
// Base schema with defaults - used for parsing with defaults applied
const oauthConfigBaseSchema = z.object({
  endpoints: oauthEndpointsSchema,
  issuerUrl: z.string(),
  baseUrl: z.string(),
  serviceDocumentationUrl: z.string().optional(),
  pathPrefix: z.string().default("/oauth2"),
  defaultScopes: z.array(z.string()).default(["openid", "profile", "email"]),
});

// Input schema - required fields stay required, fields with defaults can be overridden
export const oauthConfigSchema = z
  .object({
    endpoints: oauthEndpointsSchema,
    issuerUrl: z.string(),
    baseUrl: z.string(),
    serviceDocumentationUrl: z.string().optional(),
    pathPrefix: z.string().optional(),
    defaultScopes: z.array(z.string()).optional(),
  })
  .transform((val) => {
    // Merge provided values with defaults for fields that have defaults
    const defaults = oauthConfigBaseSchema.parse({
      endpoints: val.endpoints,
      issuerUrl: val.issuerUrl,
      baseUrl: val.baseUrl,
    });
    // Filter out undefined values to avoid overwriting defaults
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    return {
      ...defaults,
      ...provided,
    };
  });

export type OAuthConfig = z.infer<typeof oauthConfigSchema>;
