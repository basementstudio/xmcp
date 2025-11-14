import * as z from "zod";

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
export const oauthConfigSchema = z.object({
  endpoints: oauthEndpointsSchema,
  issuerUrl: z.string(),
  baseUrl: z.string(),
  serviceDocumentationUrl: z.string().optional(),
  pathPrefix: z.string().prefault("/oauth2"),
  defaultScopes: z.array(z.string()).prefault(["openid", "profile", "email"]),
});

export type OAuthConfig = z.infer<typeof oauthConfigSchema>;
