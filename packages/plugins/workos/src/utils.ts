export const AUTHKIT_PATHS = {
  JWKS: "/oauth2/jwks",
  AUTHORIZE: "/oauth2/authorize",
  TOKEN: "/oauth2/token",
  OPENID_CONFIG: "/.well-known/openid-configuration",
} as const;

export function getAuthKitBaseUrl(authkitDomain: string): string {
  return `https://${authkitDomain}`;
}

export function getAuthKitUrl(authkitDomain: string, path: string): string {
  return `${getAuthKitBaseUrl(authkitDomain)}${path}`;
}

export function getJwksUrl(authkitDomain: string): string {
  return getAuthKitUrl(authkitDomain, AUTHKIT_PATHS.JWKS);
}

export function getAuthorizeUrl(authkitDomain: string): string {
  return getAuthKitUrl(authkitDomain, AUTHKIT_PATHS.AUTHORIZE);
}

export function getTokenUrl(authkitDomain: string): string {
  return getAuthKitUrl(authkitDomain, AUTHKIT_PATHS.TOKEN);
}

export function getOpenIdConfigUrl(authkitDomain: string): string {
  return getAuthKitUrl(authkitDomain, AUTHKIT_PATHS.OPENID_CONFIG);
}
