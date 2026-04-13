import type {
  OAuthAudience,
  OAuthProxyConfig,
  OAuthEndpoints,
  OAuthProviderMetadata,
  ResolvedOAuthConfig,
} from "./types";

type AuthorizationServerDiscoveryDocument = {
  issuer?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  registration_endpoint?: string;
  revocation_endpoint?: string;
  introspection_endpoint?: string;
  jwks_uri?: string;
  token_endpoint_auth_methods_supported?: string[];
  scopes_supported?: string[];
  code_challenge_methods_supported?: string[];
  grant_types_supported?: string[];
  response_types_supported?: string[];
};

const DEFAULT_SCOPES = ["openid", "profile", "email"];
const DEFAULT_PATH_PREFIX = "/oauth2";
const DEFAULT_TOKEN_AUTH_METHODS = [
  "client_secret_post",
  "client_secret_basic",
];
const DEFAULT_CODE_CHALLENGE_METHODS = ["S256"];
const DEFAULT_GRANT_TYPES = ["authorization_code", "refresh_token"];
const DEFAULT_RESPONSE_TYPES = ["code"];

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function normalizePathPrefix(pathPrefix: string | undefined): string {
  if (!pathPrefix || pathPrefix === "/") {
    return DEFAULT_PATH_PREFIX;
  }

  return pathPrefix.startsWith("/") ? pathPrefix : `/${pathPrefix}`;
}

function buildWellKnownUrl(issuerUrl: string, suffix: string): string {
  const issuer = new URL(issuerUrl);
  const issuerPath = issuer.pathname === "/" ? "" : issuer.pathname.replace(/\/$/, "");
  issuer.pathname = `/.well-known/${suffix}${issuerPath}`;
  issuer.search = "";
  issuer.hash = "";
  return issuer.toString();
}

async function fetchDiscoveryDocument(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Discovery request failed with ${response.status}`);
  }

  return (await response.json()) as AuthorizationServerDiscoveryDocument;
}

async function discoverAuthorizationServerMetadata(
  issuerUrl: string
): Promise<AuthorizationServerDiscoveryDocument> {
  const candidates = [
    buildWellKnownUrl(issuerUrl, "oauth-authorization-server"),
    buildWellKnownUrl(issuerUrl, "openid-configuration"),
  ];
  const failures: string[] = [];

  for (const candidate of candidates) {
    try {
      return await fetchDiscoveryDocument(candidate);
    } catch (error) {
      failures.push(
        `${candidate}: ${error instanceof Error ? error.message : "unknown discovery error"}`
      );
    }
  }

  throw new Error(failures.join("; "));
}

function ensureRequiredEndpoints(
  endpoints: Partial<OAuthEndpoints>,
  discoveryError?: Error
): asserts endpoints is OAuthEndpoints {
  const missingFields = [
    !endpoints.authorizationUrl && "authorizationUrl",
    !endpoints.tokenUrl && "tokenUrl",
    !endpoints.registerUrl && "registerUrl",
  ].filter(Boolean) as string[];

  if (missingFields.length === 0) {
    return;
  }

  const message = discoveryError
    ? `OAuth startup failed. Discovery did not provide enough metadata and explicit overrides are incomplete. Missing ${missingFields.join(
        ", "
      )}. Discovery error: ${discoveryError.message}`
    : `OAuth startup failed. Missing required OAuth endpoints: ${missingFields.join(", ")}`;

  throw new Error(message);
}

function normalizeAudience(
  audience: OAuthAudience | undefined,
  resourceUrl: string
): OAuthAudience {
  if (Array.isArray(audience)) {
    return [...audience];
  }

  return audience ?? resourceUrl;
}

function normalizeMcpEndpoint(path: string | undefined): string {
  if (!path || path === "/") {
    return "/mcp";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function buildResourceUrl(baseUrl: string, mcpEndpoint: string | undefined) {
  return `${normalizeBaseUrl(baseUrl)}${normalizeMcpEndpoint(mcpEndpoint)}`;
}

export async function resolveOAuthConfig(
  config: OAuthProxyConfig
): Promise<ResolvedOAuthConfig> {
  const pathPrefix = normalizePathPrefix(config.pathPrefix);
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const resourceUrl = buildResourceUrl(baseUrl, config.mcpEndpoint);
  const issuerUrl = config.issuerUrl;
  const defaultScopes = config.defaultScopes ?? [...DEFAULT_SCOPES];

  let discoveryMetadata: AuthorizationServerDiscoveryDocument | undefined;
  let discoveryError: Error | undefined;

  if (config.discovery !== false) {
    try {
      discoveryMetadata = await discoverAuthorizationServerMetadata(issuerUrl);
    } catch (error) {
      discoveryError =
        error instanceof Error
          ? error
          : new Error("Unknown OAuth discovery error");
    }
  }

  const endpoints: Partial<OAuthEndpoints> = {
    authorizationUrl:
      config.endpoints?.authorizationUrl ??
      discoveryMetadata?.authorization_endpoint,
    tokenUrl: config.endpoints?.tokenUrl ?? discoveryMetadata?.token_endpoint,
    registerUrl:
      config.endpoints?.registerUrl ??
      discoveryMetadata?.registration_endpoint,
    revocationUrl:
      config.endpoints?.revocationUrl ??
      discoveryMetadata?.revocation_endpoint,
    introspectionUrl:
      config.endpoints?.introspectionUrl ??
      discoveryMetadata?.introspection_endpoint,
  };

  ensureRequiredEndpoints(endpoints, discoveryError);

  const providerMetadata: OAuthProviderMetadata = {
    issuer: discoveryMetadata?.issuer ?? issuerUrl,
    authorizationEndpoint: endpoints.authorizationUrl,
    tokenEndpoint: endpoints.tokenUrl,
    registrationEndpoint: endpoints.registerUrl,
    revocationEndpoint: endpoints.revocationUrl,
    introspectionEndpoint: endpoints.introspectionUrl,
    jwksUri: config.jwksUrl ?? discoveryMetadata?.jwks_uri,
    tokenEndpointAuthMethodsSupported:
      discoveryMetadata?.token_endpoint_auth_methods_supported ??
      DEFAULT_TOKEN_AUTH_METHODS,
    scopesSupported: discoveryMetadata?.scopes_supported ?? defaultScopes,
    codeChallengeMethodsSupported:
      discoveryMetadata?.code_challenge_methods_supported ??
      DEFAULT_CODE_CHALLENGE_METHODS,
    grantTypesSupported:
      discoveryMetadata?.grant_types_supported ?? DEFAULT_GRANT_TYPES,
    responseTypesSupported:
      discoveryMetadata?.response_types_supported ?? DEFAULT_RESPONSE_TYPES,
  };

  return {
    issuerUrl: providerMetadata.issuer,
    baseUrl,
    resourceUrl,
    endpoints,
    serviceDocumentationUrl: config.serviceDocumentationUrl,
    pathPrefix,
    defaultScopes,
    middleware: config.middleware ?? true,
    jwksUrl: providerMetadata.jwksUri,
    introspectionClientId: config.introspectionClientId,
    introspectionClientSecret: config.introspectionClientSecret,
    audience: normalizeAudience(config.audience, resourceUrl),
    providerMetadata,
  };
}
