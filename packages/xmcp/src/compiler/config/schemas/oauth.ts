import { z } from "zod/v3";

export const oauthEndpointOverridesSchema = z.object({
  authorizationUrl: z.string().optional(),
  tokenUrl: z.string().optional(),
  registerUrl: z.string().optional(),
  revocationUrl: z.string().optional(),
  introspectionUrl: z.string().optional(),
});

export const oauthEndpointsSchema = z.object({
  authorizationUrl: z.string(),
  tokenUrl: z.string(),
  registerUrl: z.string(),
  revocationUrl: z.string().optional(),
  introspectionUrl: z.string().optional(),
});

const DEFAULT_OAUTH_CONFIG = {
  pathPrefix: "/oauth2",
  defaultScopes: ["openid", "profile", "email"],
  middleware: true,
  discovery: true,
} as const;

export const oauthConfigSchema = z
  .object({
    issuerUrl: z.string(),
    baseUrl: z.string(),
    endpoints: oauthEndpointOverridesSchema.optional(),
    serviceDocumentationUrl: z.string().optional(),
    pathPrefix: z.string().optional(),
    defaultScopes: z.array(z.string()).optional(),
    middleware: z.boolean().optional(),
    jwksUrl: z.string().optional(),
    introspectionClientId: z.string().optional(),
    introspectionClientSecret: z.string().optional(),
    discovery: z.boolean().optional(),
    audience: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .transform((value) => ({
    issuerUrl: value.issuerUrl,
    baseUrl: value.baseUrl,
    endpoints: value.endpoints ?? {},
    serviceDocumentationUrl: value.serviceDocumentationUrl,
    pathPrefix: value.pathPrefix ?? DEFAULT_OAUTH_CONFIG.pathPrefix,
    defaultScopes: value.defaultScopes ?? [...DEFAULT_OAUTH_CONFIG.defaultScopes],
    middleware: value.middleware ?? DEFAULT_OAUTH_CONFIG.middleware,
    jwksUrl: value.jwksUrl,
    introspectionClientId: value.introspectionClientId,
    introspectionClientSecret: value.introspectionClientSecret,
    discovery: value.discovery ?? DEFAULT_OAUTH_CONFIG.discovery,
    audience: value.audience,
  }));

export type OAuthConfig = z.infer<typeof oauthConfigSchema>;
