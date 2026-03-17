declare module "xmcp/headers" {
  export const headers: typeof import("../runtime/headers").headers;
}

declare module "xmcp/plugins/x402" {
  export const isPaidHandler: typeof import("../plugins/x402/index").isPaidHandler;
  export const getX402Registry: typeof import("../plugins/x402/index").getX402Registry;
  export type X402ToolOptions = import("../plugins/x402/index").X402ToolOptions;
  export type PaidHandler = import("../plugins/x402/index").PaidHandler;
}

declare module "xmcp/cloudflare" {
  export const apiKeyAuthMiddleware: typeof import("../runtime/platforms/cloudflare/middlewares/api-key").cloudflareApiKeyAuthMiddleware;
  export const jwtAuthMiddleware: typeof import("../runtime/platforms/cloudflare/middlewares/jwt").cloudflareJwtAuthMiddleware;
  export type JWTAuthMiddlewareConfig = import("../runtime/platforms/cloudflare/middlewares/jwt").CloudflareJWTAuthMiddlewareConfig;
  export type WebMiddleware = import("./middleware").WebMiddleware;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.less" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.less" {
  const content: string;
  export default content;
}
